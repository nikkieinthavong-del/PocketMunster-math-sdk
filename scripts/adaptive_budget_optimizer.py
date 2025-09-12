#!/usr/bin/env python3
"""
Adaptive Budget Optimizer

Dynamic resource budgeting system that adjusts processing budgets based on 
system performance, workload characteristics, and historical patterns.
"""

import argparse
import json
import os
import sys
import time
import math
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import psutil
import statistics


class AdaptiveBudgetOptimizer:
    """Adaptive budget optimization system for resource management."""
    
    def __init__(self, config_path: str, verbose: bool = False):
        self.config_path = Path(config_path)
        self.verbose = verbose
        self.config = self._load_config()
        
        # Budget configuration
        self.budget_config = self.config.get("adaptive_budget", {})
        self.base_budget = self.budget_config.get("base_budget_seconds", 60)
        self.scaling_factor = self.budget_config.get("scaling_factor", 1.5)
        self.max_budget = self.budget_config.get("max_budget_seconds", 300)
        self.dynamic_adjustment = self.budget_config.get("dynamic_adjustment", True)
        
        # Resource factor weights
        self.resource_factors = self.budget_config.get("resource_factors", {
            "cpu": 0.4,
            "memory": 0.3,
            "io": 0.3
        })
        
        # Performance benchmarks
        self.perf_benchmarks = self.config.get("performance_benchmarks", {})
        
        # System monitoring
        self.system_metrics = []
        self.workload_history = []
        
    def _load_config(self) -> Dict[str, Any]:
        """Load budget optimization configuration."""
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
    
    def collect_system_metrics(self) -> Dict[str, Any]:
        """Collect current system performance metrics."""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk_io = psutil.disk_io_counters()
            
            # Calculate I/O rate (simplified)
            io_rate = 0
            if hasattr(self, '_last_disk_io') and self._last_disk_io:
                time_diff = time.time() - self._last_disk_time
                if time_diff > 0:
                    read_diff = disk_io.read_bytes - self._last_disk_io.read_bytes
                    write_diff = disk_io.write_bytes - self._last_disk_io.write_bytes
                    io_rate = (read_diff + write_diff) / time_diff / 1024 / 1024  # MB/s
            
            self._last_disk_io = disk_io
            self._last_disk_time = time.time()
            
            metrics = {
                "timestamp": time.time(),
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "memory_available_mb": memory.available / 1024 / 1024,
                "memory_used_mb": memory.used / 1024 / 1024,
                "io_rate_mbps": io_rate,
                "load_average": os.getloadavg()[0] if hasattr(os, 'getloadavg') else 0
            }
            
            self.system_metrics.append(metrics)
            
            # Keep only recent metrics (last 100 samples)
            if len(self.system_metrics) > 100:
                self.system_metrics = self.system_metrics[-100:]
            
            return metrics
            
        except Exception as e:
            self._log(f"Error collecting system metrics: {e}", "WARNING")
            return {
                "timestamp": time.time(),
                "cpu_percent": 0,
                "memory_percent": 0,
                "memory_available_mb": 0,
                "memory_used_mb": 0,
                "io_rate_mbps": 0,
                "load_average": 0
            }
    
    def analyze_workload_characteristics(self, workload_data: Optional[Dict] = None) -> Dict[str, Any]:
        """Analyze workload characteristics to inform budget decisions."""
        if workload_data is None:
            # Generate synthetic workload analysis
            workload_data = {
                "file_count": 100,
                "total_size_mb": 250,
                "avg_file_size_mb": 2.5,
                "file_types": {"json": 60, "csv": 30, "py": 10},
                "complexity_score": 0.5
            }
        
        # Calculate workload complexity
        complexity_factors = {
            "file_count": min(workload_data.get("file_count", 0) / 1000, 1.0),
            "total_size": min(workload_data.get("total_size_mb", 0) / 1000, 1.0),
            "file_diversity": len(workload_data.get("file_types", {})) / 10,
            "avg_size": min(workload_data.get("avg_file_size_mb", 0) / 100, 1.0)
        }
        
        overall_complexity = sum(complexity_factors.values()) / len(complexity_factors)
        
        workload_analysis = {
            "complexity_score": overall_complexity,
            "complexity_factors": complexity_factors,
            "workload_data": workload_data,
            "estimated_processing_time": self._estimate_processing_time(workload_data, overall_complexity)
        }
        
        self.workload_history.append(workload_analysis)
        
        return workload_analysis
    
    def _estimate_processing_time(self, workload_data: Dict, complexity: float) -> float:
        """Estimate processing time based on workload characteristics."""
        base_time_per_file = 0.1  # seconds
        size_factor = workload_data.get("total_size_mb", 0) * 0.01  # seconds per MB
        complexity_factor = complexity * 30  # complexity adds up to 30 seconds
        
        estimated_time = (
            workload_data.get("file_count", 0) * base_time_per_file +
            size_factor +
            complexity_factor
        )
        
        return max(estimated_time, 1.0)  # Minimum 1 second
    
    def calculate_resource_pressure(self) -> Dict[str, float]:
        """Calculate current resource pressure levels."""
        if not self.system_metrics:
            return {"cpu": 0.5, "memory": 0.5, "io": 0.5}
        
        # Get recent metrics (last 10 samples or all if less)
        recent_metrics = self.system_metrics[-10:]
        
        # Calculate average pressure levels
        cpu_pressures = [m["cpu_percent"] / 100 for m in recent_metrics]
        memory_pressures = [m["memory_percent"] / 100 for m in recent_metrics]
        
        # I/O pressure based on rate and load average
        io_pressures = []
        for m in recent_metrics:
            io_pressure = min(m["io_rate_mbps"] / 100, 1.0)  # Normalize to 100 MB/s
            load_pressure = min(m["load_average"] / psutil.cpu_count(), 1.0)
            io_pressures.append(max(io_pressure, load_pressure))
        
        return {
            "cpu": statistics.mean(cpu_pressures),
            "memory": statistics.mean(memory_pressures),
            "io": statistics.mean(io_pressures)
        }
    
    def calculate_adaptive_budget(self, workload_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate adaptive budget based on system state and workload."""
        if not self.budget_config.get("enabled", True):
            return {
                "recommended_budget_seconds": self.base_budget,
                "budget_factors": {"static": 1.0},
                "adjustments": {},
                "confidence": 1.0
            }
        
        # Get current system state
        current_metrics = self.collect_system_metrics()
        resource_pressure = self.calculate_resource_pressure()
        
        # Calculate base budget adjustment factors
        budget_factors = {}
        
        # Workload complexity factor
        complexity = workload_analysis["complexity_score"]
        complexity_factor = 1.0 + (complexity * (self.scaling_factor - 1.0))
        budget_factors["workload_complexity"] = complexity_factor
        
        # Resource pressure factors
        pressure_adjustments = {}
        for resource, pressure in resource_pressure.items():
            weight = self.resource_factors.get(resource, 0.33)
            
            # Higher pressure = need more time
            if pressure > 0.8:  # High pressure
                adjustment = 1.5
            elif pressure > 0.6:  # Medium pressure  
                adjustment = 1.2
            elif pressure < 0.3:  # Low pressure - can reduce budget
                adjustment = 0.8
            else:  # Normal pressure
                adjustment = 1.0
            
            pressure_adjustments[resource] = adjustment
            budget_factors[f"resource_{resource}"] = adjustment
        
        # Historical performance factor
        historical_factor = self._calculate_historical_factor()
        budget_factors["historical_performance"] = historical_factor
        
        # Time of day factor (simple heuristic)
        hour = time.localtime().tm_hour
        if 9 <= hour <= 17:  # Business hours - might need more resources
            time_factor = 1.1
        else:  # Off hours - can be more aggressive
            time_factor = 0.9
        budget_factors["time_of_day"] = time_factor
        
        # Calculate weighted adjustment
        total_adjustment = 1.0
        
        for factor_name, factor_value in budget_factors.items():
            if factor_name.startswith("resource_"):
                resource = factor_name.split("_")[1]
                weight = self.resource_factors.get(resource, 0.33)
                total_adjustment *= (1.0 + (factor_value - 1.0) * weight)
            else:
                # Apply other factors with reduced weight
                total_adjustment *= (1.0 + (factor_value - 1.0) * 0.5)
        
        # Calculate final budget
        recommended_budget = self.base_budget * total_adjustment
        
        # Apply constraints
        recommended_budget = max(self.base_budget * 0.5, recommended_budget)  # Min 50% of base
        recommended_budget = min(self.max_budget, recommended_budget)  # Respect max limit
        
        # Calculate confidence based on data availability
        confidence = self._calculate_confidence()
        
        return {
            "recommended_budget_seconds": round(recommended_budget, 2),
            "base_budget_seconds": self.base_budget,
            "total_adjustment_factor": round(total_adjustment, 3),
            "budget_factors": budget_factors,
            "resource_pressure": resource_pressure,
            "workload_complexity": complexity,
            "confidence": round(confidence, 3),
            "system_metrics": current_metrics,
            "constraints": {
                "min_budget": self.base_budget * 0.5,
                "max_budget": self.max_budget,
                "scaling_factor": self.scaling_factor
            }
        }
    
    def _calculate_historical_factor(self) -> float:
        """Calculate historical performance factor."""
        if len(self.workload_history) < 2:
            return 1.0
        
        # Simple heuristic: if recent workloads were more complex, increase budget
        recent_complexities = [w["complexity_score"] for w in self.workload_history[-5:]]
        avg_complexity = statistics.mean(recent_complexities)
        
        if avg_complexity > 0.7:
            return 1.3  # High historical complexity
        elif avg_complexity < 0.3:
            return 0.8  # Low historical complexity
        else:
            return 1.0  # Normal
    
    def _calculate_confidence(self) -> float:
        """Calculate confidence level in budget recommendations."""
        factors = []
        
        # Data availability factor
        data_factor = min(len(self.system_metrics) / 10, 1.0)
        factors.append(data_factor)
        
        # Metric stability factor (lower variance = higher confidence)
        if len(self.system_metrics) > 5:
            recent_cpu = [m["cpu_percent"] for m in self.system_metrics[-5:]]
            cpu_variance = statistics.variance(recent_cpu) if len(recent_cpu) > 1 else 0
            stability_factor = max(0.3, 1.0 - (cpu_variance / 100))
            factors.append(stability_factor)
        else:
            factors.append(0.5)
        
        # Historical data factor
        history_factor = min(len(self.workload_history) / 5, 1.0)
        factors.append(history_factor)
        
        return statistics.mean(factors)
    
    def generate_budget_recommendations(self, workload_data: Optional[Dict] = None) -> Dict[str, Any]:
        """Generate comprehensive budget recommendations."""
        self._log("Generating adaptive budget recommendations...")
        
        # Analyze workload
        workload_analysis = self.analyze_workload_characteristics(workload_data)
        
        # Calculate adaptive budget
        budget_recommendation = self.calculate_adaptive_budget(workload_analysis)
        
        # Generate optimization suggestions
        optimization_suggestions = self._generate_optimization_suggestions(
            budget_recommendation, workload_analysis
        )
        
        # Create comprehensive report
        report = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "config_file": str(self.config_path),
            "budget_recommendation": budget_recommendation,
            "workload_analysis": workload_analysis,
            "optimization_suggestions": optimization_suggestions,
            "system_state": {
                "metrics_collected": len(self.system_metrics),
                "workload_history_size": len(self.workload_history),
                "adaptive_budgeting_enabled": self.budget_config.get("enabled", True)
            },
            "next_review_recommended": time.strftime(
                "%Y-%m-%d %H:%M:%S", 
                time.localtime(time.time() + 3600)  # 1 hour from now
            )
        }
        
        return report
    
    def _generate_optimization_suggestions(
        self, 
        budget_rec: Dict[str, Any], 
        workload_analysis: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """Generate optimization suggestions based on analysis."""
        suggestions = []
        
        # Budget-related suggestions
        if budget_rec["recommended_budget_seconds"] > self.base_budget * 1.5:
            suggestions.append({
                "type": "budget_high",
                "priority": "medium", 
                "suggestion": "Consider optimizing workload or increasing system resources",
                "reason": "Recommended budget significantly exceeds base budget"
            })
        
        if budget_rec["confidence"] < 0.6:
            suggestions.append({
                "type": "confidence_low",
                "priority": "low",
                "suggestion": "Collect more system metrics for better budget predictions",
                "reason": "Low confidence in budget recommendations due to limited data"
            })
        
        # Resource pressure suggestions
        resource_pressure = budget_rec["resource_pressure"]
        
        if resource_pressure["cpu"] > 0.8:
            suggestions.append({
                "type": "cpu_pressure",
                "priority": "high",
                "suggestion": "Consider reducing parallel processing or adding CPU capacity",
                "reason": "High CPU pressure detected"
            })
        
        if resource_pressure["memory"] > 0.8:
            suggestions.append({
                "type": "memory_pressure", 
                "priority": "high",
                "suggestion": "Consider processing in smaller batches or adding memory",
                "reason": "High memory pressure detected"
            })
        
        if resource_pressure["io"] > 0.8:
            suggestions.append({
                "type": "io_pressure",
                "priority": "medium",
                "suggestion": "Consider using faster storage or optimizing I/O patterns", 
                "reason": "High I/O pressure detected"
            })
        
        # Workload suggestions
        complexity = workload_analysis["complexity_score"]
        if complexity > 0.8:
            suggestions.append({
                "type": "workload_complexity",
                "priority": "medium",
                "suggestion": "Consider preprocessing or simplifying complex workloads",
                "reason": "High workload complexity detected"
            })
        
        return suggestions


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Adaptive Budget Optimizer - Dynamic resource budgeting system"
    )
    
    parser.add_argument(
        "--config",
        required=True,
        help="Path to configuration file"
    )
    parser.add_argument(
        "--output",
        help="Output file for budget recommendations (JSON format)"
    )
    parser.add_argument(
        "--workload-data",
        help="Path to workload data file (JSON format)"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )
    
    args = parser.parse_args()
    
    try:
        optimizer = AdaptiveBudgetOptimizer(args.config, verbose=args.verbose)
        
        # Load workload data if provided
        workload_data = None
        if args.workload_data:
            workload_path = Path(args.workload_data)
            if workload_path.exists():
                with open(workload_path, 'r') as f:
                    workload_data = json.load(f)
        
        # Generate recommendations
        recommendations = optimizer.generate_budget_recommendations(workload_data)
        
        # Output results
        if args.output:
            output_path = Path(args.output)
            with open(output_path, 'w') as f:
                json.dump(recommendations, f, indent=2)
            print(f"Budget recommendations written to: {output_path}")
        else:
            print(json.dumps(recommendations, indent=2))
        
        # Print summary
        budget_rec = recommendations["budget_recommendation"]
        print(f"\nAdaptive Budget Optimization Summary:")
        print(f"Recommended Budget: {budget_rec['recommended_budget_seconds']:.1f} seconds")
        print(f"Base Budget: {budget_rec['base_budget_seconds']} seconds")
        print(f"Adjustment Factor: {budget_rec['total_adjustment_factor']:.2f}x")
        print(f"Confidence: {budget_rec['confidence']:.1%}")
        
        suggestions = recommendations["optimization_suggestions"]
        if suggestions:
            print(f"\nOptimization Suggestions ({len(suggestions)}):")
            for suggestion in suggestions[:3]:  # Show top 3
                print(f"- [{suggestion['priority'].upper()}] {suggestion['suggestion']}")
        
        return 0
        
    except KeyboardInterrupt:
        print("\nBudget optimization interrupted by user")
        return 130
    except Exception as e:
        print(f"Budget optimization failed: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())