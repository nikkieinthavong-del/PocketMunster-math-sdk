#!/usr/bin/env python3
"""
Pocketmon Pipeline CLI

Command-line interface for the asset governance pipeline.
"""

import argparse
import sys
import os
import json
import subprocess
from pathlib import Path
from typing import Optional


def get_project_root() -> Path:
    """Get the project root directory."""
    current = Path(__file__).resolve()
    while current.parent != current:
        if (current / "pyproject.toml").exists() or (current / "setup.py").exists():
            return current
        current = current.parent
    return Path.cwd()


def load_policy_config(policy_path: str) -> dict:
    """Load and validate policy configuration."""
    try:
        with open(policy_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: Policy file not found: {policy_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in policy file: {e}")
        sys.exit(1)


def orchestrate_command(args) -> int:
    """Execute the full asset pipeline orchestration."""
    project_root = get_project_root()
    orchestrator_path = project_root / "scripts" / "assets_pipeline_all.py"
    
    if not orchestrator_path.exists():
        print(f"Error: Orchestrator script not found: {orchestrator_path}")
        return 1
    
    # Load and validate policy
    policy_config = load_policy_config(args.policy)
    
    # Build command arguments
    cmd = [
        sys.executable,
        str(orchestrator_path),
        "--policy", args.policy
    ]
    
    if args.output_dir:
        cmd.extend(["--output-dir", args.output_dir])
    
    if args.input_dir:
        cmd.extend(["--input-dir", args.input_dir])
    
    if args.verbose:
        cmd.append("--verbose")
    
    if args.dry_run:
        cmd.append("--dry-run")
    
    print(f"Executing: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, check=False, capture_output=False)
        return result.returncode
    except KeyboardInterrupt:
        print("\nPipeline execution interrupted by user")
        return 130
    except Exception as e:
        print(f"Error executing pipeline: {e}")
        return 1


def policy_guard_command(args) -> int:
    """Execute policy guard evaluation."""
    project_root = get_project_root()
    script_path = project_root / "scripts" / "policy_guard_evaluator.py"
    
    cmd = [
        sys.executable,
        str(script_path),
        "--policy", args.policy,
        "--target", args.target
    ]
    
    if args.output:
        cmd.extend(["--output", args.output])
    
    try:
        result = subprocess.run(cmd, check=False)
        return result.returncode
    except Exception as e:
        print(f"Error executing policy guard: {e}")
        return 1


def golden_tests_command(args) -> int:
    """Execute golden tests."""
    project_root = get_project_root()
    script_path = project_root / "scripts" / "run_golden_tests.py"
    
    cmd = [sys.executable, str(script_path)]
    
    if args.update:
        cmd.append("--update")
    
    if args.test_pattern:
        cmd.extend(["--pattern", args.test_pattern])
    
    try:
        result = subprocess.run(cmd, check=False)
        return result.returncode
    except Exception as e:
        print(f"Error executing golden tests: {e}")
        return 1


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Pocketmon Pipeline - Asset Governance for Math-SDK",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s orchestrate --policy config/assets_quality_policy.json
  %(prog)s policy-guard --policy config/test_policy.json --target assets/
  %(prog)s golden-tests --update
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Orchestrate command
    orchestrate_parser = subparsers.add_parser(
        "orchestrate", 
        help="Run the full asset governance pipeline"
    )
    orchestrate_parser.add_argument(
        "--policy", 
        required=True,
        help="Path to policy configuration JSON file"
    )
    orchestrate_parser.add_argument(
        "--output-dir",
        default="./output",
        help="Output directory for reports and artifacts"
    )
    orchestrate_parser.add_argument(
        "--input-dir",
        default="./assets",
        help="Input directory containing assets to process"
    )
    orchestrate_parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )
    orchestrate_parser.add_argument(
        "--dry-run",
        action="store_true", 
        help="Perform dry run without making changes"
    )
    
    # Policy guard command
    policy_parser = subparsers.add_parser(
        "policy-guard",
        help="Evaluate policy compliance"
    )
    policy_parser.add_argument(
        "--policy",
        required=True,
        help="Path to policy configuration file"
    )
    policy_parser.add_argument(
        "--target", 
        required=True,
        help="Target directory or file to evaluate"
    )
    policy_parser.add_argument(
        "--output",
        help="Output file for policy report"
    )
    
    # Golden tests command
    golden_parser = subparsers.add_parser(
        "golden-tests",
        help="Run golden tests for pipeline validation"
    )
    golden_parser.add_argument(
        "--update",
        action="store_true",
        help="Update golden files with new baseline"
    )
    golden_parser.add_argument(
        "--pattern",
        help="Test pattern to match (glob syntax)"
    )
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return 1
    
    # Execute the appropriate command
    if args.command == "orchestrate":
        return orchestrate_command(args)
    elif args.command == "policy-guard":
        return policy_guard_command(args)  
    elif args.command == "golden-tests":
        return golden_tests_command(args)
    else:
        print(f"Unknown command: {args.command}")
        return 1


if __name__ == "__main__":
    sys.exit(main())