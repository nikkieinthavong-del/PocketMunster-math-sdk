# PocketMon Genesis Reels

## Overview
PocketMon Genesis Reels is an engaging slot game inspired by the beloved PocketMon universe. This project combines advanced mathematical modeling, a robust simulation engine, and a visually appealing frontend to create an immersive gaming experience.

## Project Structure
The project is organized into several key directories:

- **math-engine/**: Contains the core logic for the game's mechanics, including configuration, simulation, and optimization.
- **web-sdk/**: Houses the frontend implementation using React, including components, game logic, and asset management.
- **assets/**: Stores all game assets, including sprites, audio files, shaders, and animations.
- **deploy/**: Contains scripts and configurations for deploying the application, including Docker setup.
- **docs/**: Provides documentation for technical specifications, design, API, and deployment guides.
- **scripts/**: Includes utility scripts for validation, asset generation, and performance testing.
- **tests/**: Contains unit and integration tests for both the math engine and web SDK.

## Getting Started

### Prerequisites
- Python 3.10 or higher
- Node.js 18.x or higher
- npm (Node Package Manager)
- Redis (for caching)
- ImageMagick (for image processing)
- FFmpeg (for audio processing)

### Installation
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/pocketmon-genesis-reels.git
   cd pocketmon-genesis-reels
   ```

2. Set up the Python environment and install dependencies:
   ```
   cd math-engine
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. Install Node.js dependencies:
   ```
   cd ../web-sdk
   npm install
   ```

### Running the Application
1. Start the backend simulation engine:
   ```
   cd math-engine
   python -m src.simulation.run_simulations
   ```

2. Start the frontend application:
   ```
   cd ../web-sdk
   npm start
   ```

### Building for Production
To build the web SDK for production, run:
```
npm run build
```

### Deployment
Refer to the `deploy` directory for Docker configurations and deployment scripts.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any suggestions or improvements.

## License
This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments
- Inspired by the PocketMon franchise.
- Special thanks to the open-source community for their invaluable tools and libraries.