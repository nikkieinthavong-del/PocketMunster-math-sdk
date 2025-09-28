const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

// Create a file to stream archive data to
const output = fs.createWriteStream("pocket_monsters_genesis_stake_upload.zip");
const archive = archiver("zip", {
  zlib: { level: 9 }, // Maximum compression
});

// Listen for all archive data to be written
output.on("close", function () {
  console.log("Archive created successfully!");
  console.log("Zip file size:", archive.pointer() + " total bytes");
  console.log("Upload this file to stake-engine.com via the developer portal");
});

// Good practice to catch this error explicitly
archive.on("error", function (err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add all the required files for Stake upload
archive.file("stakeengine_publication_manifest.json", { name: "manifest.json" });
archive.file("stakeengine_math_model.json", { name: "math-model.json" });
archive.file("stakeengine_frontend_bundle.json", { name: "frontend-bundle.json" });
archive.file("stakeengine_sdk_config.json", { name: "sdk-config.json" });
archive.file("stake_api_integration.json", { name: "api-spec.json" });
archive.file("stake_math_verification.json", { name: "math-verification.json" });
archive.file("stakeengine_verification_models.json", { name: "verification-models.json" });
archive.file("stakeengine_upload_package.json", { name: "upload-package.json" });
archive.file("stakeengine_deployment_scripts.json", { name: "deployment-scripts.json" });

// Add the original stake files as well
archive.file("stake_math_artifacts.json", { name: "original-math-artifacts.json" });
archive.file("stake_frontend_bundle.json", { name: "original-frontend-bundle.json" });
archive.file("stake_game_config.json", { name: "game-config.json" });
archive.file("stake_frontend_assets.json", { name: "frontend-assets.json" });

// Add documentation
archive.file("STAKE_DEPLOYMENT_GUIDE.md", { name: "deployment-guide.md" });
archive.file("ARCHITECTURAL_REVIEW.md", { name: "architectural-review.md" });
archive.file("stakeengine_sdk_technical_report.md", { name: "technical-report.md" });

// Add all asset directories that would be needed
const assetDirs = [
  "assets/symbols/",
  "assets/backgrounds/",
  "assets/ui/",
  "assets/audio/",
  "js/",
  "css/",
];

// Note: In a real scenario, we would add actual asset files
// For this example, we'll just document what should be included
const assetManifest = {
  symbols: 18,
  backgrounds: 5,
  ui_elements: 12,
  audio_files: 25,
  js_bundles: 5,
  css_files: 2,
};

archive.append(JSON.stringify(assetManifest, null, 2), { name: "asset-manifest.json" });

// Finalize the archive
archive.finalize();
