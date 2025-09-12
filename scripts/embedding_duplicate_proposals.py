#!/usr/bin/env python3
"""
Embedding Duplicate Proposals

Analyzes assets using embeddings to identify duplicates and near-duplicates,
proposing consolidation strategies and similarity groupings.
"""

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import hashlib
import numpy as np
from collections import defaultdict

# Import the plugin for embeddings functionality
sys.path.append(str(Path(__file__).parent.parent))
from pocketmon_pipeline.plugins.default_embeddings import DefaultEmbeddingsPlugin


class EmbeddingDuplicateAnalyzer:
    """Analyzer for identifying duplicate assets using embeddings."""
    
    def __init__(self, config_path: str, verbose: bool = False):
        self.config_path = Path(config_path)
        self.verbose = verbose
        self.config = self._load_config()
        
        # Embedding configuration
        embedding_config = self.config.get("embedding_duplicates", {})
        self.similarity_threshold = embedding_config.get("similarity_threshold", 0.95)
        self.comparison_algorithm = embedding_config.get("comparison_algorithm", "cosine_similarity")
        self.max_embedding_dimension = embedding_config.get("max_embedding_dimension", 512)
        self.batch_size = embedding_config.get("batch_size", 100)
        self.enable_clustering = embedding_config.get("enable_clustering", True)
        self.cluster_threshold = embedding_config.get("cluster_threshold", 0.8)
        
        # Initialize embeddings plugin
        plugin_config = {
            "enabled": True,
            "embedding_dimension": min(128, self.max_embedding_dimension),  # Use smaller dimension for efficiency
            "similarity_threshold": self.similarity_threshold,
            "batch_size": self.batch_size
        }
        self.embeddings_plugin = DefaultEmbeddingsPlugin(plugin_config)
        
        # Analysis results
        self.duplicate_groups = []
        self.consolidation_proposals = []
        self.analysis_stats = {}
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from file."""
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
    
    def discover_assets(self, input_directory: Path) -> List[Dict[str, Any]]:
        """Discover assets in the input directory."""
        self._log(f"Discovering assets in: {input_directory}")
        
        assets = []
        
        if input_directory.is_file():
            # Single file
            assets.append(self._create_asset_info(input_directory))
        else:
            # Directory traversal
            for file_path in input_directory.rglob('*'):
                if file_path.is_file() and self._should_analyze_file(file_path):
                    assets.append(self._create_asset_info(file_path))
        
        self._log(f"Discovered {len(assets)} assets for analysis")
        return assets
    
    def _should_analyze_file(self, file_path: Path) -> bool:
        """Determine if file should be analyzed for duplicates."""
        # Skip certain file types and directories
        skip_patterns = [
            '.git', '__pycache__', '.pyc', '.pyo', 'node_modules',
            '.DS_Store', 'Thumbs.db', '.tmp'
        ]
        
        file_str = str(file_path)
        for pattern in skip_patterns:
            if pattern in file_str:
                return False
        
        # Include specific file types that are likely to have meaningful content
        analyze_extensions = {'.json', '.csv', '.txt', '.md', '.py', '.js', '.yaml', '.yml'}
        
        return file_path.suffix.lower() in analyze_extensions
    
    def _create_asset_info(self, file_path: Path) -> Dict[str, Any]:
        """Create asset information dictionary."""
        try:
            stat = file_path.stat()
            
            # Read content for analysis
            content = ""
            try:
                content = file_path.read_text(encoding='utf-8', errors='ignore')
            except Exception:
                # For binary files or encoding issues, use file metadata
                content = f"BINARY_FILE:{file_path.suffix}:{stat.st_size}"
            
            # Calculate content hash
            content_hash = hashlib.sha256(content.encode()).hexdigest()
            
            return {
                "path": str(file_path),
                "name": file_path.name,
                "size_bytes": stat.st_size,
                "extension": file_path.suffix,
                "content": content,
                "content_hash": content_hash,
                "modified_time": stat.st_mtime,
                "id": content_hash[:16]  # Use first 16 chars of hash as ID
            }
            
        except Exception as e:
            self._log(f"Error creating asset info for {file_path}: {e}", "WARNING")
            return {
                "path": str(file_path),
                "name": file_path.name,
                "size_bytes": 0,
                "extension": file_path.suffix,
                "content": "",
                "content_hash": "",
                "modified_time": 0,
                "id": f"error_{hash(str(file_path))}"
            }
    
    def analyze_duplicates(self, assets: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze assets to identify duplicates using embeddings."""
        self._log(f"Analyzing {len(assets)} assets for duplicates...")
        
        if not assets:
            return {"duplicate_groups": [], "analysis": {}}
        
        # Process assets in batches
        all_duplicate_groups = []
        batch_size = min(self.batch_size, len(assets))
        
        for i in range(0, len(assets), batch_size):
            batch = assets[i:i + batch_size]
            self._log(f"Processing batch {i//batch_size + 1}/{(len(assets) + batch_size - 1)//batch_size}")
            
            batch_result = self._analyze_batch(batch)
            if batch_result["duplicate_groups"]:
                all_duplicate_groups.extend(batch_result["duplicate_groups"])
        
        # Post-process and merge results
        merged_groups = self._merge_duplicate_groups(all_duplicate_groups, assets)
        
        # Generate analysis statistics
        analysis = self._generate_analysis(merged_groups, assets)
        
        return {
            "duplicate_groups": merged_groups,
            "analysis": analysis
        }
    
    def _analyze_batch(self, assets_batch: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze a batch of assets for duplicates."""
        # Prepare input data for embeddings plugin
        input_data = {asset["id"]: asset["content"] for asset in assets_batch}
        
        # Create processing context
        context = {
            "batch_size": len(assets_batch),
            "similarity_threshold": self.similarity_threshold,
            "analysis_timestamp": time.time()
        }
        
        # Run embeddings analysis
        result = self.embeddings_plugin.process(input_data, context)
        
        if result["status"] != "success":
            self._log(f"Embeddings analysis failed: {result.get('error', 'Unknown error')}", "ERROR")
            return {"duplicate_groups": [], "analysis": {}}
        
        # Enrich duplicate groups with asset metadata
        enriched_groups = []
        asset_lookup = {asset["id"]: asset for asset in assets_batch}
        
        for group in result["duplicate_groups"]:
            enriched_group = {
                "group_id": group["group_id"],
                "similarity_scores": group["similarity_scores"],
                "representative": group["representative"],
                "assets": []
            }
            
            for item_id in group["items"]:
                if item_id in asset_lookup:
                    enriched_group["assets"].append(asset_lookup[item_id])
            
            if len(enriched_group["assets"]) > 1:  # Only include groups with multiple assets
                enriched_groups.append(enriched_group)
        
        return {
            "duplicate_groups": enriched_groups,
            "analysis": result["analysis"]
        }
    
    def _merge_duplicate_groups(
        self, 
        groups: List[Dict[str, Any]], 
        all_assets: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Merge overlapping duplicate groups from multiple batches."""
        if not groups:
            return []
        
        # Simple merge strategy: combine groups that share assets
        asset_to_groups = defaultdict(list)
        
        for i, group in enumerate(groups):
            for asset in group["assets"]:
                asset_to_groups[asset["id"]].append(i)
        
        # Find connected components (groups that share assets)
        merged_groups = []
        processed_group_indices = set()
        
        for i, group in enumerate(groups):
            if i in processed_group_indices:
                continue
            
            # Find all groups connected to this one
            connected_indices = {i}
            to_check = [i]
            
            while to_check:
                current_idx = to_check.pop()
                current_group = groups[current_idx]
                
                for asset in current_group["assets"]:
                    for related_idx in asset_to_groups[asset["id"]]:
                        if related_idx not in connected_indices:
                            connected_indices.add(related_idx)
                            to_check.append(related_idx)
            
            # Merge all connected groups
            merged_assets = []
            merged_similarities = {}
            
            for idx in connected_indices:
                merged_assets.extend(groups[idx]["assets"])
                merged_similarities.update(groups[idx]["similarity_scores"])
                processed_group_indices.add(idx)
            
            # Remove duplicates while preserving order
            unique_assets = []
            seen_ids = set()
            for asset in merged_assets:
                if asset["id"] not in seen_ids:
                    unique_assets.append(asset)
                    seen_ids.add(asset["id"])
            
            if len(unique_assets) > 1:
                merged_groups.append({
                    "group_id": f"merged_group_{len(merged_groups)}",
                    "assets": unique_assets,
                    "similarity_scores": merged_similarities,
                    "representative": unique_assets[0]["id"],  # First asset as representative
                    "merge_count": len(connected_indices)
                })
        
        return merged_groups
    
    def _generate_analysis(
        self, 
        duplicate_groups: List[Dict[str, Any]], 
        all_assets: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate analysis statistics and insights."""
        total_assets = len(all_assets)
        duplicate_assets = set()
        
        for group in duplicate_groups:
            for asset in group["assets"]:
                duplicate_assets.add(asset["id"])
        
        # Calculate size savings potential
        total_duplicate_size = 0
        potential_savings = 0
        
        for group in duplicate_groups:
            group_sizes = [asset["size_bytes"] for asset in group["assets"]]
            total_duplicate_size += sum(group_sizes)
            # Potential savings: keep largest, remove others
            if group_sizes:
                potential_savings += sum(group_sizes) - max(group_sizes)
        
        # File type analysis
        duplicate_by_type = defaultdict(int)
        for group in duplicate_groups:
            for asset in group["assets"]:
                duplicate_by_type[asset["extension"]] += 1
        
        return {
            "total_assets": total_assets,
            "duplicate_groups_count": len(duplicate_groups),
            "duplicate_assets_count": len(duplicate_assets),
            "duplicate_rate": len(duplicate_assets) / total_assets if total_assets > 0 else 0,
            "size_analysis": {
                "total_duplicate_size_bytes": total_duplicate_size,
                "potential_savings_bytes": potential_savings,
                "potential_savings_mb": potential_savings / 1024 / 1024
            },
            "type_distribution": dict(duplicate_by_type),
            "largest_group_size": max(len(g["assets"]) for g in duplicate_groups) if duplicate_groups else 0,
            "average_group_size": (
                sum(len(g["assets"]) for g in duplicate_groups) / len(duplicate_groups)
                if duplicate_groups else 0
            )
        }
    
    def generate_consolidation_proposals(self, duplicate_groups: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate consolidation proposals for duplicate groups."""
        self._log("Generating consolidation proposals...")
        
        proposals = []
        
        for group in duplicate_groups:
            if len(group["assets"]) < 2:
                continue
            
            # Determine best representative (largest file, most recent, or best name)
            representative = self._select_best_representative(group["assets"])
            
            # Files to remove/consolidate
            to_remove = [asset for asset in group["assets"] if asset["id"] != representative["id"]]
            
            # Calculate savings
            size_savings = sum(asset["size_bytes"] for asset in to_remove)
            
            # Generate proposal
            proposal = {
                "group_id": group["group_id"],
                "action": "consolidate_duplicates",
                "representative": {
                    "path": representative["path"],
                    "name": representative["name"],
                    "reason": self._get_selection_reason(representative, group["assets"])
                },
                "to_remove": [
                    {
                        "path": asset["path"],
                        "name": asset["name"],
                        "size_bytes": asset["size_bytes"]
                    }
                    for asset in to_remove
                ],
                "impact": {
                    "files_removed": len(to_remove),
                    "size_savings_bytes": size_savings,
                    "size_savings_mb": size_savings / 1024 / 1024,
                },
                "confidence": self._calculate_consolidation_confidence(group),
                "risk_level": self._assess_consolidation_risk(group)
            }
            
            proposals.append(proposal)
        
        # Sort proposals by impact (highest savings first)
        proposals.sort(key=lambda p: p["impact"]["size_savings_bytes"], reverse=True)
        
        return proposals
    
    def _select_best_representative(self, assets: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Select the best representative from a group of duplicate assets."""
        # Scoring criteria: size (40%), recency (30%), path quality (30%)
        
        scored_assets = []
        
        for asset in assets:
            score = 0
            
            # Size score (larger is better for keeping)
            max_size = max(a["size_bytes"] for a in assets)
            if max_size > 0:
                score += 0.4 * (asset["size_bytes"] / max_size)
            
            # Recency score (more recent is better)
            max_mtime = max(a["modified_time"] for a in assets)
            if max_mtime > 0:
                score += 0.3 * (asset["modified_time"] / max_mtime)
            
            # Path quality score (shorter, cleaner paths are better)
            path_parts = Path(asset["path"]).parts
            path_score = 1.0 / (len(path_parts) + 1)  # Shorter paths score higher
            score += 0.3 * path_score
            
            scored_assets.append((score, asset))
        
        # Return asset with highest score
        scored_assets.sort(reverse=True)
        return scored_assets[0][1]
    
    def _get_selection_reason(self, selected: Dict[str, Any], all_assets: List[Dict[str, Any]]) -> str:
        """Get human-readable reason for representative selection."""
        reasons = []
        
        # Size comparison
        sizes = [a["size_bytes"] for a in all_assets]
        if selected["size_bytes"] == max(sizes):
            reasons.append("largest file")
        
        # Recency comparison
        mtimes = [a["modified_time"] for a in all_assets]
        if selected["modified_time"] == max(mtimes):
            reasons.append("most recently modified")
        
        # Path quality
        path_parts = len(Path(selected["path"]).parts)
        min_path_parts = min(len(Path(a["path"]).parts) for a in all_assets)
        if path_parts == min_path_parts:
            reasons.append("shortest path")
        
        return ", ".join(reasons) if reasons else "default selection"
    
    def _calculate_consolidation_confidence(self, group: Dict[str, Any]) -> float:
        """Calculate confidence level for consolidation proposal."""
        # Base confidence on similarity scores and group characteristics
        
        if "similarity_scores" not in group or not group["similarity_scores"]:
            return 0.5  # Default moderate confidence
        
        # Get similarity scores
        similarities = list(group["similarity_scores"].values())
        
        if not similarities:
            return 0.5
        
        # Higher average similarity = higher confidence
        avg_similarity = sum(similarities) / len(similarities)
        
        # Adjust based on group size (smaller groups = higher confidence)
        size_factor = max(0.5, 1.0 - (len(group["assets"]) - 2) * 0.1)
        
        # Combine factors
        confidence = avg_similarity * size_factor
        
        return min(1.0, max(0.0, confidence))
    
    def _assess_consolidation_risk(self, group: Dict[str, Any]) -> str:
        """Assess risk level for consolidation."""
        confidence = self._calculate_consolidation_confidence(group)
        group_size = len(group["assets"])
        
        if confidence >= 0.9 and group_size <= 3:
            return "low"
        elif confidence >= 0.7 and group_size <= 5:
            return "medium"
        else:
            return "high"


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Embedding Duplicate Proposals - Asset duplication analysis"
    )
    
    parser.add_argument(
        "--config",
        required=True,
        help="Path to configuration file"
    )
    parser.add_argument(
        "--input",
        default="./assets",
        help="Input directory to analyze for duplicates"
    )
    parser.add_argument(
        "--output",
        help="Output file for duplicate analysis results (JSON format)"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )
    
    args = parser.parse_args()
    
    try:
        analyzer = EmbeddingDuplicateAnalyzer(args.config, verbose=args.verbose)
        
        # Discover assets
        input_path = Path(args.input)
        if not input_path.exists():
            print(f"Error: Input path does not exist: {input_path}")
            return 1
        
        assets = analyzer.discover_assets(input_path)
        
        if not assets:
            print("No assets found for analysis")
            return 0
        
        # Analyze duplicates
        duplicate_analysis = analyzer.analyze_duplicates(assets)
        
        # Generate consolidation proposals
        proposals = analyzer.generate_consolidation_proposals(
            duplicate_analysis["duplicate_groups"]
        )
        
        # Create comprehensive report
        report = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "config_file": str(analyzer.config_path),
            "input_directory": str(input_path),
            "analysis": duplicate_analysis["analysis"],
            "duplicate_groups": duplicate_analysis["duplicate_groups"],
            "consolidation_proposals": proposals,
            "summary": {
                "total_proposals": len(proposals),
                "total_potential_savings_mb": sum(
                    p["impact"]["size_savings_mb"] for p in proposals
                ),
                "high_confidence_proposals": len([
                    p for p in proposals if p["confidence"] >= 0.8
                ]),
                "low_risk_proposals": len([
                    p for p in proposals if p["risk_level"] == "low"
                ])
            }
        }
        
        # Output results
        if args.output:
            output_path = Path(args.output)
            with open(output_path, 'w') as f:
                json.dump(report, f, indent=2)
            print(f"Duplicate analysis results written to: {output_path}")
        else:
            print(json.dumps(report, indent=2))
        
        # Print summary
        analysis = duplicate_analysis["analysis"]
        summary = report["summary"]
        
        print(f"\nEmbedding Duplicate Analysis Summary:")
        print(f"Total Assets: {analysis['total_assets']}")
        print(f"Duplicate Groups: {analysis['duplicate_groups_count']}")
        print(f"Duplicate Rate: {analysis['duplicate_rate']:.1%}")
        print(f"Potential Savings: {analysis['size_analysis']['potential_savings_mb']:.1f} MB")
        print(f"Consolidation Proposals: {summary['total_proposals']}")
        print(f"Low Risk Proposals: {summary['low_risk_proposals']}")
        
        return 0
        
    except KeyboardInterrupt:
        print("\nDuplicate analysis interrupted by user")
        return 130
    except Exception as e:
        print(f"Duplicate analysis failed: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())