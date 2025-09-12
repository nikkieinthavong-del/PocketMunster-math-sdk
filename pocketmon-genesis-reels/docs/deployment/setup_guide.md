# PocketMon Genesis Reels Setup Guide

## Introduction

This setup guide provides step-by-step instructions for deploying the PocketMon Genesis Reels application. It covers the necessary environment setup, installation of dependencies, and running the application.

## System Requirements

- **Operating System**: Ubuntu 22.04 LTS (Recommended) or Windows 10/11 with WSL2
- **Minimum Hardware**:
  - CPU: 8-core processor (Intel i7 or AMD Ryzen 7)
  - RAM: 32GB DDR4
  - GPU: NVIDIA GTX 1660 Super or equivalent (for animation rendering)
  - Storage: 500GB NVMe SSD

## Environment Setup

1. **Update System Packages**:
   Open a terminal and run the following commands to update your system packages:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install Required Software**:
   Install Python 3.10, Node.js, and other necessary tools:
   ```bash
   sudo apt install python3.10 python3.10-venv python3.10-dev
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs redis-server imagemagick ffmpeg
   ```

3. **Install Python Dependencies**:
   Navigate to the `math-engine` directory and install the required Python packages:
   ```bash
   cd math-engine
   python3 -m pip install --upgrade pip
   python3 -m pip install -r requirements.txt
   ```

4. **Install Node.js Dependencies**:
   Navigate to the `web-sdk` directory and install the required Node.js packages:
   ```bash
   cd ../web-sdk
   npm install
   ```

## Running the Application

1. **Build the Application**:
   In the `deploy/scripts` directory, run the build script to compile the application:
   ```bash
   cd ../deploy/scripts
   ./build.sh
   ```

2. **Deploy the Application**:
   Use the deploy script to start the application:
   ```bash
   ./deploy.sh
   ```

3. **Access the Application**:
   Once the application is running, you can access it via your web browser at `http://localhost:3000`.

## Troubleshooting

If you encounter any issues during the setup or deployment process, refer to the troubleshooting guide located in `docs/deployment/troubleshooting.md`.

## Conclusion

Following this setup guide will help you successfully deploy the PocketMon Genesis Reels application. For further assistance, please refer to the documentation or reach out to the development team.