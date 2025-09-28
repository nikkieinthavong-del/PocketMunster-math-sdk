This is useful for local development and sanity checks before uploading to Stake ACP.

### Extending the mock

You can customize `scripts/rgs_mock.ts` to:

- Return random win amounts or simulate different modes
- Change the config, balance, or event structure
  Just edit the script and restart with `npm run rgs:mock`.

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

Validation:

- Math vs CSV quick check:
  - npm run validate:publish
  - Confirms a sample of payout multipliers in books_base.jsonl.zst matches lookUpTable_base_0.csv

Notes:

- The frontend packager injects a CSP and an ES5 guard.js that is active only on localhost/file. On CDN it is inert.
- If dist-publish/index.json exists, it is copied into dist-web/index.json so the UI can show paytable metadata locally.

## Portal/CDN checklist

For the exact Stake-preferred sequence, see `STAKE_ORDER_CHECKLIST.md`.

1. Upload artifacts/math_static.zip to the portal’s Math (SDK-static) section.
2. Upload artifacts/web.zip to the portal’s Web section.
3. After upload, ensure the selected version is Published/Approved before launching.
4. Launch using the portal-provided CDN URL (index.html). Avoid hotlinking app.js.
5. If you see “Unexpected token …” in the console, open app.js URL in a new tab. If it shows an HTML error body (403/404), the CDN is serving an error page instead of JS. Fix by:

- Selecting a Published frontend version
- Waiting for CDN propagation or cache-busting via a new version
- Verifying the launch URL matches the chosen version

Stake Engine ACP flow:

1. Math (SDK static): Upload artifacts/math_static.zip to ACP → Math → SDK-static. Ensure files contain:
   - index.json
   - books\_\*.jsonl.zst (at least one)
   - lookUpTable\_\*.csv (at least one)

2. Web: Upload artifacts/web.zip to ACP → Web. Confirm index.html is at root and assets are relative paths.
3. Approve/publish both Math and Web versions. Wait for CDN propagation if needed.
4. Launch via the ACP-provided CDN link (index.html). Avoid deep-linking to JS files directly.

## Local smoke test

- Open dist-web/index.html from a local server (or file://). The guard allows local file and localhost; external calls are blocked locally to ensure no accidental network access.
- Spin button simulates visuals. In production on Stake, /api/spin is provided by host.

## Local RGS mock smoke test

For frontend-to-backend integration, you can run a local RGS mock server:

- Start the mock:
  - npm run rgs:mock
  - (or) npm run rgs:mock:port --port=8099
- In your browser, use a query string like:
  - ?sessionID=local&rgs_url=127.0.0.1&apiPrefix=http%3A%2F%2F127.0.0.1%3A8089&authPath=%2Fwallet%2Fauthenticate&spinPath=%2Fwallet%2Fplay&endRoundPath=%2Fwallet%2Fend-round&mode=high
- The frontend will authenticate, play, and end-round against the mock, updating the balance and showing a fixed event sequence.

This is useful for local development and sanity checks before uploading to Stake ACP.

Optional RGS smoke (hosted or local proxy):

- Start a local server (npm run serve) and pass query params like sessionID and rgs_url to hit Stake RGS when embedded under the approved domain.
- For local-only verification without RGS, the app runs offline using dist-publish/index.json.

## Compliance notes

- No external absolute URLs; all assets are relative.
- CSP: default-src 'self'; img/media/style/script/connect restricted; inline style allowed for compatibility.
- guard.js is ES5 and only active on localhost/file to avoid interfering with CDN.

## RGS API mapping (Stake Engine)

The frontend can point to Stake RGS endpoints with no code changes. Configure via query flags on the CDN URL or at runtime.

Query flags:

- sessionID: Provided by RGS (required)
- rgs_url: Hostname of RGS (required)
- apiPrefix: Base API origin/path (e.g., <https://{team}.rgs.stake-engine.com>)
- authPath: Authenticate endpoint (default /wallet/authenticate)
- spinPath: Play endpoint (default /wallet/play)
- endRoundPath: End-round endpoint (default /wallet/end-round)
- paytablePath: Offline paytable path (ignored when RGS is active)
- buyPath: Buy feature endpoint (optional)
- token: Auth token value (optional)
- tokenHeader: Header key (default Authorization)
- tokenType: Token prefix (default Bearer)

Example:

?sessionID=abc123&rgs_url=rgs.stake-engine.com&apiPrefix=https%3A%2F%2F{team}.rgs.stake-engine.com&authPath=%2Fwallet%2Fauthenticate&spinPath=%2Fwallet%2Fplay&endRoundPath=%2Fwallet%2Fend-round&token=XYZ&tokenHeader=Authorization&tokenType=Bearer

Runtime override (classic + container embeds):

window.PocketMunsters.setApi({
prefix: 'https://{team}.rgs.stake-engine.com',
authPath: '/wallet/authenticate',
spinPath: '/wallet/play',
endRoundPath: '/wallet/end-round',
token: 'XYZ',
tokenHeader: 'Authorization',
tokenType: 'Bearer'
});

Notes:

- If sessionID and apiPrefix are present, the app uses RGS; for paytable view in RGS we show the Authenticate config instead of offline paytable.
- Buy: The UI shows a Buy button that calls buyPath when configured; it is auto-hidden if buyPath is not provided.

Stake QA:

- Run: node scripts/qa-stake.mjs
- Expect: "Stake QA passed: no external absolute URLs detected."
