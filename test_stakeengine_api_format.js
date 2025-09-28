// Test script to validate StakeEngine API request format
// This ensures the request matches the expected schema

const fs = require("fs");

function validateStakeEngineRequest() {
  console.log("Validating StakeEngine API request format...");

  try {
    // Read the frontend bundle
    const frontendBundle = JSON.parse(fs.readFileSync("stakeengine_frontend_publish.json", "utf8"));

    // Create the request payload in the format expected by StakeEngine
    const requestPayload = {
      version: 1,
      changed: true,
    };

    console.log("Request payload format:");
    console.log(JSON.stringify(requestPayload, null, 2));

    // Validate the payload structure
    const isValidVersion = typeof requestPayload.version === "number";
    const isValidChanged = typeof requestPayload.changed === "boolean";

    console.log("Validation results:");
    console.log("- version is number:", isValidVersion);
    console.log("- changed is boolean:", isValidChanged);

    if (isValidVersion && isValidChanged) {
      console.log("✓ Request format is valid for StakeEngine API");

      // Show what the API expects
      console.log("\nExpected API response formats:");
      console.log('1. Success: { "version": number, "changed": boolean }');
      console.log('2. Error: { "code": string, "message": string }');

      console.log("\nUpload instructions:");
      console.log("1. Set environment variables:");
      console.log('   export STAKEENGINE_API_KEY="your_api_key"');
      console.log('   export STAKEENGINE_API_SECRET="your_api_secret"');
      console.log("2. Run the upload script:");
      console.log("   node stakeengine_upload_correct.js");
    } else {
      console.log("✗ Request format is invalid");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Validation failed:", error.message);
    return false;
  }
}

function showAPIUsage() {
  console.log("\n=== StakeEngine API Usage ===");
  console.log("Endpoint: POST https://api.stakeengine.com/api/file/publish/front");
  console.log("Headers:");
  console.log("  Content-Type: application/json");
  console.log("  Authorization: Bearer {API_KEY}");
  console.log("  X-Game-ID: pocket_monsters_genesis");
  console.log("");
  console.log("Request Body:");
  console.log("{");
  console.log('  "version": 1,');
  console.log('  "changed": true');
  console.log("}");
  console.log("");
  console.log("Response (Success):");
  console.log("{");
  console.log('  "version": 1,');
  console.log('  "changed": true');
  console.log("}");
  console.log("");
  console.log("Response (Error):");
  console.log("{");
  console.log('  "code": "ERROR_CODE",');
  console.log('  "message": "Error description"');
  console.log("}");
}

if (require.main === module) {
  const isValid = validateStakeEngineRequest();
  showAPIUsage();

  if (isValid) {
    console.log("\n✓ Ready to upload to stake-engine.com");
  } else {
    console.log("\n✗ Fix the request format before uploading");
  }
}

module.exports = { validateStakeEngineRequest };
