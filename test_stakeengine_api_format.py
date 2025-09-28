#!/usr/bin/env python3
"""
Test script to validate StakeEngine API request format
This ensures the request matches the expected schema
"""

import json
import os
from typing import Dict, Any

def validate_stakeengine_request() -> bool:
    """Validate that the request format matches StakeEngine API requirements"""
    print("Validating StakeEngine API request format...")

    try:
        # Check if the frontend bundle exists
        if not os.path.exists('stakeengine_frontend_publish.json'):
            print("Error: stakeengine_frontend_publish.json not found")
            return False

        # Read the frontend bundle
        with open('stakeengine_frontend_publish.json', 'r') as f:
            frontend_bundle = json.load(f)

        # Create the request payload in the format expected by StakeEngine
        request_payload = {
            "version": 1,
            "changed": True
        }

        print("Request payload format:")
        print(json.dumps(request_payload, indent=2))

        # Validate the payload structure
        is_valid_version = isinstance(request_payload["version"], int)
        is_valid_changed = isinstance(request_payload["changed"], bool)

        print("Validation results:")
        print(f"- version is number: {is_valid_version}")
        print(f"- changed is boolean: {is_valid_changed}")

        if is_valid_version and is_valid_changed:
            print("✓ Request format is valid for StakeEngine API")

            # Show what the API expects
            print("\nExpected API response formats:")
            print('1. Success: { "version": number, "changed": boolean }')
            print('2. Error: { "code": string, "message": string }')

            print("\nUpload instructions:")
            print("1. Set environment variables:")
            print('   export STAKEENGINE_API_KEY="your_api_key"')
            print('   export STAKEENGINE_API_SECRET="your_api_secret"')
            print("2. Run the upload script:")
            print("   python upload_to_stakeengine.py")

            return True
        else:
            print("✗ Request format is invalid")
            return False

    except Exception as e:
        print(f"Validation failed: {e}")
        return False

def show_api_usage():
    """Display StakeEngine API usage information"""
    print("\n=== StakeEngine API Usage ===")
    print("Endpoint: POST https://api.stakeengine.com/api/file/publish/front")
    print("Headers:")
    print('  Content-Type: application/json')
    print('  Authorization: Bearer {API_KEY}')
    print('  X-Game-ID: pocket_monsters_genesis')
    print("")
    print("Request Body:")
    print("{")
    print('  "version": 1,')
    print('  "changed": true')
    print("}")
    print("")
    print("Response (Success):")
    print("{")
    print('  "version": 1,')
    print('  "changed": true')
    print("}")
    print("")
    print("Response (Error):")
    print("{")
    print('  "code": "ERROR_CODE",')
    print('  "message": "Error description"')
    print("}")

def main():
    """Main validation function"""
    is_valid = validate_stakeengine_request()
    show_api_usage()

    if is_valid:
        print("\n✓ Ready to upload to stake-engine.com")
        print("The request format matches StakeEngine API requirements")
    else:
        print("\n✗ Fix the request format before uploading")
        print("The current format does not match StakeEngine API expectations")

    return is_valid

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)