"""
Pocketmon Pipeline - Asset Governance Pipeline for Math-SDK

This package provides comprehensive asset quality control, governance,
performance monitoring, and integrity verification for gaming math engines.
"""

__version__ = "0.1.0"
__author__ = "CarrotRGS"
__email__ = "engineering@carrot.rgs"

# Core components
from .cli import main as cli_main
from .plugins.base import BasePlugin

__all__ = [
    "__version__",
    "__author__", 
    "__email__",
    "cli_main",
    "BasePlugin",
]