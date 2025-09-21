# Stake Upload Artifacts

This repo produces two submission artifacts:

- artifacts/math_static.zip — SDK static math bundle (index.json + CSV + JSONL.ZST)
- artifacts/web.zip — static frontend (CDN-safe)

## Build and package

- Math static bundle:
  - npm run package:publish
  - Outputs dist-publish/ and artifacts/math_static.zip
- Frontend:
  - npm run package:web
  - Outputs dist-web/ and artifacts/web.zip

Notes:

- The frontend packager injects a CSP and an ES5 guard.js that is active only on localhost/file. On CDN it is inert.
- If dist-publish/index.json exists, it is copied into dist-web/index.json so the UI can show paytable metadata locally.

## Portal/CDN checklist

1) Upload artifacts/math_static.zip to the portal’s Math (SDK-static) section.
2) Upload artifacts/web.zip to the portal’s Web section.
3) After upload, ensure the selected version is Published/Approved before launching.
4) Launch using the portal-provided CDN URL (index.html). Avoid hotlinking app.js.
5) If you see “Unexpected token …” in the console, open app.js URL in a new tab. If it shows an HTML error body (403/404), the CDN is serving an error page instead of JS. Fix by:

- Selecting a Published frontend version
- Waiting for CDN propagation or cache-busting via a new version
- Verifying the launch URL matches the chosen version

## Local smoke test

- Open dist-web/index.html from a local server (or file://). The guard allows local file and localhost; external calls are blocked locally to ensure no accidental network access.
- Spin button simulates visuals. In production on Stake, /api/spin is provided by host.

## Compliance notes

- No external absolute URLs; all assets are relative.
- CSP: default-src 'self'; img/media/style/script/connect restricted; inline style allowed for compatibility.
- guard.js is ES5 and only active on localhost/file to avoid interfering with CDN.
