"""
Assert JSON Helper

Provides enhanced assertion functions for JSON comparison in tests,
with support for field ignoring, tolerance, and semantic comparison.
"""

import json
import math
from typing import Any, Dict, List, Optional, Union
from pathlib import Path


class JSONAssertionError(AssertionError):
    """Custom assertion error for JSON comparisons."""
    pass


class JSONAsserter:
    """Helper class for JSON assertions with advanced comparison features."""
    
    def __init__(self, tolerance: Optional[Dict[str, Any]] = None):
        """Initialize with comparison tolerance settings."""
        self.tolerance = tolerance or {
            "float_precision": 6,
            "percentage_tolerance": 0.001,  # 0.1%
            "timestamp_tolerance": 5.0  # 5 seconds
        }
        
        self.ignore_fields = set()
        self.ignore_field_patterns = []
    
    def set_ignore_fields(self, fields: Union[str, List[str]]) -> None:
        """Set fields to ignore during comparison."""
        if isinstance(fields, str):
            fields = [fields]
        
        for field in fields:
            if "*" in field or "." in field:
                self.ignore_field_patterns.append(field)
            else:
                self.ignore_fields.add(field)
    
    def assert_json_equal(
        self, 
        actual: Union[Dict, List, str, Path], 
        expected: Union[Dict, List, str, Path],
        message: Optional[str] = None
    ) -> None:
        """Assert that two JSON structures are equal."""
        actual_data = self._load_json_data(actual)
        expected_data = self._load_json_data(expected)
        
        # Clean ignored fields
        actual_cleaned = self._remove_ignored_fields(actual_data)
        expected_cleaned = self._remove_ignored_fields(expected_data)
        
        # Compare
        if not self._deep_equal(actual_cleaned, expected_cleaned):
            diff = self._generate_diff(actual_cleaned, expected_cleaned)
            error_msg = message or "JSON structures are not equal"
            raise JSONAssertionError(f"{error_msg}\n\nDifferences:\n{diff}")
    
    def assert_json_contains(
        self,
        container: Union[Dict, List, str, Path],
        expected_subset: Union[Dict, List, str, Path],
        message: Optional[str] = None
    ) -> None:
        """Assert that container JSON contains the expected subset."""
        container_data = self._load_json_data(container)
        subset_data = self._load_json_data(expected_subset)
        
        if not self._contains_subset(container_data, subset_data):
            error_msg = message or "JSON does not contain expected subset"
            raise JSONAssertionError(error_msg)
    
    def assert_json_schema(
        self,
        data: Union[Dict, List, str, Path],
        schema: Dict[str, Any],
        message: Optional[str] = None
    ) -> None:
        """Assert that JSON data matches the given schema structure."""
        json_data = self._load_json_data(data)
        
        if not self._validate_schema(json_data, schema):
            error_msg = message or "JSON does not match expected schema"
            raise JSONAssertionError(error_msg)
    
    def assert_json_has_fields(
        self,
        data: Union[Dict, str, Path],
        required_fields: List[str],
        message: Optional[str] = None
    ) -> None:
        """Assert that JSON object has all required fields."""
        json_data = self._load_json_data(data)
        
        if not isinstance(json_data, dict):
            raise JSONAssertionError("Data is not a JSON object")
        
        missing_fields = []
        for field in required_fields:
            if "." in field:
                # Nested field check
                if not self._has_nested_field(json_data, field):
                    missing_fields.append(field)
            else:
                # Top-level field check
                if field not in json_data:
                    missing_fields.append(field)
        
        if missing_fields:
            error_msg = message or f"Missing required fields: {missing_fields}"
            raise JSONAssertionError(error_msg)
    
    def assert_json_values_in_range(
        self,
        data: Union[Dict, str, Path],
        field_ranges: Dict[str, Dict[str, Union[int, float]]],
        message: Optional[str] = None
    ) -> None:
        """Assert that numeric values in JSON are within specified ranges."""
        json_data = self._load_json_data(data)
        
        violations = []
        
        for field_path, range_spec in field_ranges.items():
            value = self._get_nested_value(json_data, field_path)
            
            if value is None:
                violations.append(f"Field {field_path} not found")
                continue
            
            if not isinstance(value, (int, float)):
                violations.append(f"Field {field_path} is not numeric: {type(value)}")
                continue
            
            min_val = range_spec.get("min")
            max_val = range_spec.get("max")
            
            if min_val is not None and value < min_val:
                violations.append(f"Field {field_path} ({value}) below minimum ({min_val})")
            
            if max_val is not None and value > max_val:
                violations.append(f"Field {field_path} ({value}) above maximum ({max_val})")
        
        if violations:
            error_msg = message or "Value range violations found"
            raise JSONAssertionError(f"{error_msg}\n" + "\n".join(violations))
    
    def _load_json_data(self, source: Union[Dict, List, str, Path]) -> Any:
        """Load JSON data from various sources."""
        if isinstance(source, (dict, list)):
            return source
        elif isinstance(source, str):
            if source.strip().startswith(("{", "[")):
                # JSON string
                return json.loads(source)
            else:
                # File path
                return json.loads(Path(source).read_text())
        elif isinstance(source, Path):
            return json.loads(source.read_text())
        else:
            raise ValueError(f"Unsupported JSON source type: {type(source)}")
    
    def _remove_ignored_fields(self, data: Any) -> Any:
        """Recursively remove ignored fields from data."""
        if isinstance(data, dict):
            cleaned = {}
            for key, value in data.items():
                if not self._should_ignore_field(key):
                    cleaned[key] = self._remove_ignored_fields(value)
            return cleaned
        elif isinstance(data, list):
            return [self._remove_ignored_fields(item) for item in data]
        else:
            return data
    
    def _should_ignore_field(self, field: str, parent_path: str = "") -> bool:
        """Check if a field should be ignored based on patterns."""
        if field in self.ignore_fields:
            return True
        
        full_path = f"{parent_path}.{field}" if parent_path else field
        
        for pattern in self.ignore_field_patterns:
            if self._matches_pattern(full_path, pattern):
                return True
        
        return False
    
    def _matches_pattern(self, text: str, pattern: str) -> bool:
        """Simple pattern matching with wildcards."""
        import fnmatch
        return fnmatch.fnmatch(text, pattern)
    
    def _deep_equal(self, data1: Any, data2: Any) -> bool:
        """Deep equality comparison with tolerance."""
        if type(data1) != type(data2):
            return False
        
        if isinstance(data1, dict):
            if set(data1.keys()) != set(data2.keys()):
                return False
            return all(
                self._deep_equal(data1[key], data2[key])
                for key in data1.keys()
            )
        elif isinstance(data1, list):
            if len(data1) != len(data2):
                return False
            return all(
                self._deep_equal(data1[i], data2[i])
                for i in range(len(data1))
            )
        elif isinstance(data1, float) and isinstance(data2, float):
            return self._floats_equal(data1, data2)
        else:
            return data1 == data2
    
    def _floats_equal(self, f1: float, f2: float) -> bool:
        """Compare floats with tolerance."""
        if math.isnan(f1) and math.isnan(f2):
            return True
        
        if math.isinf(f1) and math.isinf(f2):
            return f1 == f2  # Both +inf or both -inf
        
        precision = self.tolerance.get("float_precision", 6)
        abs_tolerance = 10 ** -precision
        
        # Absolute tolerance for small numbers
        if abs(f1) < 1.0 and abs(f2) < 1.0:
            return abs(f1 - f2) < abs_tolerance
        
        # Relative tolerance for larger numbers
        rel_tolerance = self.tolerance.get("percentage_tolerance", 0.001)
        max_val = max(abs(f1), abs(f2))
        return abs(f1 - f2) < (max_val * rel_tolerance)
    
    def _contains_subset(self, container: Any, subset: Any) -> bool:
        """Check if container contains all elements from subset."""
        if type(container) != type(subset):
            return False
        
        if isinstance(subset, dict):
            for key, value in subset.items():
                if key not in container:
                    return False
                if not self._contains_subset(container[key], value):
                    return False
            return True
        elif isinstance(subset, list):
            # For lists, check if all subset items exist in container
            for item in subset:
                if not any(self._deep_equal(item, container_item) for container_item in container):
                    return False
            return True
        else:
            return self._deep_equal(container, subset)
    
    def _validate_schema(self, data: Any, schema: Dict[str, Any]) -> bool:
        """Validate data against a simple JSON schema."""
        schema_type = schema.get("type")
        
        if schema_type == "object" and isinstance(data, dict):
            properties = schema.get("properties", {})
            required = schema.get("required", [])
            
            # Check required fields
            for field in required:
                if field not in data:
                    return False
            
            # Validate properties
            for field, value in data.items():
                if field in properties:
                    if not self._validate_schema(value, properties[field]):
                        return False
            
            return True
        
        elif schema_type == "array" and isinstance(data, list):
            items_schema = schema.get("items", {})
            return all(self._validate_schema(item, items_schema) for item in data)
        
        elif schema_type == "string" and isinstance(data, str):
            return True
        
        elif schema_type == "number" and isinstance(data, (int, float)):
            return True
        
        elif schema_type == "integer" and isinstance(data, int):
            return True
        
        elif schema_type == "boolean" and isinstance(data, bool):
            return True
        
        elif schema_type == "null" and data is None:
            return True
        
        return False
    
    def _has_nested_field(self, data: Dict, field_path: str) -> bool:
        """Check if nested field exists using dot notation."""
        parts = field_path.split(".")
        current = data
        
        for part in parts:
            if not isinstance(current, dict) or part not in current:
                return False
            current = current[part]
        
        return True
    
    def _get_nested_value(self, data: Dict, field_path: str) -> Any:
        """Get nested field value using dot notation."""
        parts = field_path.split(".")
        current = data
        
        try:
            for part in parts:
                if isinstance(current, dict):
                    current = current[part]
                else:
                    return None
            return current
        except (KeyError, TypeError):
            return None
    
    def _generate_diff(self, data1: Any, data2: Any) -> str:
        """Generate a human-readable diff between two JSON structures."""
        try:
            import difflib
            
            json1_str = json.dumps(data1, indent=2, sort_keys=True)
            json2_str = json.dumps(data2, indent=2, sort_keys=True)
            
            diff_lines = list(difflib.unified_diff(
                json1_str.splitlines(),
                json2_str.splitlines(),
                fromfile="actual",
                tofile="expected",
                lineterm=""
            ))
            
            return "\n".join(diff_lines[:50])  # Limit diff size
        except Exception:
            return "Unable to generate diff"


# Convenience functions for direct use
def assert_json_equal(actual: Any, expected: Any, message: Optional[str] = None, **kwargs) -> None:
    """Assert that two JSON structures are equal."""
    asserter = JSONAsserter()
    if "ignore_fields" in kwargs:
        asserter.set_ignore_fields(kwargs["ignore_fields"])
    asserter.assert_json_equal(actual, expected, message)


def assert_json_contains(container: Any, subset: Any, message: Optional[str] = None) -> None:
    """Assert that container JSON contains expected subset."""
    asserter = JSONAsserter()
    asserter.assert_json_contains(container, subset, message)


def assert_json_has_fields(data: Any, required_fields: List[str], message: Optional[str] = None) -> None:
    """Assert that JSON has required fields."""
    asserter = JSONAsserter()
    asserter.assert_json_has_fields(data, required_fields, message)


def assert_json_schema(data: Any, schema: Dict[str, Any], message: Optional[str] = None) -> None:
    """Assert that JSON matches schema."""
    asserter = JSONAsserter()
    asserter.assert_json_schema(data, schema, message)


# Example usage and test functions
def test_json_assertions():
    """Example test demonstrating JSON assertion usage."""
    
    # Test data
    actual_data = {
        "status": "success",
        "timestamp": 1234567890,
        "results": {
            "count": 42,
            "average": 3.14159,
            "items": ["a", "b", "c"]
        }
    }
    
    expected_data = {
        "status": "success",
        "results": {
            "count": 42,
            "average": 3.14159,
            "items": ["a", "b", "c"]
        }
    }
    
    # Test with ignored timestamp field
    assert_json_equal(
        actual_data, 
        expected_data, 
        ignore_fields=["timestamp"]
    )
    
    # Test field existence
    assert_json_has_fields(
        actual_data,
        ["status", "results.count", "results.items"]
    )
    
    # Test schema validation
    schema = {
        "type": "object",
        "required": ["status", "results"],
        "properties": {
            "status": {"type": "string"},
            "results": {
                "type": "object",
                "required": ["count"],
                "properties": {
                    "count": {"type": "number"}
                }
            }
        }
    }
    
    assert_json_schema(actual_data, schema)
    
    print("All JSON assertions passed!")


if __name__ == "__main__":
    test_json_assertions()