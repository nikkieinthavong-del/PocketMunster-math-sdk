"""
Base Plugin Interface

Abstract base class for all pipeline plugins.
"""

import abc
from typing import Dict, Any, List, Optional
from pathlib import Path


class BasePlugin(abc.ABC):
    """Abstract base class for pipeline plugins."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize plugin with configuration."""
        self.config = config
        self.name = self.__class__.__name__
        self.enabled = config.get("enabled", True)
    
    @abc.abstractmethod
    def validate_config(self) -> bool:
        """Validate plugin configuration.
        
        Returns:
            True if configuration is valid, False otherwise.
        """
        pass
    
    @abc.abstractmethod
    def process(self, input_data: Any, context: Dict[str, Any]) -> Dict[str, Any]:
        """Process input data and return results.
        
        Args:
            input_data: Input data to process
            context: Processing context with metadata
            
        Returns:
            Dictionary containing processing results and metadata
        """
        pass
    
    def get_dependencies(self) -> List[str]:
        """Get list of plugin dependencies.
        
        Returns:
            List of plugin names this plugin depends on.
        """
        return []
    
    def get_output_schema(self) -> Optional[Dict[str, Any]]:
        """Get JSON schema for plugin output.
        
        Returns:
            JSON schema dictionary or None if no schema validation.
        """
        return None
    
    def cleanup(self) -> None:
        """Cleanup resources after processing."""
        pass
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get plugin performance metrics.
        
        Returns:
            Dictionary of performance metrics.
        """
        return {
            "name": self.name,
            "enabled": self.enabled,
            "processed_items": 0,
            "processing_time_ms": 0,
            "memory_usage_mb": 0,
            "errors": 0
        }


class PluginRegistry:
    """Registry for managing pipeline plugins."""
    
    def __init__(self):
        self._plugins: Dict[str, BasePlugin] = {}
        self._plugin_order: List[str] = []
    
    def register(self, plugin: BasePlugin) -> None:
        """Register a plugin."""
        if not plugin.validate_config():
            raise ValueError(f"Invalid configuration for plugin: {plugin.name}")
        
        self._plugins[plugin.name] = plugin
        if plugin.name not in self._plugin_order:
            self._plugin_order.append(plugin.name)
    
    def get_plugin(self, name: str) -> Optional[BasePlugin]:
        """Get plugin by name."""
        return self._plugins.get(name)
    
    def get_enabled_plugins(self) -> List[BasePlugin]:
        """Get list of enabled plugins in order."""
        return [
            self._plugins[name] 
            for name in self._plugin_order 
            if name in self._plugins and self._plugins[name].enabled
        ]
    
    def validate_dependencies(self) -> bool:
        """Validate all plugin dependencies are satisfied."""
        enabled_names = {p.name for p in self.get_enabled_plugins()}
        
        for plugin in self.get_enabled_plugins():
            dependencies = plugin.get_dependencies()
            for dep in dependencies:
                if dep not in enabled_names:
                    raise ValueError(
                        f"Plugin {plugin.name} depends on {dep} which is not enabled"
                    )
        return True
    
    def cleanup_all(self) -> None:
        """Cleanup all registered plugins."""
        for plugin in self._plugins.values():
            try:
                plugin.cleanup()
            except Exception as e:
                print(f"Error cleaning up plugin {plugin.name}: {e}")