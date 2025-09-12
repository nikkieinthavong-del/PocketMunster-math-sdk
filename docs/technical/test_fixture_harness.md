# Test Fixture Harness Guide

This document describes the test fixture harness system used for golden test validation and pipeline testing.

## Overview

The test fixture harness provides:

- **Deterministic Test Data**: Reproducible test assets for consistent testing
- **Golden Test Framework**: Baseline comparison system for regression detection
- **Fixture Generation**: Automated creation of test assets and scenarios
- **Assertion Helpers**: Advanced JSON comparison and validation utilities

## Architecture

### Components

```
tests/
├── fixtures/
│   ├── generate_fixture_assets.py    # Fixture generation
│   ├── performance_test_data.json    # Generated test data
│   ├── policy_test_data.json         # Policy compliance test data
│   └── ...                          # Other generated fixtures
├── helpers/
│   ├── assert_json.py               # JSON assertion utilities
│   └── ...                         # Other test helpers
├── golden/
│   ├── golden_map.json             # Test configuration
│   ├── *_golden.json               # Golden baseline files
│   └── ...                         # Golden test artifacts
└── config/
    └── test_policy.json            # Lightweight test policy
```

## Golden Test Framework

### Golden Map Configuration

The golden map (`tests/golden/golden_map.json`) defines all test configurations:

```json
{
  "version": "1.0",
  "config": {
    "tolerance": {
      "json_float_precision": 6,
      "timestamp_tolerance_seconds": 5,
      "size_tolerance_percent": 1.0
    },
    "ignore_fields": [
      "timestamp", "created_at", "processing_time"
    ]
  },
  "tests": {
    "performance_profile": {
      "description": "Performance profiling validation",
      "pipeline_command": "python scripts/assets_pipeline_all.py --policy tests/config/test_policy.json",
      "output_file": "test_output/performance_profile.json",
      "golden_file": "tests/golden/performance_profile_golden.json",
      "comparison_type": "json",
      "enabled": true
    }
  }
}
```

### Test Execution

Run golden tests:

```bash
# Run all tests
python scripts/run_golden_tests.py --verbose

# Run specific test pattern
python scripts/run_golden_tests.py --pattern "performance_*"

# Generate test results
python scripts/run_golden_tests.py --output test_results.json
```

### Updating Golden Files

When code changes require new baselines:

```bash
# Preview what would be updated
python scripts/update_golden.py --preview

# Interactive update with approval prompts
python scripts/update_golden.py

# Approve all updates (use with caution)
python scripts/update_golden.py --approve --non-interactive

# Validate updates by re-running tests
python scripts/update_golden.py --validate
```

## Fixture Generation

### Automated Generation

Generate all test fixtures:

```bash
python tests/fixtures/generate_fixture_assets.py --verbose
```

Generate specific fixture type:

```bash
python tests/fixtures/generate_fixture_assets.py \
  --generator generate_test_performance_data \
  --verbose
```

### Custom Fixtures

The fixture generator provides several built-in generators:

#### Performance Test Data

Creates mock performance scenarios:

```python
def generate_test_performance_data(self) -> Dict[str, Any]:
    return {
        "mock_assets": [
            {"name": "config.json", "size": 1024, "type": "config"},
            {"name": "data.csv", "size": 5120, "type": "data"}
        ],
        "expected_processing_time": 1.5,
        "expected_memory_usage": 64
    }
```

#### Policy Test Data

Creates files with various compliance scenarios:

```python
# Creates test files including:
# - valid_config.json (compliant)
# - invalid.json (JSON syntax error)
# - large_file.txt (size violation)
# - small_file.txt (size violation)
```

#### Embedding Test Data

Creates files for duplicate detection testing:

```python
# Creates intentional duplicates:
# - file1.json & file2.json (identical content)
# - file4.txt & file5.txt (high similarity)
# - unique_file.py (no duplicates)
```

### Custom Generator Development

Create custom fixture generators by extending the `FixtureGenerator` class:

```python
class FixtureGenerator:
    def generate_custom_test_data(self) -> Dict[str, Any]:
        """Generate custom test scenario."""
        
        # Create test files
        test_files = {
            "custom_config.json": {"custom": "data"},
            "custom_data.txt": "custom content"
        }
        
        # Write files to fixtures directory
        for filename, content in test_files.items():
            file_path = self.fixtures_dir / filename
            # ... write content
        
        # Return metadata
        return {
            "test_config": {
                "test_name": "custom_test",
                "generated_at": time.strftime("%Y-%m-%d %H:%M:%S")
            },
            "test_files": list(test_files.keys()),
            "expected_results": {
                # Define expected outcomes
            }
        }
```

## JSON Assertion Utilities

### Advanced JSON Comparison

The `assert_json.py` helper provides sophisticated JSON comparison:

```python
from tests.helpers.assert_json import JSONAsserter

# Create asserter with tolerance settings
asserter = JSONAsserter(tolerance={
    "float_precision": 6,
    "percentage_tolerance": 0.001
})

# Configure fields to ignore
asserter.set_ignore_fields([
    "timestamp", "created_at", "processing_time"
])

# Perform assertions
asserter.assert_json_equal(actual_data, expected_data)
asserter.assert_json_contains(container, expected_subset)
asserter.assert_json_has_fields(data, ["required", "fields"])
```

### Tolerance Configuration

Control comparison sensitivity:

```python
tolerance = {
    "float_precision": 6,           # Decimal places for float comparison
    "percentage_tolerance": 0.001,   # 0.1% relative tolerance
    "timestamp_tolerance": 5.0       # 5 seconds for timestamp comparison
}
```

### Field Ignoring

Ignore volatile fields during comparison:

```python
# Simple field names
ignore_fields = ["timestamp", "processing_time"]

# Nested field paths
ignore_fields = ["metadata.timestamp", "results.*.processing_time"]

# Pattern matching
ignore_fields = ["*.timestamp", "system_metrics.*"]
```

### Schema Validation

Validate JSON structure:

```python
schema = {
    "type": "object",
    "required": ["status", "results"],
    "properties": {
        "status": {"type": "string"},
        "results": {
            "type": "object",
            "properties": {
                "count": {"type": "number"}
            }
        }
    }
}

asserter.assert_json_schema(data, schema)
```

### Value Range Validation

Check numeric values are within expected ranges:

```python
range_specs = {
    "performance.processing_time": {"min": 0, "max": 300},
    "memory.usage_mb": {"min": 0, "max": 2048},
    "results.count": {"min": 1}
}

asserter.assert_json_values_in_range(data, range_specs)
```

## Test Configuration

### Test Policy

The test policy (`tests/config/test_policy.json`) provides lightweight settings for testing:

```json
{
  "version": "1.0.0-test",
  "quality_thresholds": {
    "min_file_size": 10,
    "max_file_size": 1048576,
    "max_line_length": 120
  },
  "performance_benchmarks": {
    "max_processing_time_seconds": 30,
    "max_memory_usage_mb": 512
  },
  "policy_guard": {
    "enforcement_level": "permissive",
    "audit_logging": false
  }
}
```

### Environment-Specific Configuration

Configure different test environments:

```json
{
  "environments": {
    "ci": {
      "timeout_multiplier": 2.0,
      "parallel_execution": true,
      "max_parallel_tests": 3,
      "retry_failed_tests": 1
    },
    "dev": {
      "timeout_multiplier": 1.0,
      "parallel_execution": false,
      "retry_failed_tests": 0
    }
  }
}
```

## Best Practices

### Test Design

1. **Deterministic**: Use fixed seeds and controlled inputs
2. **Isolated**: Each test should be independent
3. **Meaningful**: Test realistic scenarios and edge cases
4. **Maintainable**: Keep tests simple and well-documented
5. **Fast**: Optimize test execution time

### Fixture Management

1. **Version Control**: Keep fixtures in version control
2. **Cleanup**: Regularly clean up unused fixtures
3. **Documentation**: Document fixture purposes and contents
4. **Validation**: Validate fixture integrity
5. **Minimalism**: Keep fixtures as small as possible while being representative

### Golden File Management

1. **Review Changes**: Always review golden file updates
2. **Approval Process**: Use proper approval workflows
3. **Backup**: Keep backups of previous golden files
4. **Documentation**: Document reasons for golden file changes
5. **Validation**: Validate golden updates don't break other tests

### Assertion Strategy

1. **Appropriate Tolerance**: Set reasonable comparison tolerances
2. **Field Filtering**: Ignore truly volatile fields
3. **Clear Messages**: Provide meaningful assertion failure messages
4. **Granular Checks**: Break complex assertions into smaller parts
5. **Error Context**: Include context in assertion errors

## Troubleshooting

### Common Issues

#### Golden Test Failures

```bash
# Check what changed
python scripts/update_golden.py --preview

# See detailed diff
python scripts/run_golden_tests.py --verbose

# Update if changes are expected
python scripts/update_golden.py --approve
```

#### Fixture Generation Issues

```bash
# Clean and regenerate fixtures
python tests/fixtures/generate_fixture_assets.py --clean --verbose

# Generate specific fixture
python tests/fixtures/generate_fixture_assets.py --generator generate_test_performance_data
```

#### Comparison Issues

```python
# Enable detailed comparison logging
asserter = JSONAsserter()
asserter.set_ignore_fields(["timestamp", "processing_time"])

try:
    asserter.assert_json_equal(actual, expected)
except JSONAssertionError as e:
    print(f"Comparison failed: {e}")
    # e includes detailed diff information
```

### Debug Techniques

1. **Verbose Output**: Use `--verbose` on all test scripts
2. **Incremental Testing**: Test individual components
3. **Diff Analysis**: Review generated diffs carefully
4. **Fixture Validation**: Verify fixture integrity
5. **Configuration Check**: Validate test configuration files

### Performance Optimization

1. **Parallel Execution**: Run tests in parallel when possible
2. **Fixture Caching**: Cache expensive fixture generation
3. **Selective Testing**: Use test patterns to run subsets
4. **Resource Limits**: Set appropriate timeout and memory limits
5. **CI Optimization**: Optimize CI pipeline execution time

## Integration

### CI/CD Integration

The test harness integrates with GitHub Actions:

```yaml
- name: Run Golden Tests
  run: |
    python scripts/run_golden_tests.py \
      --output golden_test_results.json \
      --verbose

- name: Update Golden Files (if authorized)
  if: github.event.inputs.update_golden == 'true'
  run: |
    python scripts/update_golden.py \
      --approve --non-interactive --validate
```

### IDE Integration

For development workflow:

1. **VS Code**: Use Python test discovery for individual test execution
2. **PyCharm**: Configure test runners for golden tests
3. **Command Line**: Use scripts directly for debugging

### Monitoring Integration

Track test metrics:

- **Test Execution Time**: Monitor golden test performance
- **Failure Rates**: Track test stability over time
- **Coverage**: Ensure adequate test coverage
- **Golden File Changes**: Monitor baseline update frequency

This test harness provides a robust foundation for validating pipeline behavior and ensuring regression-free development.