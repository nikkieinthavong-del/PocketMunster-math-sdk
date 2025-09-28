# Stake Engine Math SDK

Welcome to [Stake Engine Math SDK](https://engine.stake.com/).

The Math SDK is a Python-based engine for defining game rules, simulating outcomes, and optimizing win distributions. It generates backend/config files, lookup tables, and simulation results.

For technical details, see the docs: <https://stakeengine.github.io/math-sdk/>

Additional docs in this repo:

- Python → TypeScript event mapping for Pocket Munsters: `docs/event_mapping.md`

## Installation

This repository requires Python 3.12+ and pip. If you will run the optimization algorithm, install Rust/Cargo as well.

Recommended setup using Make:

```sh
make setup
```

Alternatively, see the installation guide: <https://stakeengine.github.io/math-sdk/math_docs/general_overview/>

## Frontend demo and local server

The project includes a minimal HTTP server and a static frontend for local development and demos.

- Build runtime TS and package the web assets:
  - `npm run build:demo`
  - `npm run package:web:prep`
  - Tip: Set ASSETS_SRC to your asset folder. If not set, the packager defaults to: C:\\Users\\kevin\\Desktop\\POCKIT- MON\\First project (1)

- Start the local server (serves static UI and /api endpoints):
  - Default port: `npm run serve`
  - Custom port (Windows PowerShell):
    - `powershell -NoLogo -NoProfile -Command "$env:PORT=5173; npm run serve:win"`
  - Or: `npm run serve:port` after setting %PORT% in CMD

- Health check: GET <http://127.0.0.1:%3CPORT%3E/healthz> should return `{ ok: true }`.

Routes provided by the demo server:

- `GET /healthz` – liveness probe
- `GET /api/paytable` – serves `dist-publish/index.json`
- `POST /api/spin` – math engine spin
- `POST /api/buy` – bonus buy placeholder
- Static frontend at `/` (mapped from `dist-web`)

## Storybook (UI sandbox with addons)

We use Storybook for UI and interaction development with a suite of addons and API mocks, so stories render without a backend.

Run Storybook:

- `npm run storybook` (serves on <http://localhost:6006> by default)

Addons available in the toolbar/panels:

- Themes: Light and Dark (class-based via `body.theme-*`).
- Outline & Measure: layout debugging overlays.
- A11y: accessibility checks inside the canvas.
- Viewport: responsive previews.
- Links & Interactions: navigation and testing utilities.

API mocks via MSW:

- Configured globally in `.storybook/preview.ts` using `msw-storybook-addon`.
- Mocked endpoints: `GET /api/paytable`, `POST /api/spin`, `POST /api/buy`.
- When available, `dist-publish/index.json` is served through Storybook’s static dir at `/publish/index.json` and mirrored by the mock handler.

Static assets in Storybook:

- `.storybook/main.ts` maps:
  - `dist-web` → `/assets`
  - `dist-publish` → `/publish`

Tips:

- If you don’t see assets, run `npm run package:web:prep` first so `dist-web` is populated before starting Storybook.
- Default theme is Dark; use the Themes panel to switch.

## Upgrading Storybook to v9 (optional)

The workspace pins Storybook to v8.6.x-compatible versions to avoid peer conflicts. If you want the latest features:

1. Create a branch:
   - `git checkout -b chore/storybook-v9`
2. Run the upgrade assistant:
   - `npx storybook@latest upgrade`
3. Update devDependencies to `^9` for `storybook`, `@storybook/html-vite`, and installed addons (a11y, interactions, links, measure, outline, themes, viewport).
4. Reinstall deps and start Storybook:
   - `npm install`
   - `npm run storybook`
5. Verify `.storybook/main.ts` keeps `staticDirs` and addon list intact. Keep `msw-storybook-addon` if you rely on the API mocks.

Notes:

- Resolve any peer dependency warnings by aligning addon versions with the Storybook core version.
- If addon APIs change, prefer the official migration notes printed by the upgrade assistant.

## Storybook bundle size and debugging

To keep `storybook-static` smaller in CI and when publishing previews, the configuration in `.storybook/main.ts` conditionally toggles addons based on environment variables:

- `SB_ENABLE_INTERACTIONS=0` disables the Interactions addon in static builds.
- `SB_HEAVY_ADDONS=0` disables heavy addons (a11y, viewport, outline, measure).
- `STORYBOOK_DEV=1` forces dev-style addons regardless of `NODE_ENV`.

Source maps are enabled in the static build via `viteFinal` so that files like `storybook-static/**/manager-bundle.js` can be traced back to their original modules in devtools.

## 🎮 Embedding Pocket Munsters

The project includes two ways to embed the slot game on external websites:

### Option 1: ESM Integration (Full Control)

Use the complete `index.html` when you control the HTML shell:

```html
<!-- Include the full PocketMon Genesis UI -->
<link rel="stylesheet" href="path/to/dist-web/styles.css" />
<link rel="stylesheet" href="path/to/dist-web/ui.css" />
<link rel="stylesheet" href="path/to/dist-web/bg.css" />

<!-- Game HTML (copy from dist-web/index.html) -->
<main class="game-root">
  <canvas id="stage" width="896" height="512"></canvas>
  <!-- ... rest of the game UI ... -->
</main>

<!-- Load as ES module -->
<script type="module" src="path/to/dist-web/app.js"></script>
```

### Option 2: Classic Script Integration (Easy Drop-in)

Use the single-file `embed.js` bundle for easy integration:

```html
<!-- CSS -->
<link rel="stylesheet" href="path/to/dist-web/styles.css" />
<link rel="stylesheet" href="path/to/dist-web/ui.css" />
<link rel="stylesheet" href="path/to/dist-web/bg.css" />

<!-- Game container with canvas -->
<div class="game-container">
  <canvas id="stage" width="896" height="512"></canvas>
</div>

<!-- Single script include -->
<script src="path/to/dist-web/embed.js"></script>
```

**Features:**

- ✅ No module dependencies
- ✅ All-in-one bundle (~52KB)
- ✅ Auto-initializes on DOM ready
- ✅ Works on any website
- ✅ Full game functionality

### Option 3: Container Embed (Shadow DOM) ⭐ Recommended for host pages

Mount the Shadow DOM container bundle for resilient, scoped embedding:

```html
<!-- Single script include (no ESM) -->
<script src="path/to/dist-web/embed.container.js"></script>

<!-- Mount anywhere on the page -->
<div id="game-slot"></div>
<script>
    // Optional: override asset base before mount (also supports ?assets_base= in URL)
    window.PocketMunsters = window.PocketMunsters || {};
    window.PocketMunsters.ASSETS_BASE = 'https://cdn.example.com/path/to/dist-web/';

    // Mount into a selector or HTMLElement; returns { root, host, animator }
    window.PocketMunsters.mount('#game-slot');
    // Later at runtime, you can also update:
    // window.PocketMunsters.setAssetsBase('https://cdn.example.com/path/to/dist-web/');
    console.log('PocketMunsters v', window.PocketMunsters.version);
  }
</script>
```

Notes:

- Shadow DOM isolates styles and markup from the host page.
- Asset base resolution: defaults to the script URL; can be overridden via:
  - Query string: ?assets_base=..., ?assetsBase=..., or ?assets-base=...
  - Global before mount: window.PocketMunsters.ASSETS_BASE = '...';
  - Runtime setter: window.PocketMunsters.setAssetsBase('...');

### API Reference

The embed exposes `window.PocketMunsters`:

```javascript
// Initialize manually (if not auto-initializing)
window.PocketMunsters.init();

// Access the Animator class
const animator = new window.PocketMunsters.Animator(canvas);

// Play sound effects
window.PocketMunsters.sfx.click();
window.PocketMunsters.sfx.spin();
window.PocketMunsters.sfx.win();

// Version info
console.log(window.PocketMunsters.version);
```

### Troubleshooting

**"Unexpected token 'return'" Error:**

- **Cause**: ES module code loaded as classic script
- **Solution**: Use `<script type="module">` for ESM or `embed.js` for classic script

**Game not loading:**

- Ensure all CSS files are included
- Check browser console for errors
- Verify canvas element exists with id="stage"

**Audio not working:**

- Check if Web Audio API is supported
- Ensure user interaction (click) before playing sounds
- Some browsers block autoplay

**Canvas rendering issues:**

- Verify canvas context is available
- Check for WebGL/Canvas support
- Ensure proper dimensions (896x512 recommended)

**Assets not loading on host/CDN:**

- If assets resolve relative to the embed script, ensure the folder structure under dist-web is intact.
- When hosting assets elsewhere, set a base explicitly:
  - URL param: ?assets_base=https://cdn.example.com/path/to/dist-web/
  - OR before mount: window.PocketMunsters.ASSETS_BASE = 'https://cdn.../dist-web/';
  - OR at runtime: window.PocketMunsters.setAssetsBase('https://cdn.../dist-web/');

### Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ⚠️ IE11: Not supported (requires modern JS features)

### Performance Tips

- Serve files from CDN for faster loading
- Enable gzip compression
- Consider lazy loading for mobile
- Monitor bundle size (~52KB for embed.js)

### Testing Your Integration

Use the included test harness:

```bash
# Open the test file in browser
open test-embed.html
```

This provides comprehensive testing of all embed features including:

- Script loading verification
- API availability checks
- Canvas rendering tests
- Audio system validation
- UI controls testing

For host API sanity checks, open the included smoke page:

- stake-smoke.html — a minimal page that mounts the container embed and lets you call /healthz, /api/paytable, and /api/spin against a configurable BASE URL.

### File Structure

```text
dist-web/
├── index.html          # Complete ESM-based UI
├── embed.js           # Single-file classic script bundle ⭐
├── styles.css         # Base styles
├── ui.css            # UI components
├── bg.css            # Background styles
├── app.js            # ESM application logic
├── anim.js           # Animation engine
├── sounds.js         # Audio system
├── symbols.js        # Symbol registry
└── assets/           # Game assets (images, etc.)
```

## 🔊 Audio assets and external sounds

Pocket Munsters includes simple SFX and background music with safe autoplay handling. You can ship sounds inside `dist-web/assets/sounds/` or point the dev server to an external directory on your machine for quick iteration.

### Expected filenames (packaged or external)

Place these files under `assets/sounds/` (packaged) or in your external directory when using the server override:

- Cluster tumble wins.mp3 — first win in a tumble chain
- 2orMoreHits.mp3 — subsequent wins in the same tumble chain
- background.mp3 — looping background music
  - Backwards-compatible: backgound.mp3 (legacy name) is also accepted

Notes:

- Filenames are case-sensitive on some hosts/CDNs; keep them exactly as above.
- The UI starts background music after the first pointer interaction (autoplay policy-safe). Mute toggling will stop the music.
- If MP3s aren’t available, a tiny WebAudio beep fallback plays for SFX.

### Dev server: map external sounds directory

Serve any request to `/assets/sounds/<file>` from a directory of your choice by supplying `--soundsDir` (or `SOUNDS_DIR`). This lets you iterate on MP3s without repackaging.

- Windows PowerShell (env var):

```powershell
$env:SOUNDS_DIR="C:\Users\kevin\Desktop"; npm run serve
```

- Windows PowerShell (CLI arg):

```powershell
npm run serve -- --soundsDir="C:\Users\kevin\Desktop"
```

Security:

- The server sanitizes the requested path and blocks traversal (e.g., `..`). If a file isn’t found in the external directory, it falls back to the packaged file under `dist-web/assets/sounds/`.

### Embeds: asset base and sound resolution

Both classic and container embeds resolve assets relative to an asset base. Sounds are requested under `sounds/` at that base.

Ways to control the base:

- Query string: `?assets_base=https://cdn.example.com/path/to/dist-web/`
- Global before mount: `window.PocketMunsters.ASSETS_BASE = 'https://cdn.example.com/path/to/dist-web/';`
- Container embed runtime setter: `window.PocketMunsters.setAssetsBase('https://cdn.example.com/path/to/dist-web/');`

Example folder layout on CDN:

```text
https://cdn.example.com/path/to/dist-web/
  ├─ embed.container.js
  ├─ embed.js
  ├─ app.js
  ├─ sounds.js
  ├─ assets/
  │   └─ sounds/
  │       ├─ Cluster tumble wins.mp3
  │       ├─ 2orMoreHits.mp3
  │       └─ background.mp3 (or legacy backgound.mp3)
  └─ ...
```

### Default volumes and behavior

- SFX defaults: cluster ≈ 0.75, moreHits ≈ 0.70
- Music default: ≈ 0.25 with ~600ms fade-in on start
- Music only starts after the first pointer/interaction; mute stops the loop immediately.

#### A/B tuning via URL query flags

You can override volumes and animation timings without rebuilding by appending query parameters:

- Audio
  - `clusterVol=0.0..1.0` — cluster win SFX volume
  - `moreHitsVol=0.0..1.0` — subsequent hits SFX volume
  - `musicVol=0.0..1.0` — background music volume
  - `musicFade=ms` — background music fade-in duration in milliseconds

- Animation timings and visuals
  - `gridOpacity=0.0..1.0` — opacity of grid lines
  - `glow=ms` — glow highlight duration
  - `pop=ms` — pop effect duration
  - `popScale=0.0..1.0` — pop scale amplitude (default 0.08)
  - `flash=ms` — screen flash duration
  - `drop=ms` — symbol drop/collapse duration
  - `settle=ms` — pre-spin column settle duration

Example:

```text
http://localhost:5173/?musicVol=0.2&musicFade=400&glow=160&pop=300&popScale=0.1
```

### Quick test

1. Start the server and open the demo UI.
2. Click anywhere to unlock audio; background music should start.
3. Click “Spin” to hear the cluster win sound; when a tumble chain continues, subsequent wins play the “2orMoreHits.mp3” sound.
