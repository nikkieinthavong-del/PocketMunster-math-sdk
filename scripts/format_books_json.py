#!/usr/bin/env python3
"""
Script to format books files after simulation runs
This script will format simple name objects to single lines while keeping complex objects pretty-printed
"""

import json
import re
import sys
import os
from pathlib import Path

def is_valid_jsonl(content):
    """Check if content is valid JSONL format"""
    lines = content.strip().split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            continue
        try:
            json.loads(line)
        except json.JSONDecodeError:
            return False
    return True

def reconstruct_jsonl(content):
    """Attempt to reconstruct valid JSONL from corrupted content"""
    # Try to find complete JSON objects by looking for balanced braces
    json_objects = []
    current_object = ""
    brace_count = 0
    in_string = False
    escape_next = False
    
    for char in content:
        if escape_next:
            escape_next = False
            current_object += char
            continue
            
        if char == '\\':
            escape_next = True
            current_object += char
            continue
            
        if char == '"' and not escape_next:
            in_string = not in_string
            
        if not in_string:
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                
        current_object += char
        
        # If we have a complete object (brace_count == 0 and we've seen at least one {)
        if brace_count == 0 and current_object.strip() and '{' in current_object:
            try:
                # Try to parse as JSON
                parsed = json.loads(current_object.strip())
                json_objects.append(json.dumps(parsed, separators=(',', ':')))
                current_object = ""
            except json.JSONDecodeError:
                # If parsing fails, continue building the object
                pass
    
    return '\n'.join(json_objects)

def format_json_with_compact_names(data):
    """Format JSON with compact simple name objects"""
    # Convert to pretty-printed JSON
    pretty_json = json.dumps(data, indent=2)
    
    # Use regex to find and compact simple name objects
    # Pattern: "name": "value" (with potential whitespace)
    compact_pattern = r'{\s*"name":\s*"([^"]+)"\s*}'
    pretty_json = re.sub(compact_pattern, r'{"name": "\1"}', pretty_json)
    
    # Also handle nested cases where simple objects are in arrays
    # Pattern for multi-line simple objects
    multiline_pattern = r'{\s*\n\s*"name":\s*"([^"]+)"\s*\n\s*}'
    pretty_json = re.sub(multiline_pattern, r'{"name": "\1"}', pretty_json, flags=re.MULTILINE)
    
    return pretty_json

def process_jsonl_file(file_path):
    """Process a single JSONL file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Try to reconstruct valid JSONL if the file is corrupted
        if not is_valid_jsonl(content):
            print(f"  ⚠️  File appears corrupted, attempting to reconstruct JSONL format...")
            content = reconstruct_jsonl(content)
        
        lines = content.strip().split('\n')
        formatted_lines = []
        
        for line_num, line in enumerate(lines, 1):
            line = line.strip()
            if not line:
                continue  # Skip empty lines in JSONL
                
            try:
                # Parse JSON
                data = json.loads(line)
                # Format with compact names
                formatted = format_json_with_compact_names(data)
                formatted_lines.append(formatted)
            except json.JSONDecodeError as e:
                print(f"  ⚠️  Warning: Invalid JSON on line {line_num}: {e}")
                print(f"       Line content: {line[:100]}...")
                # Skip invalid lines instead of keeping them
                continue
        
        # Write back to file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(formatted_lines))
            if formatted_lines and formatted_lines[-1]:  # Add final newline if content exists
                f.write('\n')
        
        return len(lines)
    
    except Exception as e:
        print(f"  ❌ Error processing {file_path}: {e}")
        return 0

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 format_books_json.py <game_directory>")
        print("Example: python3 format_books_json.py games/0_0_tower_defense")
        sys.exit(1)
    
    game_dir = Path(sys.argv[1])
    
    if not game_dir.exists():
        print(f"Error: Game directory '{game_dir}' does not exist")
        sys.exit(1)
    
    # Find all .jsonl files in the game directory
    jsonl_files = list(game_dir.glob("**/*.jsonl"))
    
    if not jsonl_files:
        print(f"No .jsonl files found in {game_dir}")
        sys.exit(0)
    
    print("Formatting books files...")
    
    total_lines = 0
    for file_path in jsonl_files:
        print(f"  Formatting: {file_path}")
        lines_processed = process_jsonl_file(file_path)
        if lines_processed > 0:
            print(f"  ✅ Formatted: {file_path} ({lines_processed} lines processed)")
            total_lines += lines_processed
    
    print(f"Books formatting complete! ({total_lines} total lines processed)")

if __name__ == "__main__":
    main()
