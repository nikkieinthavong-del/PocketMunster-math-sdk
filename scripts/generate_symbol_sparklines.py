#!/usr/bin/env python3
"""
Generate Symbol Sparklines

Creates visualization data for symbol frequency and distribution patterns
across game assets, generating sparkline-style compact visualizations.
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import re
from collections import defaultdict, Counter
import math


class SymbolSparklineGenerator:
    """Generator for symbol frequency sparklines and visualizations."""
    
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        
        # Symbol pattern definitions
        self.symbol_patterns = {
            "game_symbols": r'["\']([A-Z][0-9]+|[A-Z]+)["\']',  # H1, M2, WILD, etc.
            "special_symbols": r'["\']([SW][A-Z]*|BONUS|FREE|MULTIPLIER)["\']',
            "numeric_values": r'["\']?(\d+(?:\.\d+)?)["\']?',
            "probability_values": r'["\']?(0\.\d+)["\']?',
        }
        
        # Sparkline configuration
        self.sparkline_width = 50
        self.sparkline_height = 10
        self.sparkline_chars = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
        
        # Analysis results
        self.symbol_frequencies = defaultdict(Counter)
        self.symbol_distributions = {}
        self.sparklines = {}
        
    def _log(self, message: str, level: str = "INFO") -> None:
        """Log message with timestamp."""
        if self.verbose or level in ["ERROR", "WARNING"]:
            timestamp = time.strftime("%H:%M:%S")
            print(f"[{timestamp}] [{level}] {message}")
    
    def discover_game_files(self, input_directory: Path) -> List[Path]:
        """Discover game-related files for analysis."""
        self._log(f"Discovering game files in: {input_directory}")
        
        game_files = []
        
        # File patterns that typically contain game symbols
        game_file_patterns = [
            "**/game_config.py",
            "**/gamestate.py", 
            "**/config.py",
            "**/*config*.json",
            "**/*paytable*.json",
            "**/*symbols*.json",
            "**/*reels*.csv",
            "**/lookUpTable*.csv"
        ]
        
        for pattern in game_file_patterns:
            matches = list(input_directory.glob(pattern))
            game_files.extend(matches)
        
        # Also include Python files in game directories
        for game_dir in input_directory.glob("games/*/"):
            if game_dir.is_dir():
                py_files = list(game_dir.rglob("*.py"))
                game_files.extend(py_files)
        
        # Remove duplicates and filter valid files
        unique_files = []
        seen_paths = set()
        
        for file_path in game_files:
            if file_path.is_file() and str(file_path) not in seen_paths:
                unique_files.append(file_path)
                seen_paths.add(str(file_path))
        
        self._log(f"Found {len(unique_files)} game files for analysis")
        return unique_files
    
    def analyze_file_symbols(self, file_path: Path) -> Dict[str, Any]:
        """Analyze symbols in a single file."""
        try:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
            
            file_analysis = {
                "path": str(file_path),
                "type": self._classify_file_type(file_path),
                "symbols": defaultdict(int),
                "patterns": {},
                "statistics": {}
            }
            
            # Extract symbols using patterns
            for pattern_name, pattern in self.symbol_patterns.items():
                matches = re.findall(pattern, content, re.IGNORECASE)
                
                if matches:
                    # Count occurrences
                    symbol_counts = Counter(matches)
                    file_analysis["patterns"][pattern_name] = dict(symbol_counts)
                    
                    # Add to overall symbols
                    for symbol, count in symbol_counts.items():
                        file_analysis["symbols"][symbol] += count
            
            # Calculate file-level statistics
            total_symbols = sum(file_analysis["symbols"].values())
            file_analysis["statistics"] = {
                "total_symbol_instances": total_symbols,
                "unique_symbols": len(file_analysis["symbols"]),
                "symbol_density": total_symbols / max(len(content), 1),
                "most_common_symbol": max(file_analysis["symbols"].items(), key=lambda x: x[1])[0] if file_analysis["symbols"] else None
            }
            
            return file_analysis
            
        except Exception as e:
            self._log(f"Error analyzing file {file_path}: {e}", "WARNING")
            return {
                "path": str(file_path),
                "type": "error",
                "symbols": {},
                "patterns": {},
                "statistics": {"error": str(e)}
            }
    
    def _classify_file_type(self, file_path: Path) -> str:
        """Classify file type based on path and extension."""
        path_str = str(file_path).lower()
        
        if "config" in path_str:
            return "config"
        elif "paytable" in path_str:
            return "paytable"
        elif "reel" in path_str or "strip" in path_str:
            return "reelstrip"
        elif "lookup" in path_str:
            return "lookup_table"
        elif file_path.suffix == ".csv":
            return "data"
        elif file_path.suffix == ".json":
            return "json_config"
        elif file_path.suffix == ".py":
            return "python_code"
        else:
            return "other"
    
    def aggregate_symbol_data(self, file_analyses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Aggregate symbol data across all analyzed files."""
        self._log("Aggregating symbol data across files...")
        
        # Global symbol frequencies
        global_symbols = defaultdict(int)
        symbols_by_file_type = defaultdict(lambda: defaultdict(int))
        file_type_counts = defaultdict(int)
        
        # Pattern-specific aggregations
        pattern_symbols = defaultdict(lambda: defaultdict(int))
        
        for analysis in file_analyses:
            file_type = analysis["type"]
            file_type_counts[file_type] += 1
            
            # Aggregate symbols
            for symbol, count in analysis["symbols"].items():
                global_symbols[symbol] += count
                symbols_by_file_type[file_type][symbol] += count
            
            # Aggregate by pattern
            for pattern_name, pattern_data in analysis["patterns"].items():
                for symbol, count in pattern_data.items():
                    pattern_symbols[pattern_name][symbol] += count
        
        # Calculate distributions and rankings
        total_symbol_instances = sum(global_symbols.values())
        
        symbol_distributions = {}
        for symbol, count in global_symbols.items():
            symbol_distributions[symbol] = {
                "count": count,
                "frequency": count / total_symbol_instances if total_symbol_instances > 0 else 0,
                "rank": 0  # Will be filled after sorting
            }
        
        # Rank symbols by frequency
        sorted_symbols = sorted(
            symbol_distributions.items(), 
            key=lambda x: x[1]["count"], 
            reverse=True
        )
        
        for rank, (symbol, data) in enumerate(sorted_symbols, 1):
            symbol_distributions[symbol]["rank"] = rank
        
        return {
            "global_symbols": dict(global_symbols),
            "symbol_distributions": symbol_distributions,
            "symbols_by_file_type": dict(symbols_by_file_type),
            "pattern_symbols": dict(pattern_symbols),
            "file_type_counts": dict(file_type_counts),
            "statistics": {
                "total_files_analyzed": len(file_analyses),
                "total_symbol_instances": total_symbol_instances,
                "unique_symbols": len(global_symbols),
                "average_symbols_per_file": total_symbol_instances / max(len(file_analyses), 1)
            }
        }
    
    def generate_sparklines(self, aggregated_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate sparkline visualizations for symbol data."""
        self._log("Generating sparklines...")
        
        sparklines = {}
        
        # Top symbols sparkline
        top_symbols = sorted(
            aggregated_data["global_symbols"].items(),
            key=lambda x: x[1],
            reverse=True
        )[:20]  # Top 20 symbols
        
        if top_symbols:
            symbol_counts = [count for symbol, count in top_symbols]
            sparklines["top_symbols"] = {
                "data": dict(top_symbols),
                "sparkline": self._create_sparkline(symbol_counts),
                "description": "Top 20 most frequent symbols"
            }
        
        # Symbols by file type sparklines
        sparklines["by_file_type"] = {}
        for file_type, symbols in aggregated_data["symbols_by_file_type"].items():
            if symbols:
                counts = list(symbols.values())
                sparklines["by_file_type"][file_type] = {
                    "data": dict(symbols),
                    "sparkline": self._create_sparkline(counts),
                    "description": f"Symbols in {file_type} files"
                }
        
        # Pattern-specific sparklines
        sparklines["by_pattern"] = {}
        for pattern_name, symbols in aggregated_data["pattern_symbols"].items():
            if symbols:
                counts = list(symbols.values())
                sparklines["by_pattern"][pattern_name] = {
                    "data": dict(symbols),
                    "sparkline": self._create_sparkline(counts),
                    "description": f"Symbols matching {pattern_name} pattern"
                }
        
        # Symbol frequency distribution sparkline
        frequencies = [
            data["frequency"] 
            for data in aggregated_data["symbol_distributions"].values()
        ]
        if frequencies:
            sparklines["frequency_distribution"] = {
                "sparkline": self._create_sparkline(frequencies),
                "description": "Overall symbol frequency distribution",
                "stats": {
                    "min": min(frequencies),
                    "max": max(frequencies), 
                    "mean": sum(frequencies) / len(frequencies)
                }
            }
        
        return sparklines
    
    def _create_sparkline(self, values: List[float], width: Optional[int] = None) -> str:
        """Create a sparkline visualization from numeric values."""
        if not values:
            return ""
        
        width = width or min(self.sparkline_width, len(values))
        
        # Normalize values to 0-1 range
        min_val = min(values)
        max_val = max(values)
        
        if max_val == min_val:
            # All values are the same
            char_index = len(self.sparkline_chars) // 2
            return self.sparkline_chars[char_index] * width
        
        # Sample values if we have more than desired width
        if len(values) > width:
            step = len(values) / width
            sampled_values = [values[int(i * step)] for i in range(width)]
        else:
            sampled_values = values[:width]
        
        # Convert to sparkline characters
        sparkline = ""
        for value in sampled_values:
            normalized = (value - min_val) / (max_val - min_val)
            char_index = int(normalized * (len(self.sparkline_chars) - 1))
            char_index = max(0, min(char_index, len(self.sparkline_chars) - 1))
            sparkline += self.sparkline_chars[char_index]
        
        return sparkline
    
    def generate_symbol_insights(self, aggregated_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate insights and observations about symbol usage."""
        insights = []
        
        # Symbol diversity insight
        stats = aggregated_data["statistics"]
        if stats["unique_symbols"] > 50:
            insights.append({
                "type": "diversity",
                "level": "info",
                "message": f"High symbol diversity detected ({stats['unique_symbols']} unique symbols)",
                "recommendation": "Consider symbol standardization for consistency"
            })
        elif stats["unique_symbols"] < 10:
            insights.append({
                "type": "diversity", 
                "level": "warning",
                "message": f"Low symbol diversity ({stats['unique_symbols']} unique symbols)",
                "recommendation": "Verify all game symbols are being captured"
            })
        
        # Frequency distribution insights
        distributions = aggregated_data["symbol_distributions"]
        if distributions:
            top_symbol_freq = max(d["frequency"] for d in distributions.values())
            
            if top_symbol_freq > 0.3:  # Top symbol represents >30% of usage
                top_symbol = next(
                    symbol for symbol, data in distributions.items() 
                    if data["frequency"] == top_symbol_freq
                )
                insights.append({
                    "type": "concentration",
                    "level": "info", 
                    "message": f"Symbol '{top_symbol}' dominates usage ({top_symbol_freq:.1%})",
                    "recommendation": "Check if this concentration is intentional"
                })
        
        # File type distribution insights
        file_type_counts = aggregated_data["file_type_counts"]
        if "config" not in file_type_counts:
            insights.append({
                "type": "coverage",
                "level": "warning",
                "message": "No configuration files analyzed",
                "recommendation": "Ensure game configuration files are included in analysis"
            })
        
        # Pattern-specific insights
        pattern_symbols = aggregated_data["pattern_symbols"]
        
        if "game_symbols" in pattern_symbols and len(pattern_symbols["game_symbols"]) > 20:
            insights.append({
                "type": "complexity",
                "level": "info",
                "message": f"Large symbol set detected ({len(pattern_symbols['game_symbols'])} game symbols)",
                "recommendation": "Consider symbol grouping for management"
            })
        
        if "special_symbols" in pattern_symbols:
            special_count = len(pattern_symbols["special_symbols"])
            if special_count > 10:
                insights.append({
                    "type": "special_symbols",
                    "level": "info",
                    "message": f"Many special symbols found ({special_count})",
                    "recommendation": "Verify special symbol behavior is well-documented"
                })
        
        return insights


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Generate Symbol Sparklines - Visual analysis of game symbol usage"
    )
    
    parser.add_argument(
        "--input",
        default="./games",
        help="Input directory to analyze for symbols"
    )
    parser.add_argument(
        "--output",
        help="Output file for sparkline data (JSON format)"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )
    
    args = parser.parse_args()
    
    try:
        generator = SymbolSparklineGenerator(verbose=args.verbose)
        
        # Discover and analyze files
        input_path = Path(args.input)
        if not input_path.exists():
            print(f"Error: Input path does not exist: {input_path}")
            return 1
        
        game_files = generator.discover_game_files(input_path)
        
        if not game_files:
            print("No game files found for analysis")
            return 0
        
        # Analyze each file
        file_analyses = []
        for file_path in game_files:
            analysis = generator.analyze_file_symbols(file_path)
            file_analyses.append(analysis)
        
        # Aggregate data
        aggregated_data = generator.aggregate_symbol_data(file_analyses)
        
        # Generate sparklines
        sparklines = generator.generate_sparklines(aggregated_data)
        
        # Generate insights
        insights = generator.generate_symbol_insights(aggregated_data)
        
        # Create comprehensive report
        report = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "input_directory": str(input_path),
            "analysis_summary": aggregated_data["statistics"],
            "sparklines": sparklines,
            "insights": insights,
            "detailed_data": {
                "symbol_distributions": aggregated_data["symbol_distributions"],
                "symbols_by_file_type": aggregated_data["symbols_by_file_type"],
                "pattern_symbols": aggregated_data["pattern_symbols"]
            },
            "file_analyses": file_analyses
        }
        
        # Output results
        if args.output:
            output_path = Path(args.output)
            with open(output_path, 'w') as f:
                json.dump(report, f, indent=2)
            print(f"Symbol sparklines written to: {output_path}")
        else:
            print(json.dumps(report, indent=2))
        
        # Print summary and sparklines
        print(f"\nSymbol Analysis Summary:")
        print(f"Files Analyzed: {aggregated_data['statistics']['total_files_analyzed']}")
        print(f"Unique Symbols: {aggregated_data['statistics']['unique_symbols']}")
        print(f"Total Instances: {aggregated_data['statistics']['total_symbol_instances']}")
        
        if "top_symbols" in sparklines:
            print(f"\nTop Symbols: {sparklines['top_symbols']['sparkline']}")
        
        if "frequency_distribution" in sparklines:
            print(f"Frequency Distribution: {sparklines['frequency_distribution']['sparkline']}")
        
        # Show insights
        if insights:
            print(f"\nInsights ({len(insights)}):")
            for insight in insights[:3]:  # Show top 3
                print(f"- [{insight['level'].upper()}] {insight['message']}")
        
        return 0
        
    except KeyboardInterrupt:
        print("\nSymbol analysis interrupted by user")
        return 130
    except Exception as e:
        print(f"Symbol analysis failed: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())