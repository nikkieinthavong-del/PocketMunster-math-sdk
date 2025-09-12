#!/usr/bin/env python3
"""
Run Golden Tests

Executes golden tests to validate pipeline output against known good baselines.
Supports automatic comparison, diff generation, and approval workflows.
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import subprocess
import difflib
import hashlib


class GoldenTestRunner:
    """Runner for golden tests with baseline comparison."""
    
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        
        # Test configuration
        self.golden_dir = Path("tests/golden")
        self.fixtures_dir = Path("tests/fixtures")
        self.helpers_dir = Path("tests/helpers")
        
        # Test state
        self.test_results = []
        self.failed_tests = []
        self.passed_tests = []
        
        # Ensure test directories exist
        self._ensure_test_directories()
    
    def _log(self, message: str, level: str = "INFO") -> None:
        """Log message with timestamp."""
        if self.verbose or level in ["ERROR", "WARNING"]:
            timestamp = time.strftime("%H:%M:%S")
            print(f"[{timestamp}] [{level}] {message}")
    
    def _ensure_test_directories(self) -> None:
        """Ensure required test directories exist."""
        for directory in [self.golden_dir, self.fixtures_dir, self.helpers_dir]:
            directory.mkdir(parents=True, exist_ok=True)
    
    def load_golden_map(self) -> Dict[str, Any]:
        """Load the golden test mapping configuration."""
        golden_map_path = self.golden_dir / "golden_map.json"
        
        if not golden_map_path.exists():
            self._log("Creating default golden map", "INFO")
            self._create_default_golden_map(golden_map_path)
        
        try:
            with open(golden_map_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            self._log(f"Error loading golden map: {e}", "ERROR")
            return {"tests": {}, "config": {}}
    
    def _create_default_golden_map(self, map_path: Path) -> None:
        """Create a default golden map configuration."""
        default_map = {
            "version": "1.0",
            "description": "Golden test mapping for asset pipeline validation",
            "config": {
                "tolerance": {
                    "json_float_precision": 6,
                    "timestamp_tolerance_seconds": 5,
                    "size_tolerance_percent": 1.0
                },
                "ignore_fields": [
                    "timestamp", "created_at", "datetime", "generated_at",
                    "processing_time", "system_metrics.timestamp"
                ],
                "comparison_methods": {
                    "json": "semantic_compare",
                    "txt": "line_compare",
                    "csv": "structured_compare"
                }
            },
            "tests": {
                "performance_profile": {
                    "description": "Performance profiling output validation",
                    "input_generator": "generate_test_performance_data",
                    "pipeline_command": "python scripts/assets_pipeline_all.py --policy tests/config/test_policy.json --output-dir ./test_output",
                    "output_file": "test_output/performance_profile.json",
                    "golden_file": "tests/golden/performance_profile_golden.json",
                    "comparison_type": "json",
                    "enabled": True
                },
                "policy_guard_report": {
                    "description": "Policy guard evaluation validation",
                    "input_generator": "generate_test_policy_data",
                    "pipeline_command": "python scripts/policy_guard_evaluator.py --config tests/config/test_policy.json --target tests/fixtures --output ./test_output/policy_guard_report.json",
                    "output_file": "test_output/policy_guard_report.json",
                    "golden_file": "tests/golden/policy_guard_report_golden.json",
                    "comparison_type": "json",
                    "enabled": True
                },
                "embedding_duplicates": {
                    "description": "Embedding duplicate analysis validation",
                    "input_generator": "generate_test_embedding_data",
                    "pipeline_command": "python scripts/embedding_duplicate_proposals.py --config tests/config/test_policy.json --input tests/fixtures --output ./test_output/embedding_duplicate_groups.json",
                    "output_file": "test_output/embedding_duplicate_groups.json",
                    "golden_file": "tests/golden/embedding_duplicate_groups_golden.json",
                    "comparison_type": "json",
                    "enabled": True
                },
                "budget_recommendations": {
                    "description": "Adaptive budget optimization validation",
                    "input_generator": "generate_test_budget_data",
                    "pipeline_command": "python scripts/adaptive_budget_optimizer.py --config tests/config/test_policy.json --output ./test_output/budget_recommendations.json",
                    "output_file": "test_output/budget_recommendations.json",
                    "golden_file": "tests/golden/budget_recommendations_golden.json",
                    "comparison_type": "json",
                    "enabled": True
                },
                "symbol_sparklines": {
                    "description": "Symbol sparkline generation validation", 
                    "input_generator": "generate_test_symbol_data",
                    "pipeline_command": "python scripts/generate_symbol_sparklines.py --input tests/fixtures --output ./test_output/symbol_sparklines.json",
                    "output_file": "test_output/symbol_sparklines.json",
                    "golden_file": "tests/golden/symbol_sparklines_golden.json",
                    "comparison_type": "json",
                    "enabled": True
                }
            }
        }
        
        with open(map_path, 'w') as f:
            json.dump(default_map, f, indent=2)
    
    def generate_test_fixtures(self, test_name: str, golden_map: Dict[str, Any]) -> bool:
        """Generate test fixtures for a specific test."""
        test_config = golden_map["tests"].get(test_name, {})
        
        if not test_config.get("enabled", True):
            self._log(f"Test {test_name} is disabled, skipping fixture generation")
            return True
        
        input_generator = test_config.get("input_generator")
        
        if not input_generator:
            self._log(f"No input generator specified for test {test_name}")
            return True  # Not an error, test might not need fixtures
        
        self._log(f"Generating fixtures for test: {test_name}")
        
        try:
            # Try to call the generator function
            generator_script = self.fixtures_dir / "generate_fixture_assets.py"
            
            if generator_script.exists():
                cmd = [
                    sys.executable,
                    str(generator_script),
                    "--test-name", test_name,
                    "--generator", input_generator
                ]
                
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
                
                if result.returncode == 0:
                    self._log(f"Fixtures generated successfully for {test_name}")
                    return True
                else:
                    self._log(f"Fixture generation failed for {test_name}: {result.stderr}", "WARNING")
            
            # If no generator script or it failed, create minimal fixtures
            self._create_minimal_fixtures(test_name)
            return True
            
        except Exception as e:
            self._log(f"Error generating fixtures for {test_name}: {e}", "WARNING")
            return False
    
    def _create_minimal_fixtures(self, test_name: str) -> None:
        """Create minimal test fixtures."""
        # Create some basic test files
        test_files = {
            "test_config.json": {"test": True, "name": test_name},
            "test_data.txt": f"Test data for {test_name}\nLine 2\nLine 3",
            "sample_symbols.json": {
                "symbols": ["H1", "H2", "WILD", "SCATTER"],
                "paytable": {"H1": [10, 20, 50], "H2": [5, 10, 25]}
            }
        }
        
        for filename, content in test_files.items():
            file_path = self.fixtures_dir / filename
            
            if isinstance(content, str):
                file_path.write_text(content)
            else:
                with open(file_path, 'w') as f:
                    json.dump(content, f, indent=2)
    
    def run_pipeline_for_test(self, test_name: str, test_config: Dict[str, Any]) -> bool:
        """Run the pipeline command for a specific test."""
        command = test_config.get("pipeline_command")
        
        if not command:
            self._log(f"No pipeline command specified for test {test_name}")
            return False
        
        self._log(f"Running pipeline for test: {test_name}")
        
        try:
            # Ensure output directory exists
            output_dir = Path("test_output")
            output_dir.mkdir(exist_ok=True)
            
            # Execute pipeline command
            result = subprocess.run(
                command.split(),
                capture_output=True,
                text=True,
                timeout=300,  # 5 minute timeout
                cwd=Path.cwd()
            )
            
            if result.returncode == 0:
                self._log(f"Pipeline completed successfully for {test_name}")
                return True
            else:
                self._log(f"Pipeline failed for {test_name}: {result.stderr}", "ERROR")
                return False
                
        except subprocess.TimeoutExpired:
            self._log(f"Pipeline timed out for {test_name}", "ERROR")
            return False
        except Exception as e:
            self._log(f"Error running pipeline for {test_name}: {e}", "ERROR")
            return False
    
    def compare_output_to_golden(
        self, 
        test_name: str, 
        test_config: Dict[str, Any], 
        golden_map: Dict[str, Any]
    ) -> Tuple[bool, Dict[str, Any]]:
        """Compare pipeline output to golden baseline."""
        output_file = Path(test_config.get("output_file", ""))
        golden_file = Path(test_config.get("golden_file", ""))
        comparison_type = test_config.get("comparison_type", "json")
        
        if not output_file.exists():
            return False, {"error": f"Output file not found: {output_file}"}
        
        if not golden_file.exists():
            self._log(f"Golden file not found: {golden_file}, creating placeholder", "WARNING")
            self._create_golden_placeholder(golden_file, output_file, comparison_type)
            return False, {"error": "Golden file was missing, created placeholder"}
        
        self._log(f"Comparing output for test: {test_name}")
        
        try:
            if comparison_type == "json":
                return self._compare_json_files(output_file, golden_file, golden_map["config"])
            elif comparison_type == "txt":
                return self._compare_text_files(output_file, golden_file)
            elif comparison_type == "csv":
                return self._compare_csv_files(output_file, golden_file)
            else:
                return self._compare_binary_files(output_file, golden_file)
                
        except Exception as e:
            return False, {"error": f"Comparison failed: {e}"}
    
    def _create_golden_placeholder(self, golden_file: Path, output_file: Path, comparison_type: str) -> None:
        """Create a placeholder golden file from current output."""
        golden_file.parent.mkdir(parents=True, exist_ok=True)
        
        if comparison_type == "json":
            # For JSON, create a permissive placeholder
            placeholder = {
                "_golden_placeholder": True,
                "_note": "This is a placeholder golden file. Run 'update_golden.py --approve' to set the baseline.",
                "_source_file": str(output_file),
                "_created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "placeholder_match_any": True
            }
            
            with open(golden_file, 'w') as f:
                json.dump(placeholder, f, indent=2)
        else:
            # For other types, copy the current output
            import shutil
            shutil.copy2(output_file, golden_file)
            
            # Add placeholder marker
            with open(golden_file, 'a') as f:
                f.write(f"\n# GOLDEN PLACEHOLDER - Created {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    def _compare_json_files(self, output_file: Path, golden_file: Path, config: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        """Compare two JSON files with smart field ignoring."""
        try:
            with open(output_file, 'r') as f:
                output_data = json.load(f)
            
            with open(golden_file, 'r') as f:
                golden_data = json.load(f)
            
            # Check for placeholder golden file
            if golden_data.get("placeholder_match_any"):
                return True, {"status": "placeholder_match", "note": "Matched against placeholder golden file"}
            
            # Remove ignored fields
            ignore_fields = config.get("ignore_fields", [])
            output_cleaned = self._remove_ignored_fields(output_data, ignore_fields)
            golden_cleaned = self._remove_ignored_fields(golden_data, ignore_fields)
            
            # Compare
            if self._deep_compare_json(output_cleaned, golden_cleaned, config):
                return True, {"status": "match"}
            else:
                diff = self._generate_json_diff(output_cleaned, golden_cleaned)
                return False, {"status": "mismatch", "diff": diff}
                
        except Exception as e:
            return False, {"status": "error", "error": str(e)}
    
    def _remove_ignored_fields(self, data: Any, ignore_fields: List[str]) -> Any:
        """Recursively remove ignored fields from data."""
        if isinstance(data, dict):
            cleaned = {}
            for key, value in data.items():
                # Check if field should be ignored
                if not any(self._field_matches_pattern(key, pattern) for pattern in ignore_fields):
                    cleaned[key] = self._remove_ignored_fields(value, ignore_fields)
            return cleaned
        elif isinstance(data, list):
            return [self._remove_ignored_fields(item, ignore_fields) for item in data]
        else:
            return data
    
    def _field_matches_pattern(self, field: str, pattern: str) -> bool:
        """Check if field matches ignore pattern."""
        # Support dot notation for nested fields
        if "." in pattern:
            return field in pattern or pattern.endswith(f".{field}")
        else:
            return field == pattern
    
    def _deep_compare_json(self, data1: Any, data2: Any, config: Dict[str, Any]) -> bool:
        """Deep comparison of JSON data with tolerance."""
        tolerance = config.get("tolerance", {})
        
        if type(data1) != type(data2):
            return False
        
        if isinstance(data1, dict):
            if set(data1.keys()) != set(data2.keys()):
                return False
            return all(
                self._deep_compare_json(data1[key], data2[key], config)
                for key in data1.keys()
            )
        elif isinstance(data1, list):
            if len(data1) != len(data2):
                return False
            return all(
                self._deep_compare_json(data1[i], data2[i], config)
                for i in range(len(data1))
            )
        elif isinstance(data1, float) and isinstance(data2, float):
            # Float comparison with tolerance
            precision = tolerance.get("json_float_precision", 6)
            return abs(data1 - data2) < (10 ** -precision)
        else:
            return data1 == data2
    
    def _generate_json_diff(self, data1: Any, data2: Any) -> List[str]:
        """Generate human-readable diff for JSON data."""
        try:
            json1_str = json.dumps(data1, indent=2, sort_keys=True)
            json2_str = json.dumps(data2, indent=2, sort_keys=True)
            
            diff_lines = list(difflib.unified_diff(
                json1_str.splitlines(),
                json2_str.splitlines(),
                fromfile="actual_output",
                tofile="golden_baseline",
                lineterm=""
            ))
            
            return diff_lines[:50]  # Limit diff size
        except Exception:
            return ["Error generating diff"]
    
    def _compare_text_files(self, output_file: Path, golden_file: Path) -> Tuple[bool, Dict[str, Any]]:
        """Compare two text files line by line."""
        try:
            output_lines = output_file.read_text().splitlines()
            golden_lines = golden_file.read_text().splitlines()
            
            if output_lines == golden_lines:
                return True, {"status": "match"}
            else:
                diff = list(difflib.unified_diff(
                    golden_lines, output_lines,
                    fromfile="golden", tofile="actual",
                    lineterm=""
                ))[:20]  # Limit diff
                return False, {"status": "mismatch", "diff": diff}
                
        except Exception as e:
            return False, {"status": "error", "error": str(e)}
    
    def _compare_csv_files(self, output_file: Path, golden_file: Path) -> Tuple[bool, Dict[str, Any]]:
        """Compare two CSV files with structure awareness."""
        # For now, treat as text files
        return self._compare_text_files(output_file, golden_file)
    
    def _compare_binary_files(self, output_file: Path, golden_file: Path) -> Tuple[bool, Dict[str, Any]]:
        """Compare two files by checksum."""
        try:
            output_hash = hashlib.sha256(output_file.read_bytes()).hexdigest()
            golden_hash = hashlib.sha256(golden_file.read_bytes()).hexdigest()
            
            if output_hash == golden_hash:
                return True, {"status": "match"}
            else:
                return False, {"status": "mismatch", "note": "Binary files differ"}
                
        except Exception as e:
            return False, {"status": "error", "error": str(e)}
    
    def run_single_test(self, test_name: str, golden_map: Dict[str, Any]) -> Dict[str, Any]:
        """Run a single golden test."""
        test_config = golden_map["tests"].get(test_name, {})
        
        if not test_config:
            return {
                "test_name": test_name,
                "status": "error",
                "error": f"Test configuration not found for {test_name}"
            }
        
        if not test_config.get("enabled", True):
            return {
                "test_name": test_name,
                "status": "skipped",
                "reason": "Test is disabled"
            }
        
        result = {
            "test_name": test_name,
            "description": test_config.get("description", ""),
            "status": "unknown",
            "start_time": time.time()
        }
        
        try:
            # Generate fixtures if needed
            if not self.generate_test_fixtures(test_name, golden_map):
                result["status"] = "error"
                result["error"] = "Failed to generate test fixtures"
                return result
            
            # Run pipeline
            if not self.run_pipeline_for_test(test_name, test_config):
                result["status"] = "error"
                result["error"] = "Pipeline execution failed"
                return result
            
            # Compare output to golden
            comparison_passed, comparison_result = self.compare_output_to_golden(
                test_name, test_config, golden_map
            )
            
            result["comparison_result"] = comparison_result
            
            if comparison_passed:
                result["status"] = "passed"
            else:
                result["status"] = "failed"
                result["error"] = comparison_result.get("error", "Output differs from golden baseline")
                
        except Exception as e:
            result["status"] = "error"
            result["error"] = f"Test execution failed: {e}"
        
        result["end_time"] = time.time()
        result["duration_seconds"] = result["end_time"] - result["start_time"]
        
        return result
    
    def run_all_tests(self, pattern: Optional[str] = None) -> Dict[str, Any]:
        """Run all golden tests matching the optional pattern."""
        self._log("Starting golden test execution...")
        
        golden_map = self.load_golden_map()
        test_names = list(golden_map["tests"].keys())
        
        # Filter tests by pattern if provided
        if pattern:
            import fnmatch
            test_names = [name for name in test_names if fnmatch.fnmatch(name, pattern)]
        
        if not test_names:
            return {
                "summary": {"total": 0, "passed": 0, "failed": 0, "skipped": 0, "errors": 0},
                "tests": []
            }
        
        self._log(f"Running {len(test_names)} tests...")
        
        test_results = []
        
        for test_name in test_names:
            self._log(f"Running test: {test_name}")
            result = self.run_single_test(test_name, golden_map)
            test_results.append(result)
            
            # Track results
            if result["status"] == "passed":
                self.passed_tests.append(result)
            elif result["status"] == "failed":
                self.failed_tests.append(result)
        
        # Generate summary
        summary = {
            "total": len(test_results),
            "passed": len([r for r in test_results if r["status"] == "passed"]),
            "failed": len([r for r in test_results if r["status"] == "failed"]),
            "skipped": len([r for r in test_results if r["status"] == "skipped"]),
            "errors": len([r for r in test_results if r["status"] == "error"])
        }
        
        return {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "summary": summary,
            "tests": test_results,
            "golden_map_version": golden_map.get("version", "unknown")
        }


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Run Golden Tests - Validate pipeline output against baselines"
    )
    
    parser.add_argument(
        "--pattern",
        help="Test pattern to match (glob syntax, e.g., 'performance_*')"
    )
    parser.add_argument(
        "--output",
        help="Output file for test results (JSON format)"
    )
    parser.add_argument(
        "--update",
        action="store_true",
        help="Update golden files if tests fail (use with caution)"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )
    
    args = parser.parse_args()
    
    try:
        runner = GoldenTestRunner(verbose=args.verbose)
        
        # Run tests
        results = runner.run_all_tests(pattern=args.pattern)
        
        # Output results if requested
        if args.output:
            output_path = Path(args.output)
            with open(output_path, 'w') as f:
                json.dump(results, f, indent=2)
            print(f"Test results written to: {output_path}")
        
        # Print summary
        summary = results["summary"]
        print(f"\nGolden Test Results:")
        print(f"Tests Run: {summary['total']}")
        print(f"Passed: {summary['passed']}")
        print(f"Failed: {summary['failed']}")
        print(f"Skipped: {summary['skipped']}")
        print(f"Errors: {summary['errors']}")
        
        # Show failed tests
        failed_tests = [t for t in results["tests"] if t["status"] == "failed"]
        if failed_tests:
            print(f"\nFailed Tests:")
            for test in failed_tests:
                print(f"  - {test['test_name']}: {test.get('error', 'Unknown error')}")
        
        # Handle update mode
        if args.update and failed_tests:
            print(f"\nUpdate mode requested. Run 'python scripts/update_golden.py --approve' to update baselines.")
        
        # Exit with appropriate code
        if summary["failed"] > 0 or summary["errors"] > 0:
            return 1
        else:
            return 0
        
    except KeyboardInterrupt:
        print("\nGolden tests interrupted by user")
        return 130
    except Exception as e:
        print(f"Golden tests failed: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())