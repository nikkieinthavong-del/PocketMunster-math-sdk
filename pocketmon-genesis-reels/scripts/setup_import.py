#!/usr/bin/env python3
"""
Simple PocketMon Asset Import Helper
This script helps you import PocketMon sprites when manually copying from Windows.
"""

import os
import sys

def create_import_directory():
    """Create a directory for manual asset import"""
    import_dir = "/workspaces/math-sdk/pocketmon-genesis-reels/manual_import"
    os.makedirs(import_dir, exist_ok=True)
    return import_dir

def main():
    print("PocketMon Asset Import Helper")
    print("=" * 40)
    
    import_dir = create_import_directory()
    
    print(f"\n📁 Created import directory: {import_dir}")
    print("\n🔧 Steps to import your PocketMon sprites:")
    print("\n1. Copy all PNG files from your Windows directory:")
    print("   C:\\Users\\kevin\\Desktop\\PocketMon\\sprites_out\\gen1\\*.png")
    print(f"\n2. Paste them into this directory: {import_dir}")
    print("\n3. Run the full import script:")
    print(f"   python3 /workspaces/math-sdk/pocketmon-genesis-reels/scripts/import_pocketmon_assets.py --source {import_dir}")
    
    # Check if any files already exist
    if os.path.exists(import_dir):
        png_files = [f for f in os.listdir(import_dir) if f.lower().endswith('.png')]
        if png_files:
            print(f"\n✅ Found {len(png_files)} PNG files already in import directory:")
            for i, file in enumerate(sorted(png_files)[:5], 1):
                print(f"   {i}. {file}")
            if len(png_files) > 5:
                print(f"   ... and {len(png_files) - 5} more files")
            
            print(f"\n🚀 Ready to run import! Execute:")
            print(f"   python3 /workspaces/math-sdk/pocketmon-genesis-reels/scripts/import_pocketmon_assets.py --source {import_dir}")
        else:
            print(f"\n📥 Directory is empty. Copy your PNG files to: {import_dir}")
    
    print(f"\n💡 You can also run this script anytime to get these instructions:")
    print(f"   python3 {os.path.abspath(__file__)}")

if __name__ == "__main__":
    main()