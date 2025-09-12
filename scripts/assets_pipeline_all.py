#!/usr/bin/env python3
"""
Assets Pipeline Orchestrator

Consolidated orchestrator that runs all pipeline components:
- Performance profiling
- Adaptive budgeting  
- Embedding duplicate analysis
- Policy guard evaluation
- Rollback playbook generation
- Integrity signing/verification
"""

import argparse
import json
import os
import sys
import time
import traceback
from pathlib import Path
from typing import Dict, Any, List, Optional
import subprocess
import psutil
import tempfile
import hashlib


class PipelineOrchestrator:
    """Main orchestrator for the asset governance pipeline."""
    
    def __init__(self, config_path: str, output_dir: str = "./output", verbose: bool = False):
        self.config_path = Path(config_path)
        self.output_dir = Path(output_dir)
        self.verbose = verbose
        self.start_time = time.time()
        
        # Performance tracking
        self.process = psutil.Process()
        self.initial_memory = self.process.memory_info().rss / 1024 / 1024  # MB
        self.performance_data = {}
        
        # Load configuration
        self.config = self._load_config()
        
        # Ensure output directory exists
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Track pipeline state
        self.pipeline_state = {
            "started_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "status": "initializing",
            "completed_stages": [],
            "failed_stages": [],
            "warnings": [],
            "artifacts": {}
        }
    
    def _load_config(self) -> Dict[str, Any]:
        """Load and validate pipeline configuration."""
        try:
            with open(self.config_path, 'r') as f:
                config = json.load(f)
            
            # Validate required sections
            required_sections = [
                "quality_thresholds", "performance_benchmarks", 
                "adaptive_budget", "policy_guard"
            ]
            
            for section in required_sections:
                if section not in config:
                    raise ValueError(f"Missing required configuration section: {section}")
            
            return config
            
        except Exception as e:
            print(f"Error loading configuration: {e}")
            sys.exit(1)
    
    def _log(self, message: str, level: str = "INFO") -> None:
        """Log message with timestamp."""
        timestamp = time.strftime("%H:%M:%S")
        prefix = f"[{timestamp}] [{level}]"
        
        if self.verbose or level in ["ERROR", "WARNING"]:
            print(f"{prefix} {message}")
    
    def _capture_performance_snapshot(self, stage: str) -> Dict[str, Any]:
        """Capture current performance metrics."""
        current_memory = self.process.memory_info().rss / 1024 / 1024  # MB
        cpu_percent = self.process.cpu_percent()
        elapsed_time = time.time() - self.start_time
        
        return {
            "stage": stage,
            "timestamp": time.time(),
            "elapsed_time_seconds": elapsed_time,
            "memory_usage_mb": current_memory,
            "memory_delta_mb": current_memory - self.initial_memory,
            "cpu_percent": cpu_percent,
            "open_files": len(self.process.open_files()) if hasattr(self.process, 'open_files') else 0
        }
    
    def _run_subprocess(self, script_name: str, args: List[str]) -> Dict[str, Any]:
        """Run a subprocess and capture results."""
        script_path = Path(__file__).parent / script_name
        
        if not script_path.exists():
            return {
                "success": False,
                "error": f"Script not found: {script_path}",
                "exit_code": 1,
                "output": "",
                "stderr": ""
            }
        
        cmd = [sys.executable, str(script_path)] + args
        
        try:
            self._log(f"Running: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=self.config.get("performance_benchmarks", {}).get("max_processing_time_seconds", 300)
            )
            
            return {
                "success": result.returncode == 0,
                "exit_code": result.returncode,
                "output": result.stdout,
                "stderr": result.stderr,
                "command": cmd
            }
            
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Process timed out",
                "exit_code": 124,
                "output": "",
                "stderr": "Process exceeded maximum execution time"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "exit_code": 1,
                "output": "",
                "stderr": traceback.format_exc()
            }
    
    def run_performance_profiling(self) -> Dict[str, Any]:
        """Run performance profiling stage."""
        self._log("Starting performance profiling...")
        stage_start = time.time()
        
        perf_snapshot = self._capture_performance_snapshot("performance_profiling_start")
        
        # Generate performance profile
        profile_data = {
            "pipeline_config": {
                "max_processing_time": self.config["performance_benchmarks"]["max_processing_time_seconds"],
                "max_memory_usage": self.config["performance_benchmarks"]["max_memory_usage_mb"],
                "cpu_threshold": self.config["performance_benchmarks"]["cpu_utilization_threshold"]
            },
            "runtime_metrics": perf_snapshot,
            "profiling_enabled": self.config.get("performance", {}).get("enable_profiling", True),
            "baseline_comparison": self.config.get("performance", {}).get("baseline_comparison", False)
        }
        
        # Check for performance regressions
        memory_limit = self.config["performance_benchmarks"]["max_memory_usage_mb"]
        if perf_snapshot["memory_usage_mb"] > memory_limit:
            self.pipeline_state["warnings"].append(
                f"Memory usage ({perf_snapshot['memory_usage_mb']:.1f} MB) exceeds limit ({memory_limit} MB)"
            )
        
        stage_end = time.time()
        profile_data["stage_duration_seconds"] = stage_end - stage_start
        
        # Write performance profile
        output_file = self.output_dir / "performance_profile.json"
        with open(output_file, 'w') as f:
            json.dump(profile_data, f, indent=2)
        
        self.pipeline_state["artifacts"]["performance_profile"] = str(output_file)
        self._log(f"Performance profiling completed in {stage_end - stage_start:.2f}s")
        
        return {
            "success": True,
            "profile_data": profile_data,
            "output_file": str(output_file)
        }
    
    def run_adaptive_budgeting(self) -> Dict[str, Any]:
        """Run adaptive budget optimization."""
        self._log("Running adaptive budget optimization...")
        
        args = [
            "--config", str(self.config_path),
            "--output", str(self.output_dir / "budget_recommendations.json")
        ]
        
        if self.verbose:
            args.append("--verbose")
        
        result = self._run_subprocess("adaptive_budget_optimizer.py", args)
        
        if result["success"]:
            self._log("Adaptive budgeting completed successfully")
            self.pipeline_state["artifacts"]["budget_recommendations"] = str(self.output_dir / "budget_recommendations.json")
        else:
            self._log(f"Adaptive budgeting failed: {result.get('error', 'Unknown error')}", "ERROR")
        
        return result
    
    def run_embedding_analysis(self) -> Dict[str, Any]:
        """Run embedding duplicate analysis."""
        self._log("Running embedding duplicate analysis...")
        
        args = [
            "--config", str(self.config_path),
            "--output", str(self.output_dir / "embedding_duplicate_groups.json")
        ]
        
        result = self._run_subprocess("embedding_duplicate_proposals.py", args)
        
        if result["success"]:
            self._log("Embedding analysis completed successfully")
            self.pipeline_state["artifacts"]["embedding_duplicates"] = str(self.output_dir / "embedding_duplicate_groups.json")
        else:
            self._log(f"Embedding analysis failed: {result.get('error', 'Unknown error')}", "ERROR")
        
        return result
    
    def run_policy_guard(self) -> Dict[str, Any]:
        """Run policy guard evaluation."""
        self._log("Running policy guard evaluation...")
        
        args = [
            "--config", str(self.config_path),
            "--target", str(self.output_dir.parent),  # Scan parent directory
            "--output", str(self.output_dir / "policy_guard_report.json")
        ]
        
        result = self._run_subprocess("policy_guard_evaluator.py", args)
        
        if result["success"]:
            self._log("Policy guard evaluation completed successfully")
            self.pipeline_state["artifacts"]["policy_guard"] = str(self.output_dir / "policy_guard_report.json")
        else:
            self._log(f"Policy guard failed: {result.get('error', 'Unknown error')}", "ERROR")
            # Policy guard failure should exit with code 19
            if result["exit_code"] != 0:
                return {"success": False, "exit_code": 19, "error": "Policy guard violations detected"}
        
        return result
    
    def run_rollback_playbook(self) -> Dict[str, Any]:
        """Generate rollback playbook."""
        self._log("Generating rollback playbook...")
        
        args = [
            "--config", str(self.config_path),
            "--output", str(self.output_dir / "rollback_playbook.json")
        ]
        
        result = self._run_subprocess("rollback_playbook.py", args)
        
        if result["success"]:
            self._log("Rollback playbook generated successfully")
            self.pipeline_state["artifacts"]["rollback_playbook"] = str(self.output_dir / "rollback_playbook.json")
        else:
            self._log(f"Rollback playbook generation failed: {result.get('error', 'Unknown error')}", "ERROR")
        
        return result
    
    def run_symbol_sparklines(self) -> Dict[str, Any]:
        """Generate symbol sparklines visualization."""
        self._log("Generating symbol sparklines...")
        
        args = [
            "--output", str(self.output_dir / "symbol_sparklines.json")
        ]
        
        result = self._run_subprocess("generate_symbol_sparklines.py", args)
        
        if result["success"]:
            self._log("Symbol sparklines generated successfully")
            self.pipeline_state["artifacts"]["symbol_sparklines"] = str(self.output_dir / "symbol_sparklines.json")
        else:
            self._log(f"Symbol sparklines generation failed: {result.get('error', 'Unknown error')}", "ERROR")
        
        return result
    
    def run_integrity_signing(self) -> Dict[str, Any]:
        """Sign and verify pipeline integrity."""
        self._log("Running integrity signing and verification...")
        
        # First, sign the manifest
        sign_result = self._run_subprocess("sign_manifest.py", [
            "--input-dir", str(self.output_dir),
            "--output", str(self.output_dir / "integrity_manifest.json")
        ])
        
        if not sign_result["success"]:
            return sign_result
        
        # Then verify the signature
        verify_result = self._run_subprocess("verify_manifest.py", [
            "--manifest", str(self.output_dir / "integrity_manifest.json"),
            "--output", str(self.output_dir / "integrity_report.json")
        ])
        
        if verify_result["success"]:
            self._log("Integrity signing and verification completed successfully")
            self.pipeline_state["artifacts"]["integrity_manifest"] = str(self.output_dir / "integrity_manifest.json")
            self.pipeline_state["artifacts"]["integrity_report"] = str(self.output_dir / "integrity_report.json")
        else:
            self._log(f"Integrity verification failed: {verify_result.get('error', 'Unknown error')}", "ERROR")
        
        return verify_result
    
    def run_pipeline(self) -> int:
        """Run the complete pipeline."""
        self._log("Starting asset governance pipeline...")
        self.pipeline_state["status"] = "running"
        
        # Define pipeline stages
        stages = [
            ("performance_profiling", self.run_performance_profiling),
            ("adaptive_budgeting", self.run_adaptive_budgeting),
            ("embedding_analysis", self.run_embedding_analysis),
            ("policy_guard", self.run_policy_guard),
            ("rollback_playbook", self.run_rollback_playbook),
            ("symbol_sparklines", self.run_symbol_sparklines),
            ("integrity_signing", self.run_integrity_signing)
        ]
        
        exit_code = 0
        
        for stage_name, stage_func in stages:
            try:
                self._log(f"Executing stage: {stage_name}")
                
                result = stage_func()
                
                if result["success"]:
                    self.pipeline_state["completed_stages"].append(stage_name)
                    self._log(f"Stage {stage_name} completed successfully")
                else:
                    self.pipeline_state["failed_stages"].append(stage_name)
                    self._log(f"Stage {stage_name} failed: {result.get('error', 'Unknown error')}", "ERROR")
                    
                    # Handle specific exit codes
                    if "exit_code" in result:
                        if result["exit_code"] == 19:  # Policy guard failure
                            exit_code = 19
                            break
                        elif result["exit_code"] == 18:  # Performance regression
                            exit_code = 18
                            break
                    
                    # For other failures, continue but set general error code
                    if exit_code == 0:
                        exit_code = 1
                
            except Exception as e:
                self.pipeline_state["failed_stages"].append(stage_name)
                self._log(f"Stage {stage_name} crashed: {e}", "ERROR")
                if self.verbose:
                    self._log(traceback.format_exc(), "ERROR")
                if exit_code == 0:
                    exit_code = 1
        
        # Final performance snapshot
        final_perf = self._capture_performance_snapshot("pipeline_complete")
        self.performance_data["final"] = final_perf
        
        # Update pipeline state
        self.pipeline_state["status"] = "completed" if exit_code == 0 else "failed"
        self.pipeline_state["completed_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
        self.pipeline_state["exit_code"] = exit_code
        self.pipeline_state["total_duration_seconds"] = final_perf["elapsed_time_seconds"]
        
        # Write pipeline summary
        summary_file = self.output_dir / "pipeline_summary.json"
        with open(summary_file, 'w') as f:
            json.dump(self.pipeline_state, f, indent=2)
        
        self._log(f"Pipeline completed with exit code: {exit_code}")
        self._log(f"Summary written to: {summary_file}")
        
        return exit_code


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Asset Governance Pipeline Orchestrator",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument(
        "--policy", 
        required=True,
        help="Path to policy configuration JSON file"
    )
    parser.add_argument(
        "--output-dir",
        default="./output",
        help="Output directory for pipeline artifacts"
    )
    parser.add_argument(
        "--input-dir",
        help="Input directory containing assets (optional)"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose logging"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Perform dry run without making changes"
    )
    
    args = parser.parse_args()
    
    try:
        orchestrator = PipelineOrchestrator(
            config_path=args.policy,
            output_dir=args.output_dir,
            verbose=args.verbose
        )
        
        if args.dry_run:
            print("DRY RUN MODE: Pipeline would execute the following stages:")
            print("1. Performance profiling")
            print("2. Adaptive budgeting")
            print("3. Embedding analysis")
            print("4. Policy guard evaluation")
            print("5. Rollback playbook generation")
            print("6. Symbol sparklines generation")
            print("7. Integrity signing and verification")
            return 0
        
        return orchestrator.run_pipeline()
        
    except KeyboardInterrupt:
        print("\nPipeline execution interrupted by user")
        return 130
    except Exception as e:
        print(f"Pipeline orchestration failed: {e}")
        if args.verbose:
            traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())