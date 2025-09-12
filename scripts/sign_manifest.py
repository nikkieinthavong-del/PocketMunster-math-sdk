#!/usr/bin/env python3
"""
Sign Manifest

Creates cryptographically signed manifests for pipeline artifacts
to ensure integrity and authenticity of generated assets.
"""

import argparse
import json
import os
import sys
import time
import hashlib
import hmac
from pathlib import Path
from typing import Dict, Any, List, Optional
import base64


class ManifestSigner:
    """Cryptographic signing for pipeline manifests."""
    
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        
        # Get signing secret from environment
        self.signing_secret = os.getenv("POCKETMON_SIGN_SECRET")
        if not self.signing_secret:
            self._log("Warning: POCKETMON_SIGN_SECRET not set, using default key", "WARNING")
            self.signing_secret = "default_dev_key_not_for_production"
        
        # Signing configuration
        self.algorithm = "HMAC-SHA256"
        self.version = "1.0"
    
    def _log(self, message: str, level: str = "INFO") -> None:
        """Log message with timestamp."""
        if self.verbose or level in ["ERROR", "WARNING"]:
            timestamp = time.strftime("%H:%M:%S")
            print(f"[{timestamp}] [{level}] {message}")
    
    def scan_directory(self, input_dir: Path) -> Dict[str, Any]:
        """Scan directory and create file inventory."""
        self._log(f"Scanning directory for signing: {input_dir}")
        
        if not input_dir.exists():
            raise FileNotFoundError(f"Input directory does not exist: {input_dir}")
        
        file_inventory = {}
        total_size = 0
        file_count = 0
        
        # Scan all files
        for file_path in input_dir.rglob("*"):
            if file_path.is_file() and file_path.name != "integrity_manifest.json":
                try:
                    stat = file_path.stat()
                    
                    # Calculate file checksum
                    checksum = self._calculate_file_checksum(file_path)
                    
                    # Store file info
                    relative_path = file_path.relative_to(input_dir)
                    file_inventory[str(relative_path)] = {
                        "absolute_path": str(file_path),
                        "size_bytes": stat.st_size,
                        "modified_time": stat.st_mtime,
                        "checksum_sha256": checksum,
                        "permissions": oct(stat.st_mode)[-3:]
                    }
                    
                    total_size += stat.st_size
                    file_count += 1
                    
                except Exception as e:
                    self._log(f"Error processing file {file_path}: {e}", "WARNING")
        
        self._log(f"Scanned {file_count} files, total size: {total_size / 1024 / 1024:.1f} MB")
        
        return {
            "files": file_inventory,
            "summary": {
                "file_count": file_count,
                "total_size_bytes": total_size,
                "scan_timestamp": time.time(),
                "scan_datetime": time.strftime("%Y-%m-%d %H:%M:%S")
            }
        }
    
    def _calculate_file_checksum(self, file_path: Path) -> str:
        """Calculate SHA256 checksum for a file."""
        hash_sha256 = hashlib.sha256()
        
        try:
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_sha256.update(chunk)
            return hash_sha256.hexdigest()
        except Exception as e:
            self._log(f"Error calculating checksum for {file_path}: {e}", "WARNING")
            return ""
    
    def create_manifest(self, file_inventory: Dict[str, Any], input_dir: Path) -> Dict[str, Any]:
        """Create manifest document for signing."""
        manifest = {
            "manifest_version": self.version,
            "created_at": time.time(),
            "created_datetime": time.strftime("%Y-%m-%d %H:%M:%S"),
            "source_directory": str(input_dir),
            "algorithm": self.algorithm,
            "file_inventory": file_inventory["files"],
            "summary": file_inventory["summary"],
            "metadata": {
                "generator": "pocketmon-pipeline/sign_manifest.py",
                "purpose": "Integrity verification for pipeline artifacts",
                "environment": {
                    "python_version": sys.version,
                    "platform": os.name,
                    "user": os.getenv("USER", "unknown")
                }
            }
        }
        
        return manifest
    
    def sign_manifest(self, manifest: Dict[str, Any]) -> Dict[str, Any]:
        """Sign the manifest using HMAC."""
        self._log("Signing manifest...")
        
        # Create canonical representation of manifest for signing
        # (excluding signature fields that will be added)
        signable_content = json.dumps(manifest, sort_keys=True, separators=(',', ':'))
        
        # Create HMAC signature
        signature = hmac.new(
            self.signing_secret.encode('utf-8'),
            signable_content.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Create signature metadata
        signature_info = {
            "signature": signature,
            "algorithm": self.algorithm,
            "signed_at": time.time(),
            "signed_datetime": time.strftime("%Y-%m-%d %H:%M:%S"),
            "content_hash": hashlib.sha256(signable_content.encode()).hexdigest(),
            "signature_version": "1.0"
        }
        
        # Add signature to manifest
        signed_manifest = manifest.copy()
        signed_manifest["signature"] = signature_info
        
        self._log(f"Manifest signed with {self.algorithm}")
        return signed_manifest
    
    def validate_manifest_structure(self, manifest: Dict[str, Any]) -> List[str]:
        """Validate manifest structure and content."""
        issues = []
        
        # Check required fields
        required_fields = ["manifest_version", "created_at", "file_inventory", "summary"]
        for field in required_fields:
            if field not in manifest:
                issues.append(f"Missing required field: {field}")
        
        # Check file inventory structure
        if "file_inventory" in manifest:
            file_inventory = manifest["file_inventory"]
            if not isinstance(file_inventory, dict):
                issues.append("file_inventory must be a dictionary")
            else:
                # Check a few file entries for proper structure
                for file_path, file_info in list(file_inventory.items())[:5]:
                    required_file_fields = ["absolute_path", "size_bytes", "checksum_sha256"]
                    for field in required_file_fields:
                        if field not in file_info:
                            issues.append(f"File {file_path} missing field: {field}")
        
        # Check summary
        if "summary" in manifest:
            summary = manifest["summary"]
            if not isinstance(summary, dict):
                issues.append("summary must be a dictionary")
            else:
                required_summary_fields = ["file_count", "total_size_bytes"]
                for field in required_summary_fields:
                    if field not in summary:
                        issues.append(f"Summary missing field: {field}")
        
        return issues
    
    def generate_signing_report(self, signed_manifest: Dict[str, Any]) -> Dict[str, Any]:
        """Generate signing report with verification information."""
        summary = signed_manifest.get("summary", {})
        signature_info = signed_manifest.get("signature", {})
        
        report = {
            "signing_summary": {
                "status": "success",
                "files_signed": summary.get("file_count", 0),
                "total_size_mb": summary.get("total_size_bytes", 0) / 1024 / 1024,
                "signature_algorithm": signature_info.get("algorithm", "unknown"),
                "signed_at": signature_info.get("signed_datetime", "unknown")
            },
            "verification_info": {
                "verification_command": "python scripts/verify_manifest.py --manifest <manifest_file>",
                "signature_fingerprint": signature_info.get("signature", "")[:16] + "...",
                "content_hash": signature_info.get("content_hash", "")
            },
            "security_notes": [
                "Signature created using HMAC-SHA256",
                "Verification requires POCKETMON_SIGN_SECRET environment variable", 
                "All file checksums included for integrity verification",
                "Manifest should be stored securely alongside signed artifacts"
            ],
            "file_breakdown": {
                "by_extension": self._analyze_file_extensions(signed_manifest),
                "largest_files": self._find_largest_files(signed_manifest, limit=5)
            }
        }
        
        return report
    
    def _analyze_file_extensions(self, manifest: Dict[str, Any]) -> Dict[str, int]:
        """Analyze file extensions in manifest."""
        extensions = {}
        
        file_inventory = manifest.get("file_inventory", {})
        for file_path in file_inventory.keys():
            ext = Path(file_path).suffix or "no_extension"
            extensions[ext] = extensions.get(ext, 0) + 1
        
        return dict(sorted(extensions.items(), key=lambda x: x[1], reverse=True))
    
    def _find_largest_files(self, manifest: Dict[str, Any], limit: int = 5) -> List[Dict[str, Any]]:
        """Find largest files in manifest."""
        file_inventory = manifest.get("file_inventory", {})
        
        file_sizes = [
            {
                "path": path,
                "size_bytes": info.get("size_bytes", 0),
                "size_mb": info.get("size_bytes", 0) / 1024 / 1024
            }
            for path, info in file_inventory.items()
        ]
        
        return sorted(file_sizes, key=lambda x: x["size_bytes"], reverse=True)[:limit]


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Sign Manifest - Cryptographic signing for pipeline artifacts"
    )
    
    parser.add_argument(
        "--input-dir",
        required=True,
        help="Input directory containing files to sign"
    )
    parser.add_argument(
        "--output",
        help="Output file for signed manifest (defaults to input-dir/integrity_manifest.json)"
    )
    parser.add_argument(
        "--report",
        help="Output file for signing report (optional)"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )
    
    args = parser.parse_args()
    
    try:
        signer = ManifestSigner(verbose=args.verbose)
        
        # Validate input directory
        input_dir = Path(args.input_dir)
        if not input_dir.exists():
            print(f"Error: Input directory does not exist: {input_dir}")
            return 1
        
        if not input_dir.is_dir():
            print(f"Error: Input path is not a directory: {input_dir}")
            return 1
        
        # Scan directory for files
        file_inventory = signer.scan_directory(input_dir)
        
        if file_inventory["summary"]["file_count"] == 0:
            print("Warning: No files found to sign")
            return 0
        
        # Create manifest
        manifest = signer.create_manifest(file_inventory, input_dir)
        
        # Validate manifest structure
        validation_issues = signer.validate_manifest_structure(manifest)
        if validation_issues:
            print("Manifest validation issues:")
            for issue in validation_issues:
                print(f"  - {issue}")
            return 1
        
        # Sign manifest
        signed_manifest = signer.sign_manifest(manifest)
        
        # Determine output file
        if args.output:
            output_file = Path(args.output)
        else:
            output_file = input_dir / "integrity_manifest.json"
        
        # Write signed manifest
        with open(output_file, 'w') as f:
            json.dump(signed_manifest, f, indent=2)
        
        print(f"Signed manifest written to: {output_file}")
        
        # Generate and optionally write signing report
        report = signer.generate_signing_report(signed_manifest)
        
        if args.report:
            report_file = Path(args.report)
            with open(report_file, 'w') as f:
                json.dump(report, f, indent=2)
            print(f"Signing report written to: {report_file}")
        
        # Print summary
        summary = report["signing_summary"]
        print(f"\nSigning Summary:")
        print(f"Status: {summary['status']}")
        print(f"Files Signed: {summary['files_signed']}")
        print(f"Total Size: {summary['total_size_mb']:.1f} MB")
        print(f"Algorithm: {summary['signature_algorithm']}")
        print(f"Signed At: {summary['signed_at']}")
        
        verification_info = report["verification_info"]
        print(f"\nVerification:")
        print(f"Command: {verification_info['verification_command']}")
        print(f"Signature: {verification_info['signature_fingerprint']}")
        
        return 0
        
    except KeyboardInterrupt:
        print("\nManifest signing interrupted by user")
        return 130
    except Exception as e:
        print(f"Manifest signing failed: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())