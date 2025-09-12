#!/bin/bash

# Post-create setup script for Codespaces
set -e

echo "Setting up math-sdk development environment..."

# Install Python dependencies
pip install --upgrade pip
pip install -e .

# Install Rust dependencies (if needed)
if command -v rustc &> /dev/null; then
    echo "Rust is already installed"
else
    echo "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
fi

# Ensure proper permissions
chmod +x scripts/*.py 2>/dev/null || true

echo "Development environment setup complete!"
echo "You can now use 'pocketmon-pipeline --help' to see available commands."