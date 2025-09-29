#!/bin/bash

# Package script for Stake Engine Pocketmon
# This script packages the game files and generates checksums for integrity verification

set -e

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PACKAGE_DIR="$PROJECT_ROOT/dist/package"
BUILD_DIR="$PROJECT_ROOT/dist"

# Ensure SHA256_CMD is set before any usage
if [ -z "${SHA256_CMD}" ]; then
  if command -v sha256sum &> /dev/null; then
    SHA256_CMD="sha256sum"
  elif command -v shasum &> /dev/null; then
    SHA256_CMD="shasum -a 256"
  else
    echo "No SHA256 command found!" >&2
    exit 1
  fi
fi

echo "Using SHA256 command: $SHA256_CMD"

# Function to create package directory
create_package_dir() {
    echo "Creating package directory..."
    rm -rf "$PACKAGE_DIR"
    mkdir -p "$PACKAGE_DIR"
}

# Function to copy files to package
copy_files() {
    echo "Copying files to package directory..."
    
    # Copy main source files
    if [ -d "$PROJECT_ROOT/src" ]; then
        cp -r "$PROJECT_ROOT/src" "$PACKAGE_DIR/"
    fi
    
    # Copy game files
    if [ -d "$PROJECT_ROOT/games" ]; then
        cp -r "$PROJECT_ROOT/games" "$PACKAGE_DIR/"
    fi
    
    # Copy configuration files
    for config_file in "package.json" "tsconfig.json" "config.json"; do
        if [ -f "$PROJECT_ROOT/$config_file" ]; then
            cp "$PROJECT_ROOT/$config_file" "$PACKAGE_DIR/"
        fi
    done
    
    # Copy documentation
    if [ -d "$PROJECT_ROOT/docs" ]; then
        cp -r "$PROJECT_ROOT/docs" "$PACKAGE_DIR/"
    fi
}

# Function to generate checksums
generate_checksums() {
    echo "Generating checksums..."
    local checksum_file="$PACKAGE_DIR/checksums.txt"
    
    # Change to package directory to generate relative paths
    cd "$PACKAGE_DIR"
    
    # Find all files and generate checksums
    find . -type f ! -name "checksums.txt" -print0 | while IFS= read -r -d '' file; do
        echo "Processing: $file"
        
        # Generate checksum for the file
        checksum_output=$($SHA256_CMD "$file")
        
        # Extract just the hash (different formats for sha256sum vs shasum)
        if [[ "$SHA256_CMD" =~ sha256sum ]]; then
            # sha256sum format: hash  filename
            hash=$(echo "$checksum_output" | cut -d' ' -f1)
        else
            # shasum format: hash  filename  
            hash=$(echo "$checksum_output" | cut -d' ' -f1)
        fi
        
        echo "$hash  $file" >> "$checksum_file"
    done
    
    echo "Checksums written to: $checksum_file"
    cd "$PROJECT_ROOT"
}

# Function to create archive
create_archive() {
    echo "Creating package archive..."
    local archive_name="stake-engine-pocketmon-$(date +%Y%m%d-%H%M%S).tar.gz"
    local archive_path="$BUILD_DIR/$archive_name"
    
    cd "$PACKAGE_DIR"
    tar -czf "$archive_path" .
    cd "$PROJECT_ROOT"
    
    echo "Package created: $archive_path"
    
    # Generate checksum for the archive itself
    echo "Generating archive checksum..."
    archive_checksum=$($SHA256_CMD "$archive_path")
    
    if [[ "$SHA256_CMD" =~ sha256sum ]]; then
        hash=$(echo "$archive_checksum" | cut -d' ' -f1)
    else
        hash=$(echo "$archive_checksum" | cut -d' ' -f1)
    fi
    
    echo "Archive checksum: $hash"
    echo "$hash  $archive_name" > "$BUILD_DIR/${archive_name}.sha256"
}

# Function to verify package integrity
verify_package() {
    echo "Verifying package integrity..."
    local checksum_file="$PACKAGE_DIR/checksums.txt"
    
    if [ ! -f "$checksum_file" ]; then
        echo "Error: Checksum file not found!" >&2
        return 1
    fi
    
    cd "$PACKAGE_DIR"
    
    # Verify each file's checksum
    while IFS= read -r line; do
        expected_hash=$(echo "$line" | cut -d' ' -f1)
        file_path=$(echo "$line" | cut -d' ' -f3-)
        
        if [ -f "$file_path" ]; then
            actual_checksum=$($SHA256_CMD "$file_path")
            
            if [[ "$SHA256_CMD" =~ sha256sum ]]; then
                actual_hash=$(echo "$actual_checksum" | cut -d' ' -f1)
            else
                actual_hash=$(echo "$actual_checksum" | cut -d' ' -f1)
            fi
            
            if [ "$expected_hash" = "$actual_hash" ]; then
                echo "✓ $file_path"
            else
                echo "✗ $file_path (checksum mismatch)" >&2
                cd "$PROJECT_ROOT"
                return 1
            fi
        else
            echo "✗ $file_path (file not found)" >&2
            cd "$PROJECT_ROOT"
            return 1
        fi
    done < "$checksum_file"
    
    cd "$PROJECT_ROOT"
    echo "Package integrity verification completed successfully!"
}

# Main execution
main() {
    echo "Starting Stake Engine Pocketmon packaging process..."
    
    # Ensure build directory exists
    mkdir -p "$BUILD_DIR"
    
    # Execute packaging steps
    create_package_dir
    copy_files
    generate_checksums
    verify_package
    create_archive
    
    echo "Packaging completed successfully!"
}

# Run main function
main "$@"