# Deployment Packaging

This directory contains helper scripts for producing a Stake Engine deployable archive.

- `package.sh`: Builds the frontend and packages `frontend/dist` and `math/` into `deploy/artifacts/*.zip`.
- `artifacts/`: Output directory created automatically, ignored by Git.

Usage:

```bash
cd stake-engine-pocketmon/deploy
bash package.sh
```

The resulting zip contains:

```
frontend/
  dist/                # Production bundle (index.html, assets/*.js, *.css)
math/
  game_config.py
  game_executables.py
  game_events.py
  gamestate.py
  reels/
  library/
```

Notes:
- The script uses `npm ci` if a lockfile is present; otherwise falls back to `npm install`.
- Python bytecode and `__pycache__` folders are excluded from the math package copy.

## Continuous Integration (CI)

The GitHub Actions workflow `Pack Stake Engine Artifact` builds the frontend, packages the artifact, and uploads:

- `deploy/artifacts/*.zip`
- `deploy/artifacts/*.zip.sha256`

Triggers:
- Manual via Actions UI (`workflow_dispatch`)
- `push` to branches matching `copilot/**`
- `pull_request` targeting `main`
 - Tag push matching `v*` (publishes a GitHub Release)

## Downloading Artifacts via CLI

Use GitHub CLI to fetch artifacts from the latest run:

```bash
# List recent runs
gh run list --limit 5

# Download artifacts from a specific run ID
gh run download <RUN_ID> -D ./downloaded-artifacts
```

Artifacts will be placed under `./downloaded-artifacts/<artifact-name>/`.

## Verifying Checksums

### Verify all local artifacts (default location)

```bash
bash stake-engine-pocketmon/deploy/verify.sh
```

### Verify a specific artifact by name (in default `artifacts/`)

```bash
bash stake-engine-pocketmon/deploy/verify.sh pocketmon-stake-engine-YYYYMMDD-HHMMSS.zip
```

### Verify a downloaded artifact (arbitrary directory)

Pass the path to the `.sha256` file that sits alongside your downloaded `.zip`:

```bash
bash stake-engine-pocketmon/deploy/verify.sh ./downloaded-artifacts/stake-engine-artifact/pocketmon-stake-engine-YYYYMMDD-HHMMSS.zip.sha256
```

The verification script reads the expected hash from the `.sha256` file and computes the hash of the adjacent `.zip`, ensuring verification works even when the original absolute path embedded in the checksum differs (e.g., CI paths).

## Release on Tag

Pushing a tag that matches `v*` will create a GitHub Release and attach the packaged zip and its checksum.

Create and push a tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Then visit the repository Releases page to download the assets. Pre-release tags like `v1.1.0-rc.1` will be marked as prereleases automatically.
