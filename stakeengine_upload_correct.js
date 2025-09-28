// Correct StakeEngine Frontend Upload Script
// This script properly formats the request for the StakeEngine API

const fs = require("fs");
const https = require("https");
const FormData = require("form-data");

async function uploadFrontendToStakeEngine() {
  const API_KEY = process.env.STAKEENGINE_API_KEY;
  const API_SECRET = process.env.STAKEENGINE_API_SECRET;
  const API_URL = "https://api.stakeengine.com/api/file/publish/front";

  if (!API_KEY || !API_SECRET) {
    console.error("Error: STAKEENGINE_API_KEY and STAKEENGINE_API_SECRET must be set");
    process.exit(1);
  }

  try {
    // Read the frontend bundle
    const frontendBundle = JSON.parse(fs.readFileSync("stakeengine_frontend_publish.json", "utf8"));

    console.log("Preparing upload to StakeEngine...");
    console.log("Game ID: pocket_monsters_genesis");
    console.log("Bundle size:", JSON.stringify(frontendBundle).length, "bytes");

    // Create the correct request format
    const uploadPayload = {
      version: 1,
      changed: true,
      gameId: "pocket_monsters_genesis",
      bundle: frontendBundle,
    };

    // Here you would make the actual HTTP request to StakeEngine
    const response = await makeStakeEngineRequest(API_URL, uploadPayload, API_KEY);

    console.log("Upload response:", response);
  } catch (error) {
    console.error("Upload failed:", error.message);

    // Return error in the format expected by StakeEngine
    const errorResponse = {
      code: "UPLOAD_FAILED",
      message: error.message,
    };

    console.log("Error response format:", JSON.stringify(errorResponse, null, 2));
  }
}

async function makeStakeEngineRequest(url, payload, apiKey) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);

    const options = {
      hostname: "api.stakeengine.com",
      port: 443,
      path: "/api/file/publish/front",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
        Authorization: `Bearer ${apiKey}`,
        "X-Game-ID": "pocket_monsters_genesis",
        "X-Platform": "stake-engine.com",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Alternative: Upload as form data if the API expects multipart/form-data
async function uploadAsFormData() {
  const form = new FormData();

  // Add the version and changed fields as required by the API
  form.append("version", "1");
  form.append("changed", "true");

  // Add the frontend bundle file
  form.append("bundle", fs.createReadStream("stakeengine_frontend_publish.json"), {
    filename: "stakeengine_frontend_publish.json",
    contentType: "application/json",
  });

  // Add metadata
  form.append("gameId", "pocket_monsters_genesis");
  form.append("platform", "stake-engine.com");

  const API_KEY = process.env.STAKEENGINE_API_KEY;

  return new Promise((resolve, reject) => {
    form.submit(
      {
        host: "api.stakeengine.com",
        path: "/api/file/publish/front",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      },
      function (err, res) {
        if (err) {
          reject(err);
        } else {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve(data));
        }
      }
    );
  });
}

// Usage examples
if (require.main === module) {
  uploadFrontendToStakeEngine().catch(console.error);
}

module.exports = {
  uploadFrontendToStakeEngine,
  uploadAsFormData,
  makeStakeEngineRequest,
};
