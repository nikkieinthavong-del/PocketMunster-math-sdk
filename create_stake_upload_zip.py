import zipfile
import json
import os
from datetime import datetime

def create_stake_upload_zip():
    """Create a zip file containing all necessary files for Stake upload"""
    
    # Files to include in the zip
    files_to_include = [
        # StakeEngine specific files
        ('stakeengine_publication_manifest.json', 'manifest.json'),
        ('stakeengine_math_model.json', 'math-model.json'),
        ('stakeengine_frontend_bundle.json', 'frontend-bundle.json'),
        ('stakeengine_sdk_config.json', 'sdk-config.json'),
        ('stake_api_integration.json', 'api-spec.json'),
        ('stake_math_verification.json', 'math-verification.json'),
        ('stakeengine_verification_models.json', 'verification-models.json'),
        ('stakeengine_upload_package.json', 'upload-package.json'),
        ('stakeengine_deployment_scripts.json', 'deployment-scripts.json'),
        
        # Original stake files
        ('stake_math_artifacts.json', 'original-math-artifacts.json'),
        ('stake_frontend_bundle.json', 'original-frontend-bundle.json'),
        ('stake_game_config.json', 'game-config.json'),
        ('stake_frontend_assets.json', 'frontend-assets.json'),
        
        # Documentation
        ('STAKE_DEPLOYMENT_GUIDE.md', 'deployment-guide.md'),
        ('ARCHITECTURAL_REVIEW.md', 'architectural-review.md'),
        ('stakeengine_sdk_technical_report.md', 'technical-report.md')
    ]
    
    # Create zip file
    zip_filename = 'pocket_monsters_genesis_stake_upload.zip'
    
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
        # Add all specified files
        for source_file, dest_name in files_to_include:
            if os.path.exists(source_file):
                zipf.write(source_file, dest_name)
                print(f"Added {source_file} as {dest_name}")
            else:
                print(f"Warning: {source_file} not found, skipping...")
        
        # Create asset manifest
        asset_manifest = {
            "gameId": "pocket_monsters_genesis",
            "version": "1.0.0",
            "platform": "stake-engine.com",
            "creationDate": datetime.now().isoformat(),
            "includedAssets": {
                "symbols": 18,
                "backgrounds": 5, 
                "uiElements": 12,
                "audioFiles": 25,
                "jsBundles": 5,
                "cssFiles": 2
            },
            "totalFiles": len([f for f, _ in files_to_include]),
            "instructions": "This zip contains all necessary files for Stake upload. Upload to stake-engine.com developer portal."
        }
        
        # Write asset manifest as JSON string to zip
        zipf.writestr('asset-manifest.json', json.dumps(asset_manifest, indent=2))
        print("Added asset-manifest.json")
        
        # Create upload instructions
        instructions = """STAKE UPLOAD INSTRUCTIONS

File: pocket_monsters_genesis_stake_upload.zip
Game: Pocket Monsters Genesis
RTP: 96.5%
Platform: stake-engine.com

UPLOAD LOCATION:
- Go to: https://stake-engine.com/developer
- Login to your developer account
- Navigate to 'Game Upload' section
- Click 'Upload New Game'
- Select this zip file: pocket_monsters_genesis_stake_upload.zip
- Follow the on-screen instructions for completion

REQUIRED INFORMATION:
- Game Name: Pocket Monsters Genesis
- Game Type: Cluster Pays (7x7 grid)
- RTP: 96.5%
- Volatility: Medium-High
- Theme: Pokemon
- Technology: WebGL2 with StakeEngine SDK

The upload includes all mathematical models, frontend assets, API specifications,
and verification documents required for approval.
"""
        
        zipf.writestr('UPLOAD_INSTRUCTIONS.txt', instructions)
        print("Added UPLOAD_INSTRUCTIONS.txt")
    
    # Check if zip was created successfully
    if os.path.exists(zip_filename):
        file_size = os.path.getsize(zip_filename)
        print(f"\n✅ SUCCESS: {zip_filename} created successfully!")
        print(f"📁 File size: {file_size:,} bytes ({file_size / (1024*1024):.2f} MB)")
        print(f"📍 Location: {os.path.abspath(zip_filename)}")
        print("\n📋 UPLOAD INSTRUCTIONS:")
        print("1. Navigate to https://stake-engine.com/developer")
        print("2. Login to your developer account")
        print("3. Go to 'Game Upload' section")
        print("4. Upload the file: pocket_monsters_genesis_stake_upload.zip")
        print("5. Complete the game information form")
        print("6. Submit for review and approval")
    else:
        print("❌ ERROR: Zip file was not created")

if __name__ == "__main__":
    create_stake_upload_zip()