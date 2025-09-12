#!/usr/bin/env python3
"""
Generate Fixture Assets

Creates test fixture assets for golden test validation.
Generates realistic but deterministic test data for pipeline validation.
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, Any, List, Optional
import random
import hashlib


class FixtureGenerator:
    """Generator for test fixture assets."""
    
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.fixtures_dir = Path("tests/fixtures")
        
        # Ensure fixtures directory exists
        self.fixtures_dir.mkdir(parents=True, exist_ok=True)
        
        # Set deterministic seed for reproducible fixtures
        random.seed(42)
    
    def _log(self, message: str, level: str = "INFO") -> None:
        """Log message with timestamp."""
        if self.verbose or level in ["ERROR", "WARNING"]:
            timestamp = time.strftime("%H:%M:%S")
            print(f"[{timestamp}] [{level}] {message}")
    
    def generate_test_performance_data(self) -> Dict[str, Any]:
        """Generate test data for performance profiling."""
        self._log("Generating performance test data...")
        
        # Create mock performance data
        performance_data = {
            "test_config": {
                "test_name": "performance_profile",
                "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "seed": 42
            },
            "mock_assets": [
                {"name": "config.json", "size": 1024, "type": "config"},
                {"name": "data.csv", "size": 5120, "type": "data"},
                {"name": "symbols.json", "size": 512, "type": "symbols"}
            ],
            "expected_processing_time": 1.5,
            "expected_memory_usage": 64
        }
        
        # Write to fixture file
        fixture_file = self.fixtures_dir / "performance_test_data.json"
        with open(fixture_file, 'w') as f:
            json.dump(performance_data, f, indent=2)
        
        self._log(f"Performance test data written to {fixture_file}")
        return performance_data
    
    def generate_test_policy_data(self) -> Dict[str, Any]:
        """Generate test data for policy guard evaluation."""
        self._log("Generating policy test data...")
        
        # Create test files with various compliance issues
        test_files = {
            "valid_config.json": {
                "version": "1.0",
                "name": "test_config",
                "settings": {"debug": False}
            },
            "large_file.txt": "x" * 2048,  # Larger test file
            "invalid.json": '{"incomplete": json,}',  # Invalid JSON
            "small_file.txt": "tiny",  # Small file
            "normal_file.py": """
# Test Python file
def test_function():
    return "hello world"

class TestClass:
    def __init__(self):
        self.value = 42
            """
        }
        
        # Write test files
        for filename, content in test_files.items():
            file_path = self.fixtures_dir / filename
            
            if isinstance(content, dict):
                with open(file_path, 'w') as f:
                    json.dump(content, f, indent=2)
            else:
                file_path.write_text(content)
        
        # Create policy test metadata
        policy_data = {
            "test_config": {
                "test_name": "policy_guard_report",
                "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "seed": 42
            },
            "test_files": list(test_files.keys()),
            "expected_violations": [
                {"file": "invalid.json", "type": "INVALID_JSON"},
                {"file": "small_file.txt", "type": "FILE_SIZE_TOO_SMALL"}
            ],
            "expected_warnings": [
                {"file": "large_file.txt", "type": "FILE_SIZE_LARGE"}
            ]
        }
        
        fixture_file = self.fixtures_dir / "policy_test_data.json"
        with open(fixture_file, 'w') as f:
            json.dump(policy_data, f, indent=2)
        
        self._log(f"Policy test data written to {fixture_file}")
        return policy_data
    
    def generate_test_embedding_data(self) -> Dict[str, Any]:
        """Generate test data for embedding duplicate analysis."""
        self._log("Generating embedding test data...")
        
        # Create test files with intentional duplicates
        test_content = {
            "file1.json": {"symbols": ["H1", "H2", "WILD"], "paytable": [10, 20, 50]},
            "file2.json": {"symbols": ["H1", "H2", "WILD"], "paytable": [10, 20, 50]},  # Duplicate of file1
            "file3.json": {"symbols": ["M1", "M2", "SCATTER"], "paytable": [5, 15, 25]},
            "file4.txt": "Test content line 1\nTest content line 2\nUnique line",
            "file5.txt": "Test content line 1\nTest content line 2\nDifferent line",  # Similar to file4
            "unique_file.py": "def unique_function():\n    return 'unique'",
        }
        
        # Write test files
        for filename, content in test_content.items():
            file_path = self.fixtures_dir / filename
            
            if isinstance(content, dict):
                with open(file_path, 'w') as f:
                    json.dump(content, f, indent=2)
            else:
                file_path.write_text(content)
        
        # Create embedding test metadata
        embedding_data = {
            "test_config": {
                "test_name": "embedding_duplicates",
                "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "seed": 42
            },
            "test_files": list(test_content.keys()),
            "expected_duplicate_groups": [
                {
                    "files": ["file1.json", "file2.json"],
                    "similarity": 1.0,
                    "reason": "identical_content"
                },
                {
                    "files": ["file4.txt", "file5.txt"],
                    "similarity": 0.9,
                    "reason": "high_similarity"
                }
            ],
            "expected_unique_files": ["file3.json", "unique_file.py"]
        }
        
        fixture_file = self.fixtures_dir / "embedding_test_data.json"
        with open(fixture_file, 'w') as f:
            json.dump(embedding_data, f, indent=2)
        
        self._log(f"Embedding test data written to {fixture_file}")
        return embedding_data
    
    def generate_test_budget_data(self) -> Dict[str, Any]:
        """Generate test data for adaptive budget optimization."""
        self._log("Generating budget test data...")
        
        # Create mock workload data
        workload_data = {
            "file_count": 25,
            "total_size_mb": 12.5,
            "avg_file_size_mb": 0.5,
            "file_types": {
                ".json": 15,
                ".txt": 7,
                ".py": 3
            },
            "complexity_score": 0.4
        }
        
        # Write workload data
        workload_file = self.fixtures_dir / "workload_data.json"
        with open(workload_file, 'w') as f:
            json.dump(workload_data, f, indent=2)
        
        # Create budget test metadata
        budget_data = {
            "test_config": {
                "test_name": "budget_recommendations",
                "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "seed": 42
            },
            "workload_file": "workload_data.json",
            "expected_budget_range": {
                "min_seconds": 30,
                "max_seconds": 120
            },
            "expected_factors": {
                "workload_complexity": {"min": 1.0, "max": 1.5},
                "resource_cpu": {"min": 0.8, "max": 1.2}
            }
        }
        
        fixture_file = self.fixtures_dir / "budget_test_data.json"
        with open(fixture_file, 'w') as f:
            json.dump(budget_data, f, indent=2)
        
        self._log(f"Budget test data written to {fixture_file}")
        return budget_data
    
    def generate_test_symbol_data(self) -> Dict[str, Any]:
        """Generate test data for symbol sparkline generation."""
        self._log("Generating symbol test data...")
        
        # Create mock game files with symbols
        game_files = {
            "game_config.py": '''
"""Test game configuration."""

class GameConfig:
    def __init__(self):
        self.symbols = ["H1", "H2", "H3", "WILD", "SCATTER"]
        self.paytable = {
            "H1": [10, 25, 100],
            "H2": [5, 15, 75],
            "H3": [3, 10, 50],
            "WILD": [0, 50, 200],
            "SCATTER": [2, 10, 100]
        }
        self.special_symbols = ["WILD", "SCATTER"]
            ''',
            
            "paytable.json": {
                "symbols": {
                    "H1": {"name": "High Symbol 1", "values": [10, 25, 100]},
                    "H2": {"name": "High Symbol 2", "values": [5, 15, 75]},
                    "WILD": {"name": "Wild Symbol", "values": [0, 50, 200]}
                }
            },
            
            "reelstrip.csv": '''symbol,reel1,reel2,reel3,reel4,reel5
H1,5,4,6,5,4
H2,8,7,8,9,7
H3,12,11,10,12,11
WILD,2,2,1,2,2
SCATTER,1,1,2,1,1
''',
            
            "symbols_data.txt": '''
Game Symbols:
- H1: High value symbol
- H2: Medium value symbol  
- WILD: Wild substitutes for all symbols
- SCATTER: Triggers bonus features
            '''
        }
        
        # Create games directory structure
        games_dir = self.fixtures_dir / "games" / "test_game"
        games_dir.mkdir(parents=True, exist_ok=True)
        
        # Write game files
        for filename, content in game_files.items():
            file_path = games_dir / filename
            
            if isinstance(content, dict):
                with open(file_path, 'w') as f:
                    json.dump(content, f, indent=2)
            else:
                file_path.write_text(content)
        
        # Create symbol test metadata
        symbol_data = {
            "test_config": {
                "test_name": "symbol_sparklines",
                "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "seed": 42
            },
            "game_files": list(game_files.keys()),
            "expected_symbols": ["H1", "H2", "H3", "WILD", "SCATTER"],
            "expected_symbol_counts": {
                "H1": 8,  # Expected occurrences across all files
                "H2": 8,
                "H3": 2,
                "WILD": 6,
                "SCATTER": 4
            },
            "expected_sparklines": {
                "top_symbols": True,
                "by_file_type": True,
                "frequency_distribution": True
            }
        }
        
        fixture_file = self.fixtures_dir / "symbol_test_data.json"
        with open(fixture_file, 'w') as f:
            json.dump(symbol_data, f, indent=2)
        
        self._log(f"Symbol test data written to {fixture_file}")
        return symbol_data
    
    def generate_all_fixtures(self) -> Dict[str, Any]:
        """Generate all test fixtures."""
        self._log("Generating all test fixtures...")
        
        fixtures = {}
        
        try:
            fixtures["performance"] = self.generate_test_performance_data()
            fixtures["policy"] = self.generate_test_policy_data()
            fixtures["embedding"] = self.generate_test_embedding_data()
            fixtures["budget"] = self.generate_test_budget_data()
            fixtures["symbol"] = self.generate_test_symbol_data()
            
            # Create fixture summary
            summary = {
                "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "generator_version": "1.0",
                "fixtures_created": list(fixtures.keys()),
                "total_files": self._count_fixture_files(),
                "fixtures_directory": str(self.fixtures_dir)
            }
            
            summary_file = self.fixtures_dir / "fixtures_summary.json"
            with open(summary_file, 'w') as f:
                json.dump(summary, f, indent=2)
            
            self._log(f"All fixtures generated successfully")
            self._log(f"Summary written to {summary_file}")
            
            return summary
            
        except Exception as e:
            self._log(f"Error generating fixtures: {e}", "ERROR")
            raise
    
    def _count_fixture_files(self) -> int:
        """Count total fixture files created."""
        count = 0
        for item in self.fixtures_dir.rglob("*"):
            if item.is_file():
                count += 1
        return count
    
    def clean_fixtures(self) -> None:
        """Clean up existing fixture files."""
        self._log("Cleaning existing fixture files...")
        
        import shutil
        
        if self.fixtures_dir.exists():
            shutil.rmtree(self.fixtures_dir)
        
        self.fixtures_dir.mkdir(parents=True, exist_ok=True)
        self._log("Fixture directory cleaned")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Generate Fixture Assets - Create test data for pipeline validation"
    )
    
    parser.add_argument(
        "--test-name",
        help="Generate fixtures for specific test only"
    )
    parser.add_argument(
        "--generator",
        help="Specific generator function to run"
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Clean existing fixtures before generating"
    )
    parser.add_argument(
        "--output",
        help="Output file for fixture summary (JSON format)"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )
    
    args = parser.parse_args()
    
    try:
        generator = FixtureGenerator(verbose=args.verbose)
        
        # Clean fixtures if requested
        if args.clean:
            generator.clean_fixtures()
        
        # Generate specific fixture if requested
        if args.generator:
            if hasattr(generator, args.generator):
                result = getattr(generator, args.generator)()
                print(f"Generated fixture using {args.generator}")
                
                if args.output:
                    with open(args.output, 'w') as f:
                        json.dump(result, f, indent=2)
            else:
                print(f"Error: Unknown generator function: {args.generator}")
                return 1
        else:
            # Generate all fixtures
            summary = generator.generate_all_fixtures()
            
            if args.output:
                with open(args.output, 'w') as f:
                    json.dump(summary, f, indent=2)
                print(f"Fixture summary written to: {args.output}")
            
            print(f"\nFixture Generation Summary:")
            print(f"Fixtures Created: {len(summary['fixtures_created'])}")
            print(f"Total Files: {summary['total_files']}")
            print(f"Directory: {summary['fixtures_directory']}")
        
        return 0
        
    except KeyboardInterrupt:
        print("\nFixture generation interrupted by user")
        return 130
    except Exception as e:
        print(f"Fixture generation failed: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())