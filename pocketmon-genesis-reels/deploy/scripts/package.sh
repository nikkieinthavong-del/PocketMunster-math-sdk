#!/bin/bash

# PocketMon Genesis Reels Deployment Script
set -e

echo "Starting deployment process..."

# Build Math Engine
echo "Building Math Engine..."
cd math-engine
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python setup.py build_ext --inplace

# Run simulations to generate game data
echo "Running Monte Carlo simulations..."
python -m src.simulation.run_simulations \
    --simulations 1000000 \
    --output-dir ../data/simulations \
    --par-sheet

# Build Web SDK
echo "Building Web SDK..."
cd ../web-sdk
npm ci
npm run build

# Package for deployment
echo "Packaging for deployment..."
mkdir -p ../dist
cp -r build/ ../dist/web-sdk
cp -r ../data/simulations/ ../dist/data
cp -r ../assets/ ../dist/assets

# Create Docker image
echo "Creating Docker image..."
docker build -t pocketmon-genesis-reels:latest .

echo "Deployment package created successfully!"