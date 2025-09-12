#!/usr/bin/env python3
"""
Verify Manifest

Verifies cryptographically signed manifests and checks file integrity
against recorded checksums and metadata.
"""

import argparse
import json
import os
import sys
import time
import hashlib
import hmac
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple


class ManifestVerifier:
    """Cryptographic verification for pipeline manifests."""
    
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        
        # Get signing secret from environment
        self.signing_secret = os.getenv("POCKETMON_SIGN_SECRET")
        if not self.signing_secret:
            self._log("Warning: POCKETMON_SIGN_SECRET not set, using default key", "WARNING")
            self.signing_secret = "default_dev_key_not_for_production"
        
        # Verification results
        self.verification_results = {
            "signature_valid": False,
            "file_integrity_valid": True,
            "structure_valid": True,
            "issues": [],
            "warnings": [],
            "file_verification_results": {}
        }
    
    def _log(self, message: str, level: str = "INFO") -> None:
        """Log message with timestamp."""
        if self.verbose or level in ["ERROR", "WARNING"]:
            timestamp = time.strftime("%H:%M:%S")
            print(f"[{timestamp}] [{level}] {message}")
    
    def load_manifest(self, manifest_path: Path) -> Dict[str, Any]:
        """Load and parse manifest file."""
        self._log(f"Loading manifest: {manifest_path}")
        
        try:
            with open(manifest_path, 'r') as f:
                manifest = json.load(f)
            
            self._log("Manifest loaded successfully")
            return manifest
            
        except FileNotFoundError:
            raise FileNotFoundError(f"Manifest file not found: {manifest_path}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in manifest file: {e}")
        except Exception as e:
            raise Exception(f"Error loading manifest: {e}")
    
    def verify_signature(self, manifest: Dict[str, Any]) -> bool:
        """Verify the cryptographic signature of the manifest."""
        self._log("Verifying manifest signature...")
        
        # Check if manifest has signature
        if "signature" not in manifest:
            self.verification_results["issues"].append("Manifest missing signature")
            return False
        
        signature_info = manifest["signature"]
        
        # Extract signature components
        stored_signature = signature_info.get("signature")
        algorithm = signature_info.get("algorithm", "HMAC-SHA256")
        
        if not stored_signature:
            self.verification_results["issues"].append("Signature field is empty")
            return False
        
        if algorithm != "HMAC-SHA256":
            self.verification_results["issues"].append(f"Unsupported signature algorithm: {algorithm}")
            return False
        
        try:
            # Create manifest copy without signature for verification
            manifest_copy = manifest.copy()
            del manifest_copy["signature"]
            
            # Create canonical representation
            signable_content = json.dumps(manifest_copy, sort_keys=True, separators=(',', ':'))
            
            # Calculate expected signature
            expected_signature = hmac.new(
                self.signing_secret.encode('utf-8'),
                signable_content.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            # Compare signatures
            signature_valid = hmac.compare_digest(stored_signature, expected_signature)
            
            if signature_valid:
                self._log("Signature verification: VALID")
                self.verification_results["signature_valid"] = True
            else:
                self._log("Signature verification: INVALID", "ERROR")
                self.verification_results["issues"].append("Signature verification failed")
                self.verification_results["signature_valid"] = False
            
            return signature_valid
            
        except Exception as e:
            self.verification_results["issues"].append(f"Signature verification error: {e}")
            return False
    
    def verify_manifest_structure(self, manifest: Dict[str, Any]) -> bool:
        """Verify the structure and required fields of the manifest."""
        self._log("Verifying manifest structure...")
        
        structure_valid = True
        
        # Check required top-level fields
        required_fields = [
            "manifest_version", "created_at", "file_inventory", 
            "summary", "signature"
        ]
        
        for field in required_fields:
            if field not in manifest:
                self.verification_results["issues"].append(f"Missing required field: {field}")
                structure_valid = False
        
        # Validate file inventory structure
        if "file_inventory" in manifest:
            file_inventory = manifest["file_inventory"]
            if not isinstance(file_inventory, dict):
                self.verification_results["issues"].append("file_inventory must be a dictionary")
                structure_valid = False
            else:
                # Check file entry structure
                for file_path, file_info in file_inventory.items():
                    required_file_fields = ["absolute_path", "size_bytes", "checksum_sha256"]
                    for field in required_file_fields:
                        if field not in file_info:
                            self.verification_results["issues"].append(
                                f"File {file_path} missing required field: {field}"
                            )
                            structure_valid = False
        
        # Validate summary structure
        if "summary" in manifest:
            summary = manifest["summary"]
            if not isinstance(summary, dict):
                self.verification_results["issues"].append("summary must be a dictionary")
                structure_valid = False
            else:
                required_summary_fields = ["file_count", "total_size_bytes"]
                for field in required_summary_fields:
                    if field not in summary:
                        self.verification_results["issues"].append(f"Summary missing field: {field}")
                        structure_valid = False
        
        # Validate signature structure
        if "signature" in manifest:
            signature = manifest["signature"]
            if not isinstance(signature, dict):
                self.verification_results["issues"].append("signature must be a dictionary")
                structure_valid = False
            else:
                required_sig_fields = ["signature", "algorithm", "signed_at"]
                for field in required_sig_fields:
                    if field not in signature:
                        self.verification_results["issues"].append(f"Signature missing field: {field}")
                        structure_valid = False
        
        self.verification_results["structure_valid"] = structure_valid
        
        if structure_valid:
            self._log("Manifest structure: VALID")
        else:
            self._log("Manifest structure: INVALID", "ERROR")
        
        return structure_valid
    
    def verify_file_integrity(self, manifest: Dict[str, Any]) -> Tuple[bool, Dict[str, Any]]:
        """Verify the integrity of files listed in the manifest."""
        self._log("Verifying file integrity...")
        
        file_inventory = manifest.get("file_inventory", {})
        source_directory = Path(manifest.get("source_directory", "."))
        
        integrity_results = {
            "files_checked": 0,
            "files_valid": 0,
            "files_invalid": 0,
            "files_missing": 0,
            "invalid_files": [],
            "missing_files": [],
            "checksum_mismatches": []
        }
        
        overall_valid = True
        
        for relative_path, file_info in file_inventory.items():
            integrity_results["files_checked"] += 1
            
            # Determine file path
            absolute_path = Path(file_info.get("absolute_path", ""))
            if not absolute_path.exists():
                # Try relative to source directory
                alternative_path = source_directory / relative_path
                if alternative_path.exists():
                    file_path = alternative_path
                else:
                    # File is missing
                    integrity_results["files_missing"] += 1
                    integrity_results["missing_files"].append(relative_path)
                    self.verification_results["issues"].append(f"File not found: {relative_path}")
                    overall_valid = False
                    continue
            else:
                file_path = absolute_path
            
            # Verify file exists and is readable
            try:
                if not file_path.is_file():
                    integrity_results["files_missing"] += 1
                    integrity_results["missing_files"].append(relative_path)
                    self.verification_results["issues"].append(f"Path is not a file: {relative_path}")
                    overall_valid = False
                    continue
                
                # Verify file size
                actual_size = file_path.stat().st_size
                expected_size = file_info.get("size_bytes", 0)
                
                if actual_size != expected_size:
                    integrity_results["files_invalid"] += 1
                    integrity_results["invalid_files"].append({
                        "path": relative_path,
                        "issue": "size_mismatch",
                        "expected": expected_size,
                        "actual": actual_size
                    })
                    self.verification_results["issues"].append(
                        f"File size mismatch for {relative_path}: expected {expected_size}, got {actual_size}"
                    )
                    overall_valid = False
                    continue
                
                # Verify checksum
                expected_checksum = file_info.get("checksum_sha256", "")
                if expected_checksum:
                    actual_checksum = self._calculate_file_checksum(file_path)
                    
                    if actual_checksum != expected_checksum:
                        integrity_results["files_invalid"] += 1
                        integrity_results["checksum_mismatches"].append({
                            "path": relative_path,
                            "expected": expected_checksum,
                            "actual": actual_checksum
                        })
                        self.verification_results["issues"].append(
                            f"Checksum mismatch for {relative_path}"
                        )
                        overall_valid = False
                        continue
                
                # File is valid
                integrity_results["files_valid"] += 1
                
            except Exception as e:
                integrity_results["files_invalid"] += 1
                integrity_results["invalid_files"].append({
                    "path": relative_path,
                    "issue": "verification_error",
                    "error": str(e)
                })
                self.verification_results["issues"].append(f"Error verifying {relative_path}: {e}")
                overall_valid = False
        
        self.verification_results["file_integrity_valid"] = overall_valid
        self.verification_results["file_verification_results"] = integrity_results
        
        if overall_valid:
            self._log(f"File integrity: VALID ({integrity_results['files_valid']} files)")
        else:
            self._log(f"File integrity: INVALID ({integrity_results['files_invalid']} issues)", "ERROR")
        
        return overall_valid, integrity_results
    
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
    
    def verify_manifest_consistency(self, manifest: Dict[str, Any]) -> bool:
        """Verify internal consistency of manifest data."""
        self._log("Verifying manifest consistency...")
        
        consistency_valid = True
        
        # Check file count consistency
        file_inventory = manifest.get("file_inventory", {})
        summary = manifest.get("summary", {})
        
        actual_file_count = len(file_inventory)
        declared_file_count = summary.get("file_count", 0)
        
        if actual_file_count != declared_file_count:
            self.verification_results["issues"].append(
                f"File count mismatch: summary says {declared_file_count}, inventory has {actual_file_count}"
            )
            consistency_valid = False
        
        # Check total size consistency
        calculated_total_size = sum(
            file_info.get("size_bytes", 0) 
            for file_info in file_inventory.values()
        )
        declared_total_size = summary.get("total_size_bytes", 0)
        
        if calculated_total_size != declared_total_size:
            self.verification_results["issues"].append(
                f"Total size mismatch: summary says {declared_total_size}, calculated {calculated_total_size}"
            )
            consistency_valid = False
        
        # Check timestamp validity
        created_at = manifest.get("created_at", 0)
        if created_at <= 0 or created_at > time.time() + 86400:  # Allow 1 day in future
            self.verification_results["warnings"].append("Suspicious creation timestamp")
        
        signature_info = manifest.get("signature", {})
        signed_at = signature_info.get("signed_at", 0)
        if signed_at < created_at:
            self.verification_results["warnings"].append("Signature timestamp is before creation timestamp")
        
        if consistency_valid:
            self._log("Manifest consistency: VALID")
        else:
            self._log("Manifest consistency: INVALID", "ERROR")
        
        return consistency_valid
    
    def generate_verification_report(self, manifest: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive verification report."""
        
        # Calculate overall verification status
        overall_valid = (
            self.verification_results["signature_valid"] and
            self.verification_results["file_integrity_valid"] and
            self.verification_results["structure_valid"]
        )
        
        # Get file verification details
        file_results = self.verification_results.get("file_verification_results", {})
        
        report = {
            "verification_summary": {
                "overall_status": "VALID" if overall_valid else "INVALID",
                "timestamp": time.time(),
                "datetime": time.strftime("%Y-%m-%d %H:%M:%S"),
                "manifest_file": "provided_manifest",
                "verifier_version": "1.0"
            },
            "verification_details": {
                "signature_verification": {
                    "status": "VALID" if self.verification_results["signature_valid"] else "INVALID",
                    "algorithm": manifest.get("signature", {}).get("algorithm", "unknown")
                },
                "structure_verification": {
                    "status": "VALID" if self.verification_results["structure_valid"] else "INVALID"
                },
                "file_integrity_verification": {
                    "status": "VALID" if self.verification_results["file_integrity_valid"] else "INVALID",
                    "files_checked": file_results.get("files_checked", 0),
                    "files_valid": file_results.get("files_valid", 0),
                    "files_invalid": file_results.get("files_invalid", 0),
                    "files_missing": file_results.get("files_missing", 0)
                }
            },
            "issues": self.verification_results["issues"],
            "warnings": self.verification_results["warnings"],
            "manifest_metadata": {
                "manifest_version": manifest.get("manifest_version", "unknown"),
                "created_at": manifest.get("created_datetime", "unknown"),
                "source_directory": manifest.get("source_directory", "unknown"),
                "file_count": manifest.get("summary", {}).get("file_count", 0),
                "total_size_mb": manifest.get("summary", {}).get("total_size_bytes", 0) / 1024 / 1024
            },
            "recommendations": self._generate_recommendations()
        }
        
        return report
    
    def _generate_recommendations(self) -> List[str]:
        """Generate recommendations based on verification results."""
        recommendations = []
        
        if not self.verification_results["signature_valid"]:
            recommendations.append("Re-sign the manifest using the correct signing key")
            recommendations.append("Verify POCKETMON_SIGN_SECRET environment variable is set correctly")
        
        if not self.verification_results["file_integrity_valid"]:
            recommendations.append("Restore missing or corrupted files from backup")
            recommendations.append("Investigate the cause of file integrity issues")
        
        if not self.verification_results["structure_valid"]:
            recommendations.append("Regenerate the manifest with correct structure")
        
        if self.verification_results["warnings"]:
            recommendations.append("Review warnings for potential security or consistency issues")
        
        if not any([
            self.verification_results["signature_valid"],
            self.verification_results["file_integrity_valid"],
            self.verification_results["structure_valid"]
        ]):
            recommendations.append("DO NOT use these artifacts - integrity cannot be verified")
        
        return recommendations


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Verify Manifest - Cryptographic verification for pipeline artifacts"
    )
    
    parser.add_argument(
        "--manifest",
        required=True,
        help="Path to signed manifest file to verify"
    )
    parser.add_argument(
        "--output",
        help="Output file for verification report (JSON format)"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )
    
    args = parser.parse_args()
    
    try:
        verifier = ManifestVerifier(verbose=args.verbose)
        
        # Load manifest
        manifest_path = Path(args.manifest)
        manifest = verifier.load_manifest(manifest_path)
        
        # Perform verification steps
        structure_valid = verifier.verify_manifest_structure(manifest)
        signature_valid = verifier.verify_signature(manifest)
        
        # Only verify file integrity if structure and signature are valid
        if structure_valid and signature_valid:
            integrity_valid, integrity_results = verifier.verify_file_integrity(manifest)
            consistency_valid = verifier.verify_manifest_consistency(manifest)
        else:
            integrity_valid = False
            consistency_valid = False
        
        # Generate verification report
        report = verifier.generate_verification_report(manifest)
        
        # Output report if requested
        if args.output:
            output_path = Path(args.output)
            with open(output_path, 'w') as f:
                json.dump(report, f, indent=2)
            print(f"Verification report written to: {output_path}")
        
        # Print verification summary
        summary = report["verification_summary"]
        details = report["verification_details"]
        
        print(f"\nManifest Verification Results:")
        print(f"Overall Status: {summary['overall_status']}")
        print(f"Verified At: {summary['datetime']}")
        
        print(f"\nDetailed Results:")
        print(f"Signature: {details['signature_verification']['status']}")
        print(f"Structure: {details['structure_verification']['status']}")
        print(f"File Integrity: {details['file_integrity_verification']['status']}")
        
        integrity = details["file_integrity_verification"]
        if integrity["files_checked"] > 0:
            print(f"  Files Checked: {integrity['files_checked']}")
            print(f"  Files Valid: {integrity['files_valid']}")
            print(f"  Files Invalid: {integrity['files_invalid']}")
            print(f"  Files Missing: {integrity['files_missing']}")
        
        # Show issues and warnings
        if report["issues"]:
            print(f"\nIssues ({len(report['issues'])}):")
            for issue in report["issues"][:5]:  # Show first 5 issues
                print(f"  - {issue}")
            if len(report["issues"]) > 5:
                print(f"  ... and {len(report['issues']) - 5} more issues")
        
        if report["warnings"]:
            print(f"\nWarnings ({len(report['warnings'])}):")
            for warning in report["warnings"]:
                print(f"  - {warning}")
        
        # Show recommendations
        if report["recommendations"]:
            print(f"\nRecommendations:")
            for rec in report["recommendations"]:
                print(f"  - {rec}")
        
        # Exit with appropriate code
        if summary["overall_status"] == "VALID":
            return 0
        else:
            return 1
        
    except KeyboardInterrupt:
        print("\nManifest verification interrupted by user")
        return 130
    except Exception as e:
        print(f"Manifest verification failed: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())