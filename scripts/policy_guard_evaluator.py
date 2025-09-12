#!/usr/bin/env python3
"""
Policy Guard Evaluator

Evaluates policy compliance using DSL-based rules and generates violation reports.
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, Any, List, Optional, Set
import re
import hashlib


class PolicyGuardEvaluator:
    """Policy compliance evaluator with DSL-based rules."""
    
    def __init__(self, config_path: str, verbose: bool = False):
        self.config_path = Path(config_path)
        self.verbose = verbose
        self.config = self._load_config()
        
        # Policy enforcement configuration
        self.enforcement_level = self.config.get("policy_guard", {}).get("enforcement_level", "strict")
        self.allowed_operations = set(self.config.get("policy_guard", {}).get("allowed_operations", []))
        self.blocked_operations = set(self.config.get("policy_guard", {}).get("blocked_operations", []))
        self.audit_logging = self.config.get("policy_guard", {}).get("audit_logging", True)
        
        # Violation tracking
        self.violations = []
        self.warnings = []
        self.audit_log = []
    
    def _load_config(self) -> Dict[str, Any]:
        """Load policy configuration."""
        try:
            with open(self.config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading policy configuration: {e}")
            sys.exit(1)
    
    def _log(self, message: str, level: str = "INFO") -> None:
        """Log message with audit trail."""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        log_entry = {
            "timestamp": timestamp,
            "level": level,
            "message": message
        }
        
        if self.audit_logging:
            self.audit_log.append(log_entry)
        
        if self.verbose or level in ["ERROR", "WARNING", "VIOLATION"]:
            print(f"[{timestamp}] [{level}] {message}")
    
    def _add_violation(self, rule: str, description: str, severity: str = "medium", 
                      file_path: Optional[str] = None, details: Optional[Dict] = None) -> None:
        """Add a policy violation."""
        violation = {
            "rule": rule,
            "description": description,
            "severity": severity,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "file_path": file_path,
            "details": details or {}
        }
        
        self.violations.append(violation)
        self._log(f"VIOLATION: {rule} - {description}", "VIOLATION")
    
    def _add_warning(self, rule: str, description: str, file_path: Optional[str] = None) -> None:
        """Add a policy warning."""
        warning = {
            "rule": rule,
            "description": description,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "file_path": file_path
        }
        
        self.warnings.append(warning)
        self._log(f"WARNING: {rule} - {description}", "WARNING")
    
    def evaluate_file_compliance(self, file_path: Path) -> Dict[str, Any]:
        """Evaluate compliance for a single file."""
        self._log(f"Evaluating file: {file_path}")
        
        file_violations = []
        file_warnings = []
        
        try:
            # Check file existence and accessibility
            if not file_path.exists():
                self._add_violation(
                    "FILE_EXISTENCE", 
                    f"File does not exist: {file_path}",
                    severity="high",
                    file_path=str(file_path)
                )
                return {"violations": 1, "warnings": 0}
            
            # Get file stats
            stat = file_path.stat()
            file_size = stat.st_size
            
            # Check file size limits
            quality_thresholds = self.config.get("quality_thresholds", {})
            min_size = quality_thresholds.get("min_file_size", 0)
            max_size = quality_thresholds.get("max_file_size", 100 * 1024 * 1024)  # 100MB default
            
            if file_size < min_size:
                self._add_violation(
                    "FILE_SIZE_TOO_SMALL",
                    f"File size ({file_size} bytes) below minimum ({min_size} bytes)",
                    severity="medium",
                    file_path=str(file_path),
                    details={"actual_size": file_size, "min_size": min_size}
                )
            
            if file_size > max_size:
                self._add_violation(
                    "FILE_SIZE_TOO_LARGE",
                    f"File size ({file_size} bytes) exceeds maximum ({max_size} bytes)",
                    severity="high",
                    file_path=str(file_path),
                    details={"actual_size": file_size, "max_size": max_size}
                )
            
            # Check file format
            allowed_formats = quality_thresholds.get("allowed_formats", [])
            if allowed_formats and file_path.suffix not in allowed_formats:
                self._add_violation(
                    "INVALID_FILE_FORMAT",
                    f"File format '{file_path.suffix}' not in allowed formats: {allowed_formats}",
                    severity="medium",
                    file_path=str(file_path),
                    details={"file_format": file_path.suffix, "allowed_formats": allowed_formats}
                )
            
            # Check content-specific rules
            if file_path.suffix in ['.json', '.py', '.md', '.yaml', '.yml']:
                self._evaluate_text_file_content(file_path)
            
            # Check for sensitive patterns (basic security check)
            self._check_security_patterns(file_path)
            
        except Exception as e:
            self._add_violation(
                "FILE_EVALUATION_ERROR",
                f"Error evaluating file: {e}",
                severity="high",
                file_path=str(file_path),
                details={"error": str(e)}
            )
        
        return {
            "violations": len([v for v in self.violations if v.get("file_path") == str(file_path)]),
            "warnings": len([w for w in self.warnings if w.get("file_path") == str(file_path)])
        }
    
    def _evaluate_text_file_content(self, file_path: Path) -> None:
        """Evaluate content-specific rules for text files."""
        try:
            # Read file content
            encoding = self.config.get("quality_thresholds", {}).get("encoding", "utf-8")
            content = file_path.read_text(encoding=encoding)
            
            # Check line length limits
            max_line_length = self.config.get("quality_thresholds", {}).get("max_line_length", 1000)
            lines = content.split('\n')
            
            for line_num, line in enumerate(lines, 1):
                if len(line) > max_line_length:
                    self._add_warning(
                        "LINE_TOO_LONG",
                        f"Line {line_num} exceeds maximum length ({len(line)} > {max_line_length})",
                        file_path=str(file_path)
                    )
            
            # JSON-specific validation
            if file_path.suffix == '.json':
                self._validate_json_content(file_path, content)
            
            # Python-specific validation  
            elif file_path.suffix == '.py':
                self._validate_python_content(file_path, content)
            
        except UnicodeDecodeError:
            self._add_violation(
                "ENCODING_ERROR",
                f"File encoding not compatible with {encoding}",
                severity="medium",
                file_path=str(file_path)
            )
        except Exception as e:
            self._add_warning(
                "CONTENT_EVALUATION_ERROR",
                f"Error evaluating content: {e}",
                file_path=str(file_path)
            )
    
    def _validate_json_content(self, file_path: Path, content: str) -> None:
        """Validate JSON file content."""
        try:
            data = json.loads(content)
            
            # Check for required metadata fields
            validation_rules = self.config.get("validation_rules", {})
            required_fields = validation_rules.get("required_metadata_fields", [])
            
            if isinstance(data, dict) and required_fields:
                for field in required_fields:
                    if field not in data:
                        self._add_warning(
                            "MISSING_METADATA_FIELD",
                            f"Missing required metadata field: {field}",
                            file_path=str(file_path)
                        )
            
        except json.JSONDecodeError as e:
            self._add_violation(
                "INVALID_JSON",
                f"Invalid JSON syntax: {e}",
                severity="high",
                file_path=str(file_path),
                details={"json_error": str(e)}
            )
    
    def _validate_python_content(self, file_path: Path, content: str) -> None:
        """Validate Python file content."""
        try:
            # Basic syntax check
            compile(content, str(file_path), 'exec')
            
        except SyntaxError as e:
            self._add_violation(
                "PYTHON_SYNTAX_ERROR",
                f"Python syntax error: {e}",
                severity="high",
                file_path=str(file_path),
                details={"syntax_error": str(e), "line": e.lineno}
            )
    
    def _check_security_patterns(self, file_path: Path) -> None:
        """Check for basic security patterns."""
        try:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
            
            # Common sensitive patterns
            sensitive_patterns = [
                (r'password\s*=\s*["\'][^"\']+["\']', "HARDCODED_PASSWORD"),
                (r'api[_-]?key\s*=\s*["\'][^"\']+["\']', "HARDCODED_API_KEY"),
                (r'secret\s*=\s*["\'][^"\']+["\']', "HARDCODED_SECRET"),
                (r'token\s*=\s*["\'][^"\']+["\']', "HARDCODED_TOKEN"),
            ]
            
            for pattern, violation_type in sensitive_patterns:
                if re.search(pattern, content, re.IGNORECASE):
                    self._add_violation(
                        violation_type,
                        f"Potential sensitive data found in file",
                        severity="critical",
                        file_path=str(file_path)
                    )
                    
        except Exception:
            # Ignore errors in security pattern checking
            pass
    
    def evaluate_directory_compliance(self, target_path: Path) -> Dict[str, Any]:
        """Evaluate compliance for a directory recursively."""
        self._log(f"Evaluating directory: {target_path}")
        
        total_files = 0
        evaluated_files = 0
        
        if target_path.is_file():
            # Single file evaluation
            self.evaluate_file_compliance(target_path)
            total_files = evaluated_files = 1
        else:
            # Directory evaluation
            for file_path in target_path.rglob('*'):
                if file_path.is_file():
                    total_files += 1
                    
                    # Skip certain directories/files
                    skip_patterns = ['.git', '__pycache__', '*.pyc', '*.pyo', 'node_modules']
                    
                    should_skip = False
                    for pattern in skip_patterns:
                        if pattern in str(file_path):
                            should_skip = True
                            break
                    
                    if should_skip:
                        continue
                    
                    self.evaluate_file_compliance(file_path)
                    evaluated_files += 1
        
        return {
            "total_files": total_files,
            "evaluated_files": evaluated_files,
            "violations": len(self.violations),
            "warnings": len(self.warnings)
        }
    
    def generate_report(self, output_path: Optional[Path] = None) -> Dict[str, Any]:
        """Generate compliance report."""
        
        # Categorize violations by severity
        violations_by_severity = {}
        for violation in self.violations:
            severity = violation["severity"]
            if severity not in violations_by_severity:
                violations_by_severity[severity] = []
            violations_by_severity[severity].append(violation)
        
        # Calculate compliance score
        total_checks = len(self.violations) + len(self.warnings) + 1  # +1 to avoid division by zero
        violation_weight = {"critical": 10, "high": 5, "medium": 2, "low": 1}
        
        total_penalty = sum(
            violation_weight.get(v["severity"], 1) for v in self.violations
        )
        
        compliance_score = max(0, 100 - (total_penalty * 100 / total_checks))
        
        # Determine overall status
        if not self.violations:
            status = "COMPLIANT"
        elif any(v["severity"] == "critical" for v in self.violations):
            status = "CRITICAL_VIOLATIONS"
        elif any(v["severity"] == "high" for v in self.violations):
            status = "HIGH_VIOLATIONS"
        else:
            status = "MINOR_VIOLATIONS"
        
        report = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "policy_config": str(self.config_path),
            "enforcement_level": self.enforcement_level,
            "evaluation_summary": {
                "status": status,
                "compliance_score": round(compliance_score, 2),
                "total_violations": len(self.violations),
                "total_warnings": len(self.warnings),
                "violations_by_severity": {
                    severity: len(viols) 
                    for severity, viols in violations_by_severity.items()
                }
            },
            "violations": self.violations,
            "warnings": self.warnings,
            "recommendations": self._generate_recommendations(),
            "audit_log": self.audit_log if self.audit_logging else []
        }
        
        if output_path:
            with open(output_path, 'w') as f:
                json.dump(report, f, indent=2)
            self._log(f"Policy guard report written to: {output_path}")
        
        return report
    
    def _generate_recommendations(self) -> List[Dict[str, str]]:
        """Generate recommendations based on violations."""
        recommendations = []
        
        # Group violations by type
        violation_types = {}
        for violation in self.violations:
            rule = violation["rule"]
            if rule not in violation_types:
                violation_types[rule] = 0
            violation_types[rule] += 1
        
        # Generate recommendations
        for rule, count in violation_types.items():
            if rule == "FILE_SIZE_TOO_LARGE":
                recommendations.append({
                    "rule": rule,
                    "recommendation": "Consider splitting large files or compressing data to reduce file size.",
                    "priority": "medium"
                })
            elif rule == "INVALID_JSON":
                recommendations.append({
                    "rule": rule,
                    "recommendation": "Validate JSON files using a JSON schema validator before committing.",
                    "priority": "high"
                })
            elif rule == "HARDCODED_PASSWORD" or "SECRET" in rule:
                recommendations.append({
                    "rule": rule,
                    "recommendation": "Move sensitive data to environment variables or secure configuration management.",
                    "priority": "critical"
                })
            elif rule == "PYTHON_SYNTAX_ERROR":
                recommendations.append({
                    "rule": rule,
                    "recommendation": "Use a Python linter or IDE with syntax checking enabled.",
                    "priority": "high"
                })
        
        return recommendations


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Policy Guard Evaluator - DSL-based policy compliance checker"
    )
    
    parser.add_argument(
        "--config",
        required=True,
        help="Path to policy configuration file"
    )
    parser.add_argument(
        "--target",
        required=True,
        help="Target directory or file to evaluate"
    )
    parser.add_argument(
        "--output",
        help="Output file for policy report (JSON format)"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )
    
    args = parser.parse_args()
    
    try:
        evaluator = PolicyGuardEvaluator(args.config, verbose=args.verbose)
        
        target_path = Path(args.target)
        if not target_path.exists():
            print(f"Error: Target path does not exist: {target_path}")
            return 1
        
        # Run evaluation
        evaluation_result = evaluator.evaluate_directory_compliance(target_path)
        
        # Generate report
        output_path = Path(args.output) if args.output else None
        report = evaluator.generate_report(output_path)
        
        # Print summary
        summary = report["evaluation_summary"]
        print(f"\nPolicy Compliance Evaluation Complete:")
        print(f"Status: {summary['status']}")
        print(f"Compliance Score: {summary['compliance_score']}%")
        print(f"Violations: {summary['total_violations']}")
        print(f"Warnings: {summary['total_warnings']}")
        
        # Exit with appropriate code
        if summary["status"] == "CRITICAL_VIOLATIONS":
            return 19  # Critical policy violations
        elif summary["total_violations"] > 0:
            return 1   # General policy violations
        else:
            return 0   # No violations
        
    except KeyboardInterrupt:
        print("\nPolicy evaluation interrupted by user")
        return 130
    except Exception as e:
        print(f"Policy evaluation failed: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())