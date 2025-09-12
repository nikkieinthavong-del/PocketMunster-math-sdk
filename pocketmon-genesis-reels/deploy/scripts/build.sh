#!/bin/bash

# PocketMon Genesis Reels Build Script
set -e

echo "Starting build process..."

# Build Math Engine
echo "Building Math Engine..."
cd math-engine
python3 setup.py build

# Build Web SDK
echo "Building Web SDK..."
cd ../web-sdk
npm install
npm run build

echo "Build process completed successfully!"