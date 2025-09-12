"""
Pocketmon Pipeline Plugins

Plugin system for extensible asset processing and analysis.
"""

from .base import BasePlugin
from .default_embeddings import DefaultEmbeddingsPlugin

__all__ = [
    "BasePlugin",
    "DefaultEmbeddingsPlugin",
]