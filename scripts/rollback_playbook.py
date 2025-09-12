#!/usr/bin/env python3
"""
Rollback Playbook Generator

Generates comprehensive rollback procedures and recovery plans for asset
pipeline operations, including automated backup verification and restoration steps.
"""

import argparse
import json
import os
import sys
import time
import shutil
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import hashlib
import datetime
import subprocess


class RollbackPlaybookGenerator:
    """Generator for rollback playbooks and recovery procedures."""
    
    def __init__(self, config_path: str, verbose: bool = False):
        self.config_path = Path(config_path)
        self.verbose = verbose
        self.config = self._load_config()
        
        # Rollback configuration
        self.rollback_config = self.config.get("rollback_playbook", {})
        self.auto_rollback = self.rollback_config.get("auto_rollback_on_failure", True)
        self.backup_retention_days = self.rollback_config.get("backup_retention_days", 30)
        self.rollback_verification = self.rollback_config.get("rollback_verification", True)
        self.notification_channels = self.rollback_config.get("notification_channels", [])
        self.critical_failure_patterns = self.rollback_config.get("critical_failure_patterns", [])
        
        # Playbook state
        self.current_snapshot = None
        self.backup_manifest = {}
        self.rollback_procedures = []
        
    def _load_config(self) -> Dict[str, Any]:
        """Load rollback configuration."""
        try:
            with open(self.config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading configuration: {e}")
            sys.exit(1)
    
    def _log(self, message: str, level: str = "INFO") -> None:
        """Log message with timestamp."""
        if self.verbose or level in ["ERROR", "WARNING"]:
            timestamp = time.strftime("%H:%M:%S")
            print(f"[{timestamp}] [{level}] {message}")
    
    def create_system_snapshot(self, target_directories: List[str]) -> Dict[str, Any]:
        """Create a snapshot of the current system state."""
        self._log("Creating system snapshot...")
        
        snapshot = {
            "timestamp": time.time(),
            "datetime": time.strftime("%Y-%m-%d %H:%M:%S"),
            "snapshot_id": self._generate_snapshot_id(),
            "target_directories": target_directories,
            "files": {},
            "metadata": {
                "total_files": 0,
                "total_size_bytes": 0,
                "directory_structure": {}
            }
        }
        
        # Scan each target directory
        for target_dir in target_directories:
            target_path = Path(target_dir)
            if not target_path.exists():
                self._log(f"Target directory does not exist: {target_path}", "WARNING")
                continue
            
            self._log(f"Scanning directory: {target_path}")
            dir_snapshot = self._scan_directory(target_path)
            
            # Merge into main snapshot
            snapshot["files"].update(dir_snapshot["files"])
            snapshot["metadata"]["total_files"] += dir_snapshot["file_count"]
            snapshot["metadata"]["total_size_bytes"] += dir_snapshot["total_size"]
            snapshot["metadata"]["directory_structure"][str(target_path)] = dir_snapshot["structure"]
        
        self.current_snapshot = snapshot
        return snapshot
    
    def _generate_snapshot_id(self) -> str:
        """Generate unique snapshot identifier."""
        timestamp = str(time.time())
        return f"snapshot_{hashlib.md5(timestamp.encode()).hexdigest()[:12]}"
    
    def _scan_directory(self, directory: Path) -> Dict[str, Any]:
        """Scan directory and create file manifest."""
        files = {}
        file_count = 0
        total_size = 0
        structure = {}
        
        try:
            for item in directory.rglob("*"):
                if item.is_file():
                    try:
                        stat = item.stat()
                        file_info = {
                            "path": str(item),
                            "size": stat.st_size,
                            "modified_time": stat.st_mtime,
                            "checksum": self._calculate_file_checksum(item),
                            "permissions": oct(stat.st_mode)[-3:],
                            "relative_path": str(item.relative_to(directory))
                        }
                        
                        files[str(item)] = file_info
                        file_count += 1
                        total_size += stat.st_size
                        
                        # Build directory structure
                        parts = item.relative_to(directory).parts
                        current_level = structure
                        for part in parts[:-1]:  # Exclude filename
                            if part not in current_level:
                                current_level[part] = {}
                            current_level = current_level[part]
                        
                    except Exception as e:
                        self._log(f"Error scanning file {item}: {e}", "WARNING")
                        
        except Exception as e:
            self._log(f"Error scanning directory {directory}: {e}", "ERROR")
        
        return {
            "files": files,
            "file_count": file_count,
            "total_size": total_size,
            "structure": structure
        }
    
    def _calculate_file_checksum(self, file_path: Path) -> str:
        """Calculate MD5 checksum for a file."""
        try:
            hash_md5 = hashlib.md5()
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_md5.update(chunk)
            return hash_md5.hexdigest()
        except Exception:
            return ""
    
    def create_backup_manifest(self, snapshot: Dict[str, Any]) -> Dict[str, Any]:
        """Create backup manifest with restoration instructions."""
        self._log("Creating backup manifest...")
        
        backup_id = f"backup_{snapshot['snapshot_id']}"
        backup_timestamp = time.time()
        
        manifest = {
            "backup_id": backup_id,
            "snapshot_id": snapshot["snapshot_id"],
            "created_at": backup_timestamp,
            "created_datetime": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(backup_timestamp)),
            "expires_at": backup_timestamp + (self.backup_retention_days * 24 * 3600),
            "source_snapshot": snapshot,
            "backup_instructions": self._generate_backup_instructions(snapshot),
            "restoration_procedures": self._generate_restoration_procedures(snapshot),
            "verification_steps": self._generate_verification_steps(snapshot),
            "metadata": {
                "config_file": str(self.config_path),
                "auto_rollback_enabled": self.auto_rollback,
                "backup_retention_days": self.backup_retention_days,
                "critical_failure_patterns": self.critical_failure_patterns
            }
        }
        
        self.backup_manifest = manifest
        return manifest
    
    def _generate_backup_instructions(self, snapshot: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate step-by-step backup instructions."""
        instructions = []
        
        # Create backup directory
        backup_dir = f"./backups/{snapshot['snapshot_id']}"
        instructions.append({
            "step": 1,
            "action": "create_backup_directory",
            "command": f"mkdir -p {backup_dir}",
            "description": "Create backup directory structure",
            "critical": True
        })
        
        # Copy files with structure preservation
        for target_dir in snapshot["target_directories"]:
            target_path = Path(target_dir)
            if target_path.exists():
                backup_target = f"{backup_dir}/{target_path.name}"
                
                instructions.append({
                    "step": len(instructions) + 1,
                    "action": "backup_directory",
                    "command": f"cp -r {target_dir} {backup_target}",
                    "description": f"Backup directory: {target_dir}",
                    "source": str(target_dir),
                    "destination": backup_target,
                    "critical": True
                })
        
        # Create file manifest
        manifest_file = f"{backup_dir}/file_manifest.json"
        instructions.append({
            "step": len(instructions) + 1,
            "action": "create_manifest",
            "command": f"echo '{json.dumps(snapshot['files'], indent=2)}' > {manifest_file}",
            "description": "Create file manifest for integrity verification",
            "output_file": manifest_file,
            "critical": True
        })
        
        # Verify backup integrity
        instructions.append({
            "step": len(instructions) + 1,
            "action": "verify_backup",
            "command": f"find {backup_dir} -type f | wc -l",
            "description": "Verify backup file count",
            "expected_files": snapshot["metadata"]["total_files"],
            "critical": True
        })
        
        return instructions
    
    def _generate_restoration_procedures(self, snapshot: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate step-by-step restoration procedures."""
        procedures = []
        
        backup_dir = f"./backups/{snapshot['snapshot_id']}"
        
        # Pre-restoration checks
        procedures.append({
            "step": 1,
            "phase": "pre_restoration",
            "action": "verify_backup_exists",
            "command": f"test -d {backup_dir}",
            "description": "Verify backup directory exists",
            "critical": True,
            "failure_action": "abort_restoration"
        })
        
        procedures.append({
            "step": 2,
            "phase": "pre_restoration", 
            "action": "verify_backup_integrity",
            "command": f"test -f {backup_dir}/file_manifest.json",
            "description": "Verify backup manifest exists",
            "critical": True,
            "failure_action": "abort_restoration"
        })
        
        # Create current state backup before restoration
        procedures.append({
            "step": 3,
            "phase": "pre_restoration",
            "action": "backup_current_state",
            "command": f"mkdir -p ./backups/pre_restore_{int(time.time())} && cp -r . ./backups/pre_restore_{int(time.time())}/",
            "description": "Backup current state before restoration", 
            "critical": False,
            "failure_action": "warn_and_continue"
        })
        
        # Stop services (if applicable)
        procedures.append({
            "step": 4,
            "phase": "preparation",
            "action": "stop_services",
            "command": "# Add service stop commands here if needed",
            "description": "Stop running services to prevent conflicts",
            "critical": False,
            "failure_action": "warn_and_continue"
        })
        
        # Restore files
        for i, target_dir in enumerate(snapshot["target_directories"]):
            target_path = Path(target_dir)
            backup_source = f"{backup_dir}/{target_path.name}"
            
            # Remove current directory
            procedures.append({
                "step": len(procedures) + 1,
                "phase": "restoration",
                "action": "remove_current",
                "command": f"rm -rf {target_dir}",
                "description": f"Remove current directory: {target_dir}",
                "critical": True,
                "failure_action": "abort_restoration"
            })
            
            # Restore from backup
            procedures.append({
                "step": len(procedures) + 1,
                "phase": "restoration",
                "action": "restore_directory",
                "command": f"cp -r {backup_source} {target_dir}",
                "description": f"Restore directory from backup: {target_dir}",
                "critical": True,
                "failure_action": "abort_restoration"
            })
        
        # Post-restoration verification
        procedures.append({
            "step": len(procedures) + 1,
            "phase": "post_restoration",
            "action": "verify_file_count",
            "command": f"find {' '.join(snapshot['target_directories'])} -type f | wc -l",
            "description": "Verify restored file count matches backup",
            "expected_result": str(snapshot["metadata"]["total_files"]),
            "critical": True,
            "failure_action": "report_verification_failure"
        })
        
        # Restart services
        procedures.append({
            "step": len(procedures) + 1,
            "phase": "post_restoration",
            "action": "restart_services", 
            "command": "# Add service restart commands here if needed",
            "description": "Restart services after restoration",
            "critical": False,
            "failure_action": "manual_intervention_required"
        })
        
        return procedures
    
    def _generate_verification_steps(self, snapshot: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate verification steps for rollback validation."""
        steps = []
        
        # File existence verification
        steps.append({
            "type": "file_existence",
            "description": "Verify all expected files exist after rollback",
            "method": "file_count_check",
            "expected_files": snapshot["metadata"]["total_files"],
            "tolerance": 0
        })
        
        # File integrity verification
        steps.append({
            "type": "file_integrity",
            "description": "Verify file checksums match backup manifest",
            "method": "checksum_verification",
            "sample_size": min(100, len(snapshot["files"])),  # Check up to 100 files
            "critical_files": self._identify_critical_files(snapshot)
        })
        
        # Directory structure verification
        steps.append({
            "type": "directory_structure",
            "description": "Verify directory structure is intact",
            "method": "structure_comparison",
            "expected_structure": snapshot["metadata"]["directory_structure"]
        })
        
        # Functional verification (if applicable)
        steps.append({
            "type": "functional_verification", 
            "description": "Run basic functional tests to verify system operation",
            "method": "smoke_tests",
            "tests": [
                {"name": "config_validation", "command": "python -c 'import json; json.load(open(\"config.json\"))'"},
                {"name": "import_test", "command": "python -c 'import sys; sys.path.append(\".\"); import pocketmon_pipeline'"}
            ]
        })
        
        return steps
    
    def _identify_critical_files(self, snapshot: Dict[str, Any]) -> List[str]:
        """Identify critical files that must be verified during rollback."""
        critical_files = []
        
        critical_patterns = [
            "config",
            "manifest",
            "__init__.py",
            "requirements",
            "setup.py",
            "pyproject.toml"
        ]
        
        for file_path, file_info in snapshot["files"].items():
            file_lower = file_path.lower()
            if any(pattern in file_lower for pattern in critical_patterns):
                critical_files.append(file_path)
        
        return critical_files[:50]  # Limit to 50 critical files
    
    def generate_failure_detection_rules(self) -> List[Dict[str, Any]]:
        """Generate rules for detecting when rollback should be triggered."""
        rules = []
        
        # Critical failure pattern rules
        for pattern in self.critical_failure_patterns:
            rules.append({
                "type": "pattern_match",
                "pattern": pattern,
                "severity": "critical",
                "action": "immediate_rollback",
                "description": f"Critical failure pattern detected: {pattern}"
            })
        
        # Performance degradation rules
        perf_benchmarks = self.config.get("performance_benchmarks", {})
        
        if "max_memory_usage_mb" in perf_benchmarks:
            rules.append({
                "type": "memory_threshold",
                "threshold": perf_benchmarks["max_memory_usage_mb"],
                "severity": "high",
                "action": "rollback_consideration",
                "description": "Memory usage exceeds configured threshold"
            })
        
        if "max_processing_time_seconds" in perf_benchmarks:
            rules.append({
                "type": "processing_time",
                "threshold": perf_benchmarks["max_processing_time_seconds"],
                "severity": "medium",
                "action": "rollback_consideration", 
                "description": "Processing time exceeds configured threshold"
            })
        
        # File system rules
        rules.append({
            "type": "file_corruption",
            "indicators": ["checksum_mismatch", "read_error", "permission_denied"],
            "severity": "critical",
            "action": "immediate_rollback",
            "description": "File system corruption detected"
        })
        
        rules.append({
            "type": "missing_critical_files",
            "file_patterns": ["*config*", "*manifest*", "*.py"],
            "severity": "critical",
            "action": "immediate_rollback",
            "description": "Critical files missing after operation"
        })
        
        return rules
    
    def generate_rollback_playbook(self, target_directories: List[str]) -> Dict[str, Any]:
        """Generate comprehensive rollback playbook."""
        self._log("Generating rollback playbook...")
        
        # Create system snapshot
        snapshot = self.create_system_snapshot(target_directories)
        
        # Create backup manifest
        backup_manifest = self.create_backup_manifest(snapshot)
        
        # Generate failure detection rules
        failure_rules = self.generate_failure_detection_rules()
        
        # Create playbook
        playbook = {
            "playbook_id": f"rollback_{int(time.time())}",
            "created_at": time.time(),
            "created_datetime": time.strftime("%Y-%m-%d %H:%M:%S"),
            "version": "1.0",
            "configuration": {
                "config_file": str(self.config_path),
                "auto_rollback_enabled": self.auto_rollback,
                "backup_retention_days": self.backup_retention_days,
                "rollback_verification_enabled": self.rollback_verification,
                "notification_channels": self.notification_channels
            },
            "system_snapshot": snapshot,
            "backup_manifest": backup_manifest,
            "failure_detection_rules": failure_rules,
            "rollback_procedures": backup_manifest["restoration_procedures"],
            "verification_steps": backup_manifest["verification_steps"],
            "emergency_contacts": self._get_emergency_contacts(),
            "documentation": {
                "overview": "Comprehensive rollback playbook for asset pipeline operations",
                "usage": "Execute rollback procedures in order when failure conditions are met",
                "prerequisites": ["Backup verification", "Service impact assessment", "Stakeholder notification"],
                "estimated_rollback_time": self._estimate_rollback_time(snapshot)
            }
        }
        
        return playbook
    
    def _get_emergency_contacts(self) -> List[Dict[str, str]]:
        """Get emergency contact information."""
        # This would typically come from configuration or external system
        return [
            {
                "role": "System Administrator",
                "contact": "sysadmin@company.com",
                "phone": "+1-555-0123"
            },
            {
                "role": "Development Team Lead", 
                "contact": "devlead@company.com",
                "phone": "+1-555-0124"
            }
        ]
    
    def _estimate_rollback_time(self, snapshot: Dict[str, Any]) -> str:
        """Estimate time required for rollback operation."""
        file_count = snapshot["metadata"]["total_files"]
        size_mb = snapshot["metadata"]["total_size_bytes"] / 1024 / 1024
        
        # Simple estimation based on file count and size
        if file_count < 100 and size_mb < 100:
            return "5-10 minutes"
        elif file_count < 1000 and size_mb < 1000:
            return "10-30 minutes"
        else:
            return "30+ minutes"


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Rollback Playbook Generator - Recovery procedure automation"
    )
    
    parser.add_argument(
        "--config",
        required=True,
        help="Path to configuration file"
    )
    parser.add_argument(
        "--target-dirs",
        nargs="+",
        default=["./"],
        help="Target directories to include in rollback planning"
    )
    parser.add_argument(
        "--output",
        help="Output file for rollback playbook (JSON format)"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )
    
    args = parser.parse_args()
    
    try:
        generator = RollbackPlaybookGenerator(args.config, verbose=args.verbose)
        
        # Generate playbook
        playbook = generator.generate_rollback_playbook(args.target_dirs)
        
        # Output results
        if args.output:
            output_path = Path(args.output)
            with open(output_path, 'w') as f:
                json.dump(playbook, f, indent=2)
            print(f"Rollback playbook written to: {output_path}")
        else:
            print(json.dumps(playbook, indent=2))
        
        # Print summary
        print(f"\nRollback Playbook Summary:")
        print(f"Playbook ID: {playbook['playbook_id']}")
        print(f"Target Directories: {len(args.target_dirs)}")
        print(f"Files Covered: {playbook['system_snapshot']['metadata']['total_files']}")
        print(f"Total Size: {playbook['system_snapshot']['metadata']['total_size_bytes'] / 1024 / 1024:.1f} MB")
        print(f"Restoration Steps: {len(playbook['rollback_procedures'])}")
        print(f"Failure Detection Rules: {len(playbook['failure_detection_rules'])}")
        print(f"Estimated Rollback Time: {playbook['documentation']['estimated_rollback_time']}")
        
        return 0
        
    except KeyboardInterrupt:
        print("\nRollback playbook generation interrupted by user")
        return 130
    except Exception as e:
        print(f"Rollback playbook generation failed: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())