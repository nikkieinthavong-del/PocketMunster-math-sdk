# Stake Engine upload order (authoritative sequence)

Follow these steps in order. Each step lists purpose, command(s), expected outputs, and acceptance criteria.

## 1) Validate math artifacts first (preflight)

Purpose: Ensure the SDK-static math bundle is internally consistent before any packaging or upload.

Commands (PowerShell):

```powershell
npm run qa:all
```

What it does:

- validate:index — checks that `dist-publish/index.json` exists, has modes, and references files that exist.
- validate:publish — samples `books_*.jsonl.zst` and cross-checks payoutMultiplier vs `lookUpTable_*.csv`.
- qa:stake — scans web bundle for external absolute URLs (safety check).

Accept if:

- "index.json validation: OK"
- "Match: true"
- "Stake QA passed: no external absolute URLs detected."

## 2) Package Math (SDK-static)

Purpose: Produce the exact ZIP for ACP upload.

```powershell
npm run package:publish:full
```

Outputs:

- `dist-publish/` — working folder with `index.json`, `books_*.jsonl.zst`, `lookUpTable_*.csv`
- `artifacts/math_static.zip` — upload asset

Accept if:

- Validator inside this script prints "Match: true"
- ZIP exists at `artifacts/math_static.zip`

## 3) Upload Math in ACP

Portal path: ACP → Math → SDK-static

Upload: `artifacts/math_static.zip`

Contained files (minimum):

- `index.json`
- `books_*.jsonl.zst` (≥ 1)
- `lookUpTable_*.csv` (≥ 1)

Optional: attach `artifacts/checksums.txt` for audit (generate in step 6).

## 4) Package Web

Purpose: Produce static web bundle for ACP upload.

```powershell
npm run package:web
```

Outputs:

- `dist-web/`
- `artifacts/web.zip`

Accept if:

- QA scanner later reports no external absolute URLs
- `index.html` at root of the ZIP, assets are relative paths

## 5) Upload Web in ACP

Portal path: ACP → Web

Upload: `artifacts/web.zip`

Confirm:

- `index.html` at ZIP root
- No environment-specific absolute URLs

## 6) Approve / Publish versions

In ACP:

- Approve/Publish the just-uploaded Math (SDK-static) version
- Approve/Publish the just-uploaded Web version

Optional checksums (for release notes or change control):

```powershell
npm run checksums
```

Outputs:

- `artifacts/checksums.json`
- `artifacts/checksums.txt`

## 7) Launch test via ACP CDN

Use the ACP-provided CDN link to `index.html` and append RGS params.

Minimal example (URL-encoded as needed):

```text
?sessionID=abc123&rgs_url=rgs.stake-engine.com&apiPrefix=https%3A%2F%2F{team}.rgs.stake-engine.com&authPath=%2Fwallet%2Fauthenticate&spinPath=%2Fwallet%2Fplay&endRoundPath=%2Fwallet%2Fend-round
```

Runtime expectations:

- On load, frontend calls `/wallet/authenticate` (via `apiPrefix + authPath`) and displays config/balance.
- Spin sends `{ amount, mode }` to `/wallet/play` and animates returned events.
- End of sequence calls `/wallet/end-round`.
- No frontend RNG; seed is used only for offline demo.

## 8) Smoke checklist

- Page loads without CSP or MIME errors
- Paytable/config displays (in RGS mode, we show Authenticate config summary)
- Play/End-round cycle completes; balance deltas consistent with response
- No blocked absolute URLs; guard is inert on CDN

## 9) Troubleshooting

- "Unexpected token" when loading JS from CDN:
  - Open the JS URL in a new tab. If you see an HTML 403/404 body, the CDN is serving an error page.
  - Ensure a Published Web version is selected; wait for propagation; relaunch with the exact CDN URL.
- RGS 401/403 or empty config:
  - Check `sessionID`, `rgs_url`, `apiPrefix` parameters; verify token/headers if used.
- Math payout mismatch warnings:
  - Re-run `npm run validate:publish` and inspect `dist-publish/*` contents.

---

Fast path command (does steps 2, 4, and 6 helpers in order):

```powershell
npm run package:release
```

This runs: web packaging → math publish (with internal validation) → checksums. Use step 1 (qa:all) before running this for full preflight.
