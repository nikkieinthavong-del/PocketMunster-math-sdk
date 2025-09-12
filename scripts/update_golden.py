#!/usr/bin/env python3
"""
Update Golden Files

Updates golden test baselines with new output. Provides safety mechanisms
to review changes before approving updates to prevent regressions.
"""

import argparse
import json
import sys
import time
import shutil
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import subprocess
import difflib


class GoldenUpdater:
    """Updater for golden test baseline files."""
    
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        
        # Test infrastructure paths
        self.golden_dir = Path("tests/golden")
        self.test_output_dir = Path("test_output")
        
        # Update tracking
        self.pending_updates = []
        self.approved_updates = []
        self.failed_updates = []
        
    def _log(self, message: str, level: str = "INFO") -> None:
        """Log message with timestamp."""
        if self.verbose or level in ["ERROR", "WARNING"]:
            timestamp = time.strftime("%H:%M:%S")
            print(f"[{timestamp}] [{level}] {message}")
    
    def load_golden_map(self) -> Dict[str, Any]:
        """Load the golden test mapping."""
        golden_map_path = self.golden_dir / "golden_map.json"
        
        if not golden_map_path.exists():
            raise FileNotFoundError(f"Golden map not found: {golden_map_path}")
        
        try:
            with open(golden_map_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            raise Exception(f"Error loading golden map: {e}")
    
    def run_golden_tests(self, pattern: Optional[str] = None) -> Dict[str, Any]:
        """Run golden tests to identify failed tests that need updates."""
        self._log("Running golden tests to identify update candidates...")
        
        cmd = [sys.executable, "scripts/run_golden_tests.py", "--output", "test_results.json"]
        
        if pattern:
            cmd.extend(["--pattern", pattern])
        
        if self.verbose:
            cmd.append("--verbose")
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
            
            # Load results even if tests failed (that's expected for updates)
            results_file = Path("test_results.json")
            if results_file.exists():
                with open(results_file, 'r') as f:
                    return json.load(f)
            else:
                return {"summary": {"total": 0, "failed": 0}, "tests": []}
                
        except subprocess.TimeoutExpired:
            self._log("Golden tests timed out", "ERROR")
            return {"summary": {"total": 0, "failed": 0}, "tests": []}
        except Exception as e:
            self._log(f"Error running golden tests: {e}", "ERROR")
            return {"summary": {"total": 0, "failed": 0}, "tests": []}
    
    def analyze_test_failures(self, test_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Analyze failed tests to determine what needs updating."""
        self._log("Analyzing test failures...")
        
        failed_tests = [
            test for test in test_results.get("tests", [])
            if test.get("status") == "failed"
        ]
        
        update_candidates = []
        
        for failed_test in failed_tests:
            test_name = failed_test["test_name"]
            
            # Check if failure is due to missing/outdated golden file
            comparison_result = failed_test.get("comparison_result", {})
            
            if (comparison_result.get("status") == "error" and 
                "Golden file was missing" in comparison_result.get("error", "")):
                
                # Missing golden file - definite update candidate
                update_candidates.append({
                    "test_name": test_name,
                    "reason": "missing_golden",
                    "description": "Golden file does not exist",
                    "priority": "high",
                    "update_needed": True
                })
                
            elif comparison_result.get("status") == "mismatch":
                # Output differs from golden - potential update candidate
                update_candidates.append({
                    "test_name": test_name,
                    "reason": "output_mismatch", 
                    "description": "Test output differs from golden baseline",
                    "priority": "medium",
                    "update_needed": True,
                    "diff": comparison_result.get("diff", [])[:10]  # First 10 diff lines
                })
                
            else:
                # Other failure type - investigate further
                update_candidates.append({
                    "test_name": test_name,
                    "reason": "other_failure",
                    "description": failed_test.get("error", "Unknown failure"),
                    "priority": "low",
                    "update_needed": False
                })
        
        self._log(f"Found {len(update_candidates)} update candidates")
        return update_candidates
    
    def preview_updates(self, golden_map: Dict[str, Any], pattern: Optional[str] = None) -> List[Dict[str, Any]]:
        """Preview what updates would be made without actually updating."""
        self._log("Previewing potential updates...")
        
        # Run tests to see current state
        test_results = self.run_golden_tests(pattern)
        
        # Analyze failures
        update_candidates = self.analyze_test_failures(test_results)
        
        # Get detailed update information
        detailed_updates = []
        
        for candidate in update_candidates:
            test_name = candidate["test_name"]
            test_config = golden_map["tests"].get(test_name, {})
            
            if not candidate["update_needed"]:
                continue
            
            output_file = Path(test_config.get("output_file", ""))
            golden_file = Path(test_config.get("golden_file", ""))
            
            update_info = {
                "test_name": test_name,
                "reason": candidate["reason"],
                "description": candidate["description"],
                "priority": candidate["priority"],
                "output_file": str(output_file),
                "golden_file": str(golden_file),
                "output_exists": output_file.exists(),
                "golden_exists": golden_file.exists(),
                "can_update": output_file.exists()
            }
            
            # Add size information if files exist
            if output_file.exists():
                update_info["output_size_bytes"] = output_file.stat().st_size
            
            if golden_file.exists():
                update_info["golden_size_bytes"] = golden_file.stat().st_size
            
            # Add diff preview if both files exist and differ
            if (output_file.exists() and golden_file.exists() and 
                candidate["reason"] == "output_mismatch"):
                
                diff_preview = self._generate_diff_preview(output_file, golden_file)
                update_info["diff_preview"] = diff_preview
            
            detailed_updates.append(update_info)
        
        return detailed_updates
    
    def _generate_diff_preview(self, output_file: Path, golden_file: Path, max_lines: int = 20) -> List[str]:
        """Generate a preview diff between output and golden files."""
        try:
            # For JSON files, format them for better diff
            if output_file.suffix == ".json" and golden_file.exists():
                with open(output_file, 'r') as f:
                    output_data = json.load(f)
                
                with open(golden_file, 'r') as f:
                    golden_data = json.load(f)
                
                output_str = json.dumps(output_data, indent=2, sort_keys=True)
                golden_str = json.dumps(golden_data, indent=2, sort_keys=True)
                
                output_lines = output_str.splitlines()
                golden_lines = golden_str.splitlines()
            else:
                # For other files, read as text
                output_lines = output_file.read_text().splitlines()
                golden_lines = golden_file.read_text().splitlines() if golden_file.exists() else []
            
            # Generate unified diff
            diff_lines = list(difflib.unified_diff(
                golden_lines,
                output_lines, 
                fromfile=f"golden/{golden_file.name}",
                tofile=f"output/{output_file.name}",
                lineterm=""
            ))
            
            return diff_lines[:max_lines]
            
        except Exception as e:
            return [f"Error generating diff: {e}"]
    
    def apply_updates(
        self, 
        updates: List[Dict[str, Any]], 
        approve_all: bool = False,
        interactive: bool = True
    ) -> Dict[str, Any]:
        """Apply golden file updates."""
        self._log("Applying golden file updates...")
        
        if not updates:
            self._log("No updates to apply")
            return {
                "applied": 0,
                "skipped": 0,
                "failed": 0,
                "details": []
            }
        
        applied = 0
        skipped = 0
        failed = 0
        details = []
        
        for update in updates:
            test_name = update["test_name"]
            output_file = Path(update["output_file"])
            golden_file = Path(update["golden_file"])
            
            if not update.get("can_update", False):
                self._log(f"Cannot update {test_name}: output file missing", "WARNING")
                skipped += 1
                details.append({
                    "test_name": test_name,
                    "action": "skipped",
                    "reason": "output_file_missing"
                })
                continue
            
            # Decide whether to apply update
            should_apply = approve_all
            
            if not should_apply and interactive:
                should_apply = self._prompt_for_update(update)
            elif not should_apply:
                self._log(f"Skipping update for {test_name} (not approved)", "INFO")
                skipped += 1
                details.append({
                    "test_name": test_name,
                    "action": "skipped", 
                    "reason": "not_approved"
                })
                continue
            
            # Apply the update
            try:
                # Ensure golden directory exists
                golden_file.parent.mkdir(parents=True, exist_ok=True)
                
                # Backup existing golden file if it exists
                backup_path = None
                if golden_file.exists():
                    backup_path = golden_file.with_suffix(f".{int(time.time())}.backup")
                    shutil.copy2(golden_file, backup_path)
                
                # Copy output to golden
                shutil.copy2(output_file, golden_file)
                
                self._log(f"Updated golden file for {test_name}")
                applied += 1
                details.append({
                    "test_name": test_name,
                    "action": "updated",
                    "golden_file": str(golden_file),
                    "backup_file": str(backup_path) if backup_path else None
                })
                
            except Exception as e:
                self._log(f"Failed to update {test_name}: {e}", "ERROR")
                failed += 1
                details.append({
                    "test_name": test_name,
                    "action": "failed",
                    "error": str(e)
                })
        
        return {
            "applied": applied,
            "skipped": skipped,
            "failed": failed,
            "details": details
        }
    
    def _prompt_for_update(self, update: Dict[str, Any]) -> bool:
        """Prompt user for update approval."""
        test_name = update["test_name"]
        
        print(f"\nUpdate candidate: {test_name}")
        print(f"Reason: {update['description']}")
        print(f"Priority: {update['priority']}")
        
        if "diff_preview" in update:
            print("\nDiff preview:")
            for line in update["diff_preview"][:10]:
                print(f"  {line}")
            if len(update["diff_preview"]) > 10:
                print(f"  ... and {len(update['diff_preview']) - 10} more lines")
        
        while True:
            response = input(f"\nApprove update for {test_name}? [y/n/d(iff)/q(uit)]: ").lower().strip()
            
            if response in ['y', 'yes']:
                return True
            elif response in ['n', 'no']:
                return False
            elif response in ['d', 'diff']:
                if "diff_preview" in update:
                    print("\nFull diff preview:")
                    for line in update["diff_preview"]:
                        print(line)
                else:
                    print("No diff preview available")
            elif response in ['q', 'quit']:
                print("Exiting update process")
                sys.exit(0)
            else:
                print("Invalid response. Please enter 'y', 'n', 'd', or 'q'.")
    
    def validate_updates(self, pattern: Optional[str] = None) -> Dict[str, Any]:
        """Validate that updates were successful by re-running tests."""
        self._log("Validating updates by re-running tests...")
        
        test_results = self.run_golden_tests(pattern)
        
        validation_summary = {
            "total_tests": test_results["summary"]["total"],
            "passed_tests": test_results["summary"]["passed"],
            "failed_tests": test_results["summary"]["failed"],
            "validation_successful": test_results["summary"]["failed"] == 0
        }
        
        if validation_summary["validation_successful"]:
            self._log("All tests passed after update - validation successful!")
        else:
            self._log(f"Still have {validation_summary['failed_tests']} failing tests after update", "WARNING")
        
        return validation_summary


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Update Golden Files - Manage golden test baselines"
    )
    
    parser.add_argument(
        "--pattern",
        help="Test pattern to update (glob syntax, e.g., 'performance_*')"
    )
    parser.add_argument(
        "--preview",
        action="store_true",
        help="Preview updates without applying them"
    )
    parser.add_argument(
        "--approve",
        action="store_true",
        help="Approve all updates without interactive prompts"
    )
    parser.add_argument(
        "--non-interactive",
        action="store_true",
        help="Run in non-interactive mode (requires --approve)"
    )
    parser.add_argument(
        "--validate",
        action="store_true",
        help="Validate updates by re-running tests after update"
    )
    parser.add_argument(
        "--output",
        help="Output file for update results (JSON format)"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )
    
    args = parser.parse_args()
    
    # Validate argument combinations
    if args.non_interactive and not args.approve:
        print("Error: --non-interactive requires --approve")
        return 1
    
    try:
        updater = GoldenUpdater(verbose=args.verbose)
        
        # Load golden map
        golden_map = updater.load_golden_map()
        
        # Preview mode - show what would be updated
        if args.preview:
            updates = updater.preview_updates(golden_map, pattern=args.pattern)
            
            if not updates:
                print("No updates needed - all tests passing or no update candidates found")
                return 0
            
            print(f"\nFound {len(updates)} potential updates:")
            for update in updates:
                print(f"\n- {update['test_name']}:")
                print(f"  Reason: {update['description']}")
                print(f"  Priority: {update['priority']}")
                print(f"  Can Update: {update['can_update']}")
                
                if update.get("diff_preview"):
                    print(f"  Diff Lines: {len(update['diff_preview'])}")
            
            if args.output:
                with open(args.output, 'w') as f:
                    json.dump({"preview": updates}, f, indent=2)
            
            return 0
        
        # Update mode - actually apply updates
        updates = updater.preview_updates(golden_map, pattern=args.pattern)
        
        if not updates:
            print("No updates needed - all tests passing")
            return 0
        
        # Apply updates
        interactive_mode = not args.non_interactive
        results = updater.apply_updates(
            updates, 
            approve_all=args.approve,
            interactive=interactive_mode
        )
        
        # Print results
        print(f"\nUpdate Results:")
        print(f"Applied: {results['applied']}")
        print(f"Skipped: {results['skipped']}")
        print(f"Failed: {results['failed']}")
        
        # Show details
        if args.verbose:
            for detail in results["details"]:
                print(f"  {detail['test_name']}: {detail['action']}")
                if detail.get("error"):
                    print(f"    Error: {detail['error']}")
        
        # Validate updates if requested
        validation_results = None
        if args.validate and results["applied"] > 0:
            validation_results = updater.validate_updates(pattern=args.pattern)
            print(f"\nValidation Results:")
            print(f"Tests Passed: {validation_results['passed_tests']}/{validation_results['total_tests']}")
            print(f"Validation: {'SUCCESS' if validation_results['validation_successful'] else 'FAILED'}")
        
        # Output results if requested
        if args.output:
            output_data = {
                "update_results": results,
                "validation_results": validation_results
            }
            with open(args.output, 'w') as f:
                json.dump(output_data, f, indent=2)
            print(f"Results written to: {args.output}")
        
        # Exit with appropriate code
        if results["failed"] > 0:
            return 1
        elif validation_results and not validation_results["validation_successful"]:
            return 1
        else:
            return 0
        
    except KeyboardInterrupt:
        print("\nUpdate process interrupted by user")
        return 130
    except Exception as e:
        print(f"Update process failed: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())