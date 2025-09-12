"""
Default Embeddings Plugin

Provides basic embedding generation and similarity analysis for asset content.
"""

import json
import hashlib
from typing import Dict, Any, List, Optional
from pathlib import Path
import numpy as np

from .base import BasePlugin


class DefaultEmbeddingsPlugin(BasePlugin):
    """Default implementation for embeddings generation and analysis."""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.embedding_dimension = config.get("embedding_dimension", 128)
        self.similarity_threshold = config.get("similarity_threshold", 0.95)
        self.batch_size = config.get("batch_size", 100)
        
    def validate_config(self) -> bool:
        """Validate plugin configuration."""
        required_keys = ["embedding_dimension", "similarity_threshold"]
        for key in required_keys:
            if key not in self.config:
                return False
        
        if self.embedding_dimension <= 0 or self.embedding_dimension > 1024:
            return False
            
        if not (0.0 <= self.similarity_threshold <= 1.0):
            return False
            
        return True
    
    def process(self, input_data: Any, context: Dict[str, Any]) -> Dict[str, Any]:
        """Process input data to generate embeddings and find duplicates."""
        try:
            # Extract content from input data
            content_items = self._extract_content(input_data)
            
            # Generate embeddings
            embeddings = self._generate_embeddings(content_items)
            
            # Find duplicates/similar items
            duplicate_groups = self._find_duplicates(embeddings, content_items)
            
            # Generate analysis report
            analysis = self._analyze_embeddings(embeddings, duplicate_groups)
            
            return {
                "status": "success",
                "embeddings_count": len(embeddings),
                "duplicate_groups": duplicate_groups,
                "analysis": analysis,
                "similarity_threshold": self.similarity_threshold,
                "embedding_dimension": self.embedding_dimension
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "embeddings_count": 0,
                "duplicate_groups": [],
                "analysis": {}
            }
    
    def _extract_content(self, input_data: Any) -> List[Dict[str, Any]]:
        """Extract content items from input data."""
        content_items = []
        
        if isinstance(input_data, dict):
            # Handle dictionary input
            for key, value in input_data.items():
                content_items.append({
                    "id": key,
                    "content": json.dumps(value) if isinstance(value, dict) else str(value),
                    "type": "dict_value"
                })
        elif isinstance(input_data, list):
            # Handle list input
            for i, item in enumerate(input_data):
                content_items.append({
                    "id": f"item_{i}",
                    "content": json.dumps(item) if isinstance(item, dict) else str(item),
                    "type": "list_item"
                })
        elif isinstance(input_data, (str, Path)):
            # Handle file path input
            file_path = Path(input_data)
            if file_path.exists() and file_path.is_file():
                content = file_path.read_text(encoding="utf-8")
                content_items.append({
                    "id": str(file_path),
                    "content": content,
                    "type": "file"
                })
        else:
            # Handle other types
            content_items.append({
                "id": "single_item",
                "content": str(input_data),
                "type": "unknown"
            })
        
        return content_items
    
    def _generate_embeddings(self, content_items: List[Dict[str, Any]]) -> Dict[str, np.ndarray]:
        """Generate embeddings for content items using simple hash-based method."""
        embeddings = {}
        
        for item in content_items:
            # Simple embedding generation using content hash
            content_hash = hashlib.sha256(item["content"].encode()).hexdigest()
            
            # Convert hash to fixed-size embedding vector
            embedding = self._hash_to_embedding(content_hash)
            embeddings[item["id"]] = embedding
            
        return embeddings
    
    def _hash_to_embedding(self, content_hash: str) -> np.ndarray:
        """Convert hash string to fixed-size embedding vector."""
        # Use hash bytes to seed random number generator for reproducible embeddings
        hash_bytes = bytes.fromhex(content_hash)
        seed = int.from_bytes(hash_bytes[:4], byteorder='big')
        
        # Generate embedding using seeded random values
        rng = np.random.RandomState(seed)
        embedding = rng.randn(self.embedding_dimension)
        
        # Normalize to unit vector
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm
            
        return embedding
    
    def _find_duplicates(
        self, 
        embeddings: Dict[str, np.ndarray], 
        content_items: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Find duplicate/similar content based on embeddings."""
        duplicate_groups = []
        processed_items = set()
        
        embedding_list = list(embeddings.items())
        
        for i, (item_id, embedding) in enumerate(embedding_list):
            if item_id in processed_items:
                continue
                
            # Find similar items
            similar_items = [item_id]
            
            for j, (other_id, other_embedding) in enumerate(embedding_list[i+1:], i+1):
                if other_id in processed_items:
                    continue
                    
                # Calculate cosine similarity
                similarity = np.dot(embedding, other_embedding)
                
                if similarity >= self.similarity_threshold:
                    similar_items.append(other_id)
                    processed_items.add(other_id)
            
            # Add to duplicate groups if we found similarities
            if len(similar_items) > 1:
                duplicate_groups.append({
                    "group_id": f"group_{len(duplicate_groups)}",
                    "items": similar_items,
                    "similarity_scores": self._calculate_group_similarities(
                        similar_items, embeddings
                    ),
                    "representative": similar_items[0]
                })
            
            processed_items.add(item_id)
        
        return duplicate_groups
    
    def _calculate_group_similarities(
        self, 
        item_ids: List[str], 
        embeddings: Dict[str, np.ndarray]
    ) -> Dict[str, float]:
        """Calculate pairwise similarities within a group."""
        similarities = {}
        
        for i, item_id in enumerate(item_ids):
            for j, other_id in enumerate(item_ids[i+1:], i+1):
                similarity = float(np.dot(embeddings[item_id], embeddings[other_id]))
                similarities[f"{item_id}<->{other_id}"] = similarity
                
        return similarities
    
    def _analyze_embeddings(
        self, 
        embeddings: Dict[str, np.ndarray], 
        duplicate_groups: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Analyze embeddings to provide insights."""
        if not embeddings:
            return {}
        
        embedding_matrix = np.array(list(embeddings.values()))
        
        # Calculate statistics
        mean_embedding = np.mean(embedding_matrix, axis=0)
        std_embedding = np.std(embedding_matrix, axis=0)
        
        # Calculate pairwise similarities
        similarities = []
        items = list(embeddings.items())
        for i in range(len(items)):
            for j in range(i+1, len(items)):
                sim = float(np.dot(items[i][1], items[j][1]))
                similarities.append(sim)
        
        return {
            "total_embeddings": len(embeddings),
            "embedding_stats": {
                "mean_norm": float(np.mean([np.linalg.norm(emb) for emb in embedding_matrix])),
                "std_norm": float(np.std([np.linalg.norm(emb) for emb in embedding_matrix])),
                "dimension": self.embedding_dimension
            },
            "similarity_stats": {
                "mean_similarity": float(np.mean(similarities)) if similarities else 0.0,
                "max_similarity": float(np.max(similarities)) if similarities else 0.0,
                "min_similarity": float(np.min(similarities)) if similarities else 0.0,
                "std_similarity": float(np.std(similarities)) if similarities else 0.0
            },
            "duplicate_analysis": {
                "total_groups": len(duplicate_groups),
                "total_duplicates": sum(len(group["items"]) for group in duplicate_groups),
                "largest_group_size": max(len(group["items"]) for group in duplicate_groups) if duplicate_groups else 0
            }
        }
    
    def get_output_schema(self) -> Dict[str, Any]:
        """Get JSON schema for plugin output."""
        return {
            "type": "object",
            "properties": {
                "status": {"type": "string", "enum": ["success", "error"]},
                "embeddings_count": {"type": "integer", "minimum": 0},
                "duplicate_groups": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "group_id": {"type": "string"},
                            "items": {"type": "array", "items": {"type": "string"}},
                            "similarity_scores": {"type": "object"},
                            "representative": {"type": "string"}
                        },
                        "required": ["group_id", "items", "representative"]
                    }
                },
                "analysis": {"type": "object"},
                "similarity_threshold": {"type": "number", "minimum": 0, "maximum": 1},
                "embedding_dimension": {"type": "integer", "minimum": 1}
            },
            "required": ["status", "embeddings_count", "duplicate_groups", "analysis"]
        }