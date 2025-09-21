import { mkdirSync, writeFileSync, existsSync, readdirSync, statSync, copyFileSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';

// package_frontend.ts
// Generates a minimal static web UI in dist-web, copies assets, generates symbols.js with dedupe,
// and embeds a CSP-safe app.js that can run fully offline with a demo grid and cell-based wins.

// Build-time version to bust browser caches on local reloads
const VERSION = String(Date.now());

// ---------- Templates ----------
const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>POCKET MUNSTERS</title>
  <link rel="icon" href="data:," />
  <link rel="stylesheet" href="styles.css?v=${VERSION}" />
  <link rel="stylesheet" href="ui.css?v=${VERSION}" />
  <link rel="stylesheet" href="bg.css?v=${VERSION}" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'" />
  <meta name="description" content="POCKET MUNSTERS minimal frontend for Stake engine" />
  <meta name="robots" content="noindex,nofollow" />
  <meta http-equiv="X-Content-Type-Options" content="nosniff" />
  <meta http-equiv="Referrer-Policy" content="no-referrer" />
</head>
<body>
  <header class="topbar">
    <nav class="nav">
      <button class="nav-btn" data-link="home" aria-label="Home">Home</button>
      <button class="nav-btn" data-link="reddit" aria-label="Reddit">Reddit</button>
      <button class="nav-btn" data-link="forum" aria-label="Forum">Forum</button>
      <button class="nav-btn" data-link="discord" aria-label="Discord">Discord</button>
    </nav>
    <div class="user-menu">
      <button id="userMenuBtn" class="nav-btn" aria-haspopup="menu" aria-expanded="false">Open user menu</button>
      <div id="userMenu" class="menu" role="menu" hidden>
        <button role="menuitem">User</button>
      </div>
    </div>
  </header>
  <main id="app" class="game-root">
    <div id="loader" class="loader" aria-hidden="true" hidden>
      <div class="spinner"></div>
      <div class="label">Loading…</div>
    </div>
    <section class="game-stage" aria-label="Game stage">
      <canvas id="stage" width="896" height="512" aria-label="Game canvas"></canvas>
      <div id="overlay" class="stage-overlay" aria-hidden="true"></div>
    </section>
    <aside class="hud" aria-label="Game HUD">
      <div class="hud-row">
        <div class="stat"><span>Balance</span><strong id="balance">$1,000.00</strong></div>
        <div class="stat"><span>Bet</span>
          <div class="bet-ctrl">
            <button id="betDec" class="btn sm" aria-label="Decrease bet">−</button>
            <input id="bet" type="number" min="1" step="1" value="1" inputmode="numeric" />
            <button id="betInc" class="btn sm" aria-label="Increase bet">+</button>
          </div>
        </div>
        <div class="stat"><span>Win</span><strong id="win">$0.00</strong></div>
        <div class="stat"><span>Currency</span>
          <select id="currencySel" class="sel" aria-label="Currency">
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="JPY">JPY</option>
            <option value="BRL">BRL</option>
            <option value="INR">INR</option>
          </select>
        </div>
        <div class="stat"><span>Language</span>
          <select id="langSel" class="sel" aria-label="Language">
            <option value="en">English</option>
          </select>
        </div>
        <div class="spacer"></div>
        <div class="controls">
          <button id="rulesBtn" class="btn ghost">Rules</button>
          <button id="paytableBtn" class="btn ghost">Paytable</button>
          <button id="muteBtn" class="btn ghost" aria-pressed="false">🔊</button>
          <button id="autoBtn" class="btn ghost" aria-pressed="false" title="Autoplay (asks to confirm)">Auto</button>
          <button id="spinBtn" class="btn primary" title="Spacebar to spin">Spin</button>
        </div>
      </div>
    </aside>
    <section id="messages" class="messages" aria-live="polite" aria-atomic="true"></section>
  </main>

  <dialog id="confirmAuto" class="modal">
    <form method="dialog">
      <h2>Enable Autoplay?</h2>
      <p>Autoplay will place spins consecutively until stopped.</p>
      <menu>
        <button value="cancel" class="btn ghost">Cancel</button>
        <button value="ok" class="btn primary">Enable</button>
      </menu>
    </form>
  </dialog>
  <dialog id="rulesModal" class="modal">
    <form method="dialog">
      <h2>Game Rules</h2>
      <div id="rulesBody" class="modal-body"></div>
      <menu>
        <button value="close" class="btn primary">Close</button>
      </menu>
    </form>
  </dialog>
  <dialog id="paytableModal" class="modal">
    <form method="dialog">
      <h2>Paytable</h2>
      <div id="paytableBody" class="modal-body"></div>
      <menu>
        <button value="close" class="btn primary">Close</button>
      </menu>
    </form>
  </dialog>

  <script src="guard.js?v=${VERSION}"></script>
  <script type="module" src="format.js?v=${VERSION}"></script>
  <script type="module" src="sounds.js?v=${VERSION}"></script>
    <script type="module" src="symbols.js?v=${VERSION}"></script>
  <script type="module" src="anim.js?v=${VERSION}"></script>
  <script type="module" src="app.js?v=${VERSION}"></script>
</body>
</html>`;

const stylesCss = `:root{color-scheme:dark light}
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;display:grid;min-height:100dvh;place-items:center;background:#0b0f14;color:#e6edf3}
main{padding:2rem;max-width:800px;width:100%}
h1{font-size:1.5rem;margin:0 0 1rem}
.panel{background:#111827;border:1px solid #1f2937;border-radius:12px;padding:1rem}
.form{display:flex;gap:1rem;align-items:flex-end;flex-wrap:wrap}
.field{display:flex;flex-direction:column;gap:.25rem}
label{font-size:.85rem;color:#9ca3af}
input{background:#0b1220;color:#e6edf3;border:1px solid #1f2937;border-radius:8px;padding:.5rem .6rem;min-width:6rem}
.actions{display:flex;gap:.5rem}
.btn{background:#2563eb;color:white;border:none;border-radius:8px;padding:.6rem 1rem;cursor:pointer}
.btn:hover{background:#1d4ed8}
.output{margin-top:1rem;white-space:pre-wrap;word-break:break-word;background:#0b1220;border:1px solid #1f2937;border-radius:8px;padding:.75rem;min-height:3rem}
`;
const uiCss = `/* layout */
html,body{height:100%}
.topbar{position:fixed;inset:0 0 auto 0;display:flex;justify-content:space-between;align-items:center;gap:.5rem;padding:.5rem 1rem;background:rgba(10,16,24,.6);backdrop-filter:blur(6px);border-bottom:1px solid #1f2937}
.nav{display:flex;gap:.5rem;flex-wrap:wrap}
.nav-btn{background:#0b1220;border:1px solid #1f2937;color:#e6edf3;border-radius:8px;padding:.4rem .7rem;cursor:pointer}
.nav-btn:hover{background:#111827}
.user-menu{position:relative}
.menu{position:absolute;right:0;top:calc(100% + .25rem);background:#0b1220;border:1px solid #1f2937;border-radius:8px;display:flex;flex-direction:column;min-width:200px;z-index:10}
.menu>button{background:transparent;color:#e6edf3;border:0;text-align:left;padding:.6rem .8rem;cursor:pointer}
.menu>button:hover{background:#111827}
.game-root{position:relative;display:grid;grid-template-rows:1fr auto;gap:1rem;width:100%;height:100%;padding:3.25rem 1rem 1rem}
.game-stage{place-self:center;display:grid;place-items:center;width:min(96vw,1100px);aspect-ratio:16/9;background:transparent;border:1px solid rgba(255,255,255,.15);border-radius:16px;overflow:hidden;position:relative}
canvas#stage{width:100%;height:100%;image-rendering:pixelated}
.stage-overlay{position:absolute;inset:0;pointer-events:none;z-index:5}
.hud{position:relative;place-self:stretch;background:rgba(10,16,24,.65);backdrop-filter:blur(6px);border:1px solid #1f2937;border-radius:12px;padding:.5rem .75rem}
.hud-row{display:flex;gap:1rem;align-items:center;flex-wrap:wrap}
.stat{display:flex;align-items:center;gap:.5rem}
.stat>span{color:#9ca3af;font-size:.85rem}
.stat>strong{font-variant-numeric:tabular-nums}
.bet-ctrl{display:flex;align-items:center;gap:.25rem}
.sel{background:#0b1220;color:#e6edf3;border:1px solid #1f2937;border-radius:8px;padding:.35rem .6rem}
.btn.sm{padding:.3rem .6rem}
.btn.ghost{background:#0b1220}
.btn.primary{background:#2563eb}
.btn.primary:hover{background:#1d4ed8}
.spacer{flex:1 1 auto}
.messages{position:fixed;right:1rem;bottom:1rem;display:flex;flex-direction:column;gap:.5rem;z-index:20}
.msg{background:#111827;border:1px solid #1f2937;border-radius:10px;padding:.5rem .75rem;opacity:.96}
.loader{position:absolute;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.25);backdrop-filter:blur(4px)}
.loader[aria-hidden="true"]{display:none}
.spinner{width:40px;height:40px;border-radius:999px;border:4px solid rgba(255,255,255,.2);border-top-color:#fff;animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.pop{animation:pop .6s ease-out both}
@keyframes pop{0%{opacity:0;transform:scale(.6)}40%{opacity:1;transform:scale(1.1)}100%{opacity:0;transform:scale(1)}}
.modal{max-width:min(800px,94vw);border:1px solid #1f2937;background:#0b1220;color:#e6edf3;border-radius:12px}
.modal-body{max-height:min(60vh,600px);overflow:auto}
.modal::backdrop{background:rgba(0,0,0,.5)}
table{width:100%;border-collapse:collapse}
th,td{border:1px solid #1f2937;padding:.4rem .5rem}
thead th{background:#0f172a}
`;
  // Optional background stylesheet; will be overwritten if FRONT_BG is not provided
const bgCssTemplate = (bgPathRel: string) => `/* auto-generated background */
html,body{height:100%}
body{background:#0b0f14 url('${bgPathRel.replace(/\\/g,'/')}') center center / cover no-repeat fixed}
/* Stage inherits transparency so the grid/board is a clear overlay over the wallpaper */
.game-stage{background:transparent}
`;

  // Heuristic: find a likely background image within dist-web/assets if one isn't explicitly provided
function findLikelyBackground(distWebDir: string): string | null {
    try {
      const assetsDir = resolve(distWebDir, 'assets');
      if (!existsSync(assetsDir)) return null;
      const candidates: { path: string; score: number; size: number }[] = [];
      const walk = (dir: string) => {
        for (const name of readdirSync(dir)) {
          const p = resolve(dir, name);
          const st = statSync(p);
          if (st.isDirectory()) walk(p);
          else {
            const lower = name.toLowerCase();
            if (/\.(png|jpe?g|webp|svg)$/i.test(lower)) {
              // Prefer names that look like background images
              let score = 0;
              // Hard preference for arena background filenames
              if (/(^|[^a-z])a-pokemon-arena-background(\.[a-z0-9]+)?$/i.test(lower) || /a-pokemon-arena-background/i.test(lower)) score += 100;
              if (/wallpaper/.test(lower)) score += 10; // highest priority
              if (/(bg|background|cover|hero|wall|stage)/.test(lower)) score += 5;
              if (/cover/.test(lower)) score += 2;
              if (/hero/.test(lower)) score += 2;
              if (/background|bg/.test(lower)) score += 3;
              if (/(^|[^a-z])wall([^a-z]|$)/.test(lower)) score += 1;
              // Prefer raster over svg for full-bleed backgrounds
              if (/\.webp$/.test(lower)) score += 3; else if (/\.jpe?g$/.test(lower)) score += 2; else if (/\.png$/.test(lower)) score += 1;
              candidates.push({ path: p, score, size: st.size });
            }
          }
        }
      };
      walk(assetsDir);
      if (!candidates.length) return null;
      // Pick by highest score, tie-breaker by size
      candidates.sort((a,b)=> (b.score - a.score) || (b.size - a.size));
      const best = candidates[0];
      const rel = best.path.substring(distWebDir.length + 1).replace(/\\/g,'/');
      return rel;
    } catch { return null; }
  }

const guardJs = "/* Minimal runtime network guard (ES5). Active only on localhost/file to avoid interfering with CDN. */\n" +
`(function(){\n` +
`  function isAbsolute(url){\n` +
`    return /^https?:\\/\\//i.test(String(url));\n` +
`  }\n` +
`  function sameOrigin(url){\n` +
`    try {\n` +
`      var a = document.createElement('a'); a.href = url;\n` +
`      var b = document.createElement('a'); b.href = window.location.href;\n` +
`      return (a.protocol === b.protocol) && (a.host === b.host);\n` +
`    } catch (e) { return false; }\n` +
`  }\n` +
`  var host = (window.location && window.location.hostname) || '';\n` +
`  var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '' ;\n` +
`  if (!isLocal) { return; }\n` +
`  if (typeof window.fetch === 'function') {\n` +
`    var origFetch = window.fetch;\n` +
`    window.fetch = function(input, init){\n` +
`      var url = (typeof input === 'string') ? input : (input && input.url);\n` +
`      if (url && isAbsolute(url) && !sameOrigin(url)) {\n` +
`        if (window.console && console.warn) console.warn('[networkGuard] blocked fetch to', url);\n` +
`        return Promise.reject(new Error('External network blocked by guard'));\n` +
`      }\n` +
`      return origFetch.apply(this, arguments);\n` +
`    };\n` +
`  }\n` +
`  if (typeof window.XMLHttpRequest === 'function') {\n` +
`    var OrigXHR = window.XMLHttpRequest;\n` +
`    var open = OrigXHR.prototype.open;\n` +
`    OrigXHR.prototype.open = function(method, url, async){\n` +
`      try {\n` +
`        if (url && isAbsolute(url) && !sameOrigin(url)) {\n` +
`          if (window.console && console.warn) console.warn('[networkGuard] blocked XHR to', url);\n` +
`          throw new Error('External network blocked by guard');\n` +
`        }\n` +
`      } catch (e) { if (window.console && console.error) console.error(e); throw e; }\n` +
`      return open.apply(this, arguments);\n` +
`    };\n` +
`  }\n` +
`})();\n`;

const formatJs = `// format.js - query, currency, and RGS helpers
export function getQuery(){
  const q = new URLSearchParams(location.search);
  const obj = Object.create(null);
  for (const [k,v] of q) obj[k] = v; return obj;
}
export function pickBaseUrl(){
  const q = getQuery();
  const rgs = q.rgs_url; // Stake RGS param
  if (rgs && /^https?:\\/\\//i.test(rgs)) return rgs.replace(/\\/$/,'');
  return '';
}
export const languages = {
  ar:{name:'Arabic',t:(s)=>s},de:{name:'German',t:(s)=>s},en:{name:'English',t:(s)=>s},es:{name:'Spanish',t:(s)=>s},fi:{name:'Finnish',t:(s)=>s},fr:{name:'French',t:(s)=>s},hi:{name:'Hindi',t:(s)=>s},id:{name:'Indonesian',t:(s)=>s},ja:{name:'Japanese',t:(s)=>s},ko:{name:'Korean',t:(s)=>s},pl:{name:'Polish',t:(s)=>s},pt:{name:'Portuguese',t:(s)=>s},ru:{name:'Russian',t:(s)=>s},tr:{name:'Turkish',t:(s)=>s},vi:{name:'Vietnamese',t:(s)=>s},zh:{name:'Chinese',t:(s)=>s}
};
export const supportedCurrencies = ['USD','CAD','JPY','EUR','RUB','CNY','PHP','INR','IDR','KRW','BRL','MXN','DKK','PLN','VND','TRY','CLP','ARS','PEN','XGC','XSC'];
export const CurrencyMeta = {
  USD:{symbol:'$',decimals:2}, CAD:{symbol:'CA$',decimals:2}, JPY:{symbol:'¥',decimals:0}, EUR:{symbol:'€',decimals:2}, RUB:{symbol:'₽',decimals:2}, CNY:{symbol:'CN¥',decimals:2}, PHP:{symbol:'₱',decimals:2}, INR:{symbol:'₹',decimals:2}, IDR:{symbol:'Rp',decimals:0}, KRW:{symbol:'₩',decimals:0}, BRL:{symbol:'R$',decimals:2}, MXN:{symbol:'MX$',decimals:2}, DKK:{symbol:'KR',decimals:2,symbolAfter:true}, PLN:{symbol:'zł',decimals:2,symbolAfter:true}, VND:{symbol:'₫',decimals:0,symbolAfter:true}, TRY:{symbol:'₺',decimals:2}, CLP:{symbol:'CLP',decimals:0,symbolAfter:true}, ARS:{symbol:'ARS',decimals:2,symbolAfter:true}, PEN:{symbol:'S/',decimals:2,symbolAfter:true}, XGC:{symbol:'GC',decimals:2}, XSC:{symbol:'SC',decimals:2}
};
export const MICRO = 1000000;
export function microToNumber(m){ return (Number(m)||0) / MICRO; }
export function numberToMicro(n){ return Math.round((Number(n)||0) * MICRO); }
export function formatCurrencyMicro(amountMicro, currency='USD'){
  const meta = CurrencyMeta[currency] || { symbol: currency, decimals: 2, symbolAfter: true };
  const n = microToNumber(amountMicro);
  const fixed = n.toFixed(meta.decimals);
  return meta.symbolAfter ? (fixed + ' ' + (meta.symbol||'')) : ((meta.symbol||'') + fixed);
}
export function formatAmount(x, currency='USD'){
  const meta = CurrencyMeta[currency] || CurrencyMeta.USD;
  const n = Number(x)||0;
  const fixed = n.toFixed(meta.decimals);
  return meta.symbolAfter ? (fixed + ' ' + (meta.symbol||'')) : ((meta.symbol||'') + fixed);
}
`;

const soundsJs = `// sounds.js - simple WebAudio with oscillators
const ctx = new (window.AudioContext||window.webkitAudioContext)();
let muted = false; let unlocked = false;
function unlock(){ if (!unlocked){ const b = ctx.createBuffer(1,1,22050); const src = ctx.createBufferSource(); src.buffer=b; src.connect(ctx.destination); try{ src.start(0); }catch{} unlocked=true; } }
export function setMuted(v){ muted = !!v; }
export function isMuted(){ return muted; }
export function resume(){ if (ctx.state==='suspended') ctx.resume(); unlock(); }
function beep(freq=880, dur=0.12, type='sine', gain=0.03){ if (muted) return; const o=ctx.createOscillator(); const g=ctx.createGain(); o.type=type; o.frequency.value=freq; g.gain.value=gain; o.connect(g); g.connect(ctx.destination); const t=ctx.currentTime; o.start(t); o.stop(t+dur); }
export const sfx = {
  click(){ beep(600, .06, 'square', .04); },
  spin(){ beep(440, .08, 'sawtooth', .03); },
  tick(){ beep(880, .04, 'triangle', .02); },
  win(){ beep(1320, .18, 'square', .05); setTimeout(()=>beep(1760,.18,'square',.05), 120); },
  bigWin(){ beep(880,.2,'sawtooth',.06); setTimeout(()=>beep(1320,.2,'sawtooth',.06),160); setTimeout(()=>beep(1760,.25,'sawtooth',.06),320); },
};
window.__SOUNDS__ = { setMuted, isMuted, resume, sfx };
`;

const animJs = `// anim.js - minimal synced animation runner for engine events (with tumble animations)
import { sfx } from './sounds.js';
import { randomSymbol, popSymbol, popSymbolAt, spriteFor, pathFor } from './symbols.js';
export class Animator {
  constructor(canvas){ this.canvas = canvas; this.ctx = canvas.getContext('2d',{alpha:true}); this.width=canvas.width; this.height=canvas.height; this.queue=[]; this.running=false; this._imgCache=new Map(); this.enablePreSpin=false; this.currentGrid=null; this._board=null; }
  enqueue(events, result){ this.queue.push({ events, result }); if (!this.running) this.run(); }
  clear(){ const c=this.ctx; c.clearRect(0,0,this.width,this.height); }
  drawLabel(text, y){ const c=this.ctx; c.save(); c.font='700 24px system-ui'; c.fillStyle='rgba(0,0,0,.45)'; const w=c.measureText(text).width+16; c.fillRect(16,y-28, w, 36); c.fillStyle='#fff'; c.fillText(text, 24, y); c.restore(); }
  // Draw grid inside an inset "board" rectangle - transparent overlay for symbols
  drawGridBoard(cols=6, rows=5){ const c=this.ctx; const insetX = Math.round(this.width*0.14); const insetY = Math.round(this.height*0.14); const boardW = this.width - insetX*2; const boardH = this.height - insetY*2; c.save(); c.strokeStyle='rgba(255,255,255,.25)'; c.lineWidth=1; const cw=boardW/cols, rh=boardH/rows; for (let i=1;i<cols;i++){ c.beginPath(); c.moveTo(insetX + i*cw, insetY); c.lineTo(insetX + i*cw, insetY + boardH); c.stroke(); } for (let j=1;j<rows;j++){ c.beginPath(); c.moveTo(insetX, insetY + j*rh); c.lineTo(insetX + boardW, insetY + j*rh); c.stroke(); } c.restore(); this._board = { insetX, insetY, boardW, boardH, cw, rh }; return this._board; }
  _loadImage(src){ return new Promise((res,rej)=>{ if (!src) return res(null); if (this._imgCache.has(src)) return res(this._imgCache.get(src)); const img=new Image(); img.onload=()=>{ this._imgCache.set(src,img); res(img); }; img.onerror=()=>res(null); img.src=src; }); }
  // Build and keep a drawable grid state from a result.grid
  _initGridFromResult(result){ const { cols, rows } = getGridSize(result); const g = []; for (let r=0;r<rows;r++){ const row=[]; for (let c=0;c<cols;c++){ const cell = (Array.isArray(result.grid) && result.grid[r] && result.grid[r][c]) || null; const id = cell && (cell.id || cell.symbol || cell.name) || null; row.push(id? { id, path: pathFor(id), alpha: 1, yOff: 0 }: null); } g.push(row); } this.currentGrid = { cols, rows, cells: g }; return this.currentGrid; }
  async _drawCurrentGrid(){ if (!this.currentGrid || !this._board) return; const c=this.ctx; const { cols, rows, cells } = this.currentGrid; const { insetX, insetY, cw, rh } = this._board; for (let r=0;r<rows;r++){ for (let col=0; col<cols; col++){ const node = cells[r][col]; if (!node || !node.path) continue; const img = await this._loadImage(node.path); if (!img) continue; const x0 = insetX + col*cw; const y0 = insetY + r*rh; const w=cw; const h=rh; const scale = Math.min(w/img.width, h/img.height)*0.9; const dw = img.width*scale; const dh = img.height*scale; const dx = x0 + (w-dw)/2; const dy = y0 + (h-dh)/2 + (node.yOff||0); if (node.alpha!=null && node.alpha<1){ c.save(); c.globalAlpha = Math.max(0, Math.min(1, node.alpha)); c.drawImage(img, dx, dy, dw, dh); c.restore(); } else { c.drawImage(img, dx, dy, dw, dh); } } } }
  async _redrawAll(){ if (!this._board || !this.currentGrid) return; this.clear(); this.drawGridBoard(this.currentGrid.cols, this.currentGrid.rows); await this._drawCurrentGrid(); }
  flash(color='rgba(0,255,128,.18)', ms=140){ const c=this.ctx; c.save(); c.fillStyle=color; c.fillRect(0,0,this.width,this.height); c.restore(); return wait(ms); }
  async run(){ this.running=true; while(this.queue.length){ const { events, result } = this.queue.shift(); await this.play(events, result); } this.running=false; }
  // Animation helpers
  async _explode(positions, ms=220){ if (!this.currentGrid) return; const pos = normalizePositions(positions); const start = performance.now(); const step = async (t) => { const p = Math.min(1, (t-start)/ms); for (const {row,col} of pos){ const node = (this.currentGrid.cells[row] && this.currentGrid.cells[row][col]) || null; if (node) node.alpha = 1 - p; } await this._redrawAll(); if (p<1) requestAnimationFrame(step); }; await new Promise(r=>{ requestAnimationFrame(async t=>{ await step(t); r(null); }); }); // clear
    for (const {row,col} of pos){ if (this.currentGrid.cells[row]) this.currentGrid.cells[row][col] = null; }
    sfx.tick();
  }
  async _collapseAndRefill(payload){ if (!this.currentGrid) return; const { cols, rows, cells } = this.currentGrid; // compute new layout after collapse
    const startPositions = []; const endPositions = [];
    for (let col=0; col<cols; col++){
      const stack = [];
      for (let r=rows-1; r>=0; r--){ const node = cells[r][col]; if (node && node.alpha!==0) stack.push({ node, fromR: r }); }
      // write back from bottom up
      let rPtr = rows-1;
      for (const item of stack){ const node = item.node; if (cells[rPtr][col] !== node){ startPositions.push({ node, fromR: item.fromR, fromC: col }); endPositions.push({ node, toR: rPtr, toC: col }); }
        cells[rPtr][col] = node; rPtr--; }
      // fill remaining with new symbols (falling from above)
      while (rPtr>=0){ const newSym = pickRefillSymbol(payload, col, rPtr); cells[rPtr][col] = { id: newSym.id, path: newSym.path, alpha: 1, yOff: -((rPtr+1)*this._board.rh + Math.random()*this._board.rh*0.5) }; // start above
        startPositions.push({ node: cells[rPtr][col], fromR: -1, fromC: col }); endPositions.push({ node: cells[rPtr][col], toR: rPtr, toC: col }); rPtr--; }
    }
    // animate drop to target rows
    const dropMs = 280; const start = performance.now();
    const step = async (t) => { const p = easeOutCubic(Math.min(1, (t-start)/dropMs)); for (let i=0;i<endPositions.length;i++){ const ep = endPositions[i]; const node = ep.node; const targetY = (ep.toR)*this._board.rh; const fromY = (startPositions[i].fromR<0) ? node.yOff : (startPositions[i].fromR)*this._board.rh; const baseY = fromY + (targetY - fromY) * p; // translate into yOff relative to toR
        node.yOff = baseY - (ep.toR*this._board.rh); node.alpha = 1; }
      await this._redrawAll(); if (p<1) requestAnimationFrame(step); };
    await new Promise(r=>{ requestAnimationFrame(async t=>{ await step(t); r(null); }); });
    // finalize positions
    for (const { node, toR, toC } of endPositions){ node.yOff = 0; }
    sfx.tick();
  }
  async play(events, result){ const { cols, rows } = getGridSize(result); const board = this.drawGridBoard(cols, rows); this._initGridFromResult(result); await this._redrawAll(); this.drawLabel('Spin start', 40); sfx.spin();
    // Optional: short pre-spin column cycling to convey motion (disabled by default)
    if (this.enablePreSpin) {
      try {
        const cycles = 8; // total frames
        for (let t=0; t<cycles; t++){
          this.clear(); this.drawGridBoard(cols, rows);
          for (let col=0; col<cols; col++){
            for (let r=0; r<rows; r++){
              const path = pathFor('t'+(((t + r + col) % 5)+1));
              const img = await this._loadImage(path);
              if (!img) continue;
              const x0 = board.insetX + col*board.cw; const y0 = board.insetY + r*board.rh; const w = board.cw; const h = board.rh;
              const scale = Math.min(w/img.width, h/img.height)*0.9; const dw = img.width*scale; const dh = img.height*scale; const dx = x0 + (w-dw)/2; const dy = y0 + (h-dh)/2;
              this.ctx.drawImage(img, dx, dy, dw, dh);
            }
          }
          await wait(40);
        }
      } catch {}
      await wait(60);
    }
    // process events with tumble support
    let pendingExplodePos = null;
    for (const e of events||[]){
      if (e.type==='win'){
        await this._redrawAll(); this.drawLabel('Win x'+(e.payload&&e.payload.winAmount||0), 80); await this.flash('rgba(255,215,0,.22)', 180); sfx.win(); const sid = (e.payload&&e.payload.symbol&&e.payload.symbol.id)||null; const sym = sid? spriteFor(sid): null; const posRaw = (e && e.payload && (e.payload.positions || e.payload.cells)) || []; const arr = Array.isArray(posRaw)? posRaw: [];
        if (arr.length){ const count = Math.min(8, arr.length); for (let i=0;i<count;i++){ const p=arr[i]; let col, row; if (Array.isArray(p)) { row=p[0]; col=p[1]; } else if (p && typeof p==='object') { row=(p.row ?? p.y ?? p.r ?? 0); col=(p.col ?? p.x ?? p.c ?? 0); } else { row=0; col=0; } const xPctCanvas = (board.insetX + (Number(col)+0.5)*(board.boardW/cols)) / this.width; const yPctCanvas = (board.insetY + (Number(row)+0.5)*(board.boardH/rows)) / this.height; const path = sym&&sym.path ? sym.path : (randomSymbol()?.path||''); if (path) popSymbolAt(path, xPctCanvas, yPctCanvas, 700); } }
        pendingExplodePos = arr; await wait(120);
      }
      else if (e.type==='tumbleInit' || e.type==='cascadeStart'){ await this._redrawAll(); this.drawLabel('Tumble', 120); sfx.tick(); await wait(80); }
      else if (e.type==='tumbleExplode'){
        const pos = (e && e.payload && (e.payload.positions || e.payload.cells)) || pendingExplodePos || [];
        await this._explode(pos, 220);
      }
      else if (e.type==='tumbleSlide' || e.type==='tumbleRefill'){
        await this._collapseAndRefill(e && e.payload);
      }
      else if (e.type==='masterBall' || e.type==='wildInject'){ await this._redrawAll(); this.drawLabel(e.type, 160); sfx.tick(); await wait(180); }
    }
    // If we saw a win but no explicit tumble events, simulate one basic tumble cycle
    if (pendingExplodePos && (!events || !events.some(ev=>/^tumble/i.test(ev.type)))){
      await this._explode(pendingExplodePos, 220);
      await this._collapseAndRefill(null);
    }
    await this._redrawAll(); if ((result&&result.totalWinX||0) >= 1000){ sfx.bigWin(); }
  }
}
function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }
function getGridSize(result){
  let cols=6, rows=5;
  try {
    const g = result && result.grid;
    if (Array.isArray(g)) {
      const rCount = g.length;
      const cCount = Array.isArray(g[0]) ? g[0].length : 0;
      if (rCount && cCount) { rows = rCount; cols = cCount; }
    } else if (g && typeof g==='object') {
      cols = Number(g.cols ?? g.width ?? cols) || cols;
      rows = Number(g.rows ?? g.height ?? rows) || rows;
    }
  } catch {}
  return { cols, rows };
}
function normalizePositions(pos){ const arr = Array.isArray(pos)? pos: []; const out=[]; for (const p of arr){ if (Array.isArray(p)){ out.push({ row: Number(p[0])||0, col: Number(p[1])||0 }); } else if (p && typeof p==='object'){ out.push({ row: Number(p.row ?? p.y ?? p.r ?? 0)||0, col: Number(p.col ?? p.x ?? p.c ?? 0)||0 }); } } return out; }
function easeOutCubic(x){ return 1 - Math.pow(1 - x, 3); }
function pickRefillSymbol(payload, col, row){ try { const list = (payload && (payload.refills || payload.newSymbols)) || null; if (Array.isArray(list) && list.length){ const found = list.find(s=>{ const sc = (s.col ?? s.x ?? s.c); const sr = (s.row ?? s.y ?? s.r); return (sc===col && (sr===row || sr==null)); }); if (found){ const id = found.id || found.symbol || found.name; const p = pathFor(id); if (p) return { id, path: p }; } }
  } catch {}
  const any = randomSymbol(); return any? { id: any.id || 'sym', path: any.path }: { id: 'sym', path: '' };
}
`;

// Generate a symbols.js module by scanning dist-web/assets for image files
function generateSymbolsModule(baseDir: string): string {
    const assetsDir = resolve(baseDir, 'assets');
    const outPath = resolve(baseDir, 'symbols.js');
    function walk(dir: string): string[] {
      const out: string[] = [];
      if (!existsSync(dir)) return out;
      for (const name of readdirSync(dir)) {
        const p = resolve(dir, name);
        const st = statSync(p);
        if (st.isDirectory()) out.push(...walk(p));
        else out.push(p);
      }
      return out;
    }
  function classifyTier(p: string): number {
      const s = p.replace(/\\/g,'/').toLowerCase();
      // direct tier hints
      const m = s.match(/(?:^|[\/_-])(?:tier|t)[ _-]?([1-5])(?!\d)/);
      if (m) return Math.min(5, Math.max(1, parseInt(m[1],10)||1));
      if (/(legend|mythic|boss|master)/.test(s)) return 5;
      if (/(epic|ultra)/.test(s)) return 4;
      if (/(rare)/.test(s)) return 3;
      if (/(uncommon)/.test(s)) return 2;
      if (/(common)/.test(s)) return 1;
      // fallback: try to infer from any digit 1-5 near separators
      const m2 = s.match(/(?:^|[\/_-])([1-5])(?!\d)(?:[^\d]|$)/);
      if (m2) return Math.min(5, Math.max(1, parseInt(m2[1],10)||1));
      return 1;
    }
  try {
      const files = walk(assetsDir)
        .filter(f=>/\.(svg|png|webp|jpg|jpeg)$/i.test(f))
        .filter(f=>{ const low=f.replace(/\\/g,'/').toLowerCase(); if (/a-pokemon-arena-background\.(?:svg|png|webp|jpe?g)$/.test(low)) return false; if (/\/(?:bg|background)\.(?:svg|png|webp|jpe?g)$/.test(low)) return false; if (/\/cover\.(?:svg|png|webp|jpe?g)$/.test(low)) return false; return true; });
      function extPriority(ext: string){ switch(String(ext||'').toLowerCase()){ case 'png': return 5; case 'webp': return 4; case 'jpg': case 'jpeg': return 3; case 'svg': return 2; default: return 1; } }
      type Asset = { id: string, path: string, type: string, name: string, tier: number };
      const bestById: Record<string, Asset> = Object.create(null);
      for (const fsPath of files) {
        const rel = fsPath.substring(baseDir.length+1).replace(/\\/g,'/');
        const webPath = rel; // served from dist-web
        const ext = (fsPath.split('.').pop()||'').toLowerCase();
        const name = fsPath.split(/[/\\]/).pop() || '';
        const id = name.replace(/\.[^.]+$/,'');
        const tier = classifyTier(fsPath);
        const key = id.toLowerCase();
        const cand: Asset = { id, path: webPath, type: ext, name, tier };
        const prev = bestById[key];
        if (!prev || extPriority(cand.type) > extPriority(prev.type)) {
          bestById[key] = cand;
        }
      }
      const tiers: Record<number, { id: string, path: string, type: string, name: string }[]> = { 1:[],2:[],3:[],4:[],5:[] } as any;
      for (const key of Object.keys(bestById)) {
        const a = bestById[key];
        const t = Math.min(5, Math.max(1, Number(a.tier)||1));
        tiers[t].push({ id: a.id, path: a.path, type: a.type, name: a.name });
      }
      const total = (tiers[1].length+tiers[2].length+tiers[3].length+tiers[4].length+tiers[5].length);
      const json = JSON.stringify(tiers, null, 2);
      const content = `// Auto-generated by package_frontend.ts
export const registry = { tiers: ${json}, total: ${total} };
export function byTier(t){ return (registry.tiers[String(t)]||registry.tiers[t]||[]); }
export function allAssets(){ return ([]).concat(registry.tiers[1]||[], registry.tiers[2]||[], registry.tiers[3]||[], registry.tiers[4]||[], registry.tiers[5]||[]); }
export function randomSymbol(t){ const arr = t? byTier(t): allAssets(); if (!arr.length) return null; return arr[Math.floor(Math.random()*arr.length)]; }
export function popSymbol(imgPath, ms=600){ const o = document.getElementById('overlay'); if (!o) return; const img = document.createElement('img'); img.src = imgPath; img.alt = 'symbol'; img.className = 'pop'; img.style.position='absolute'; img.style.left='50%'; img.style.top='50%'; img.style.transform='translate(-50%, -50%)'; img.style.maxWidth='40%'; img.style.maxHeight='70%'; o.appendChild(img); setTimeout(()=> img.remove(), ms); }
export function popSymbolAt(imgPath, xPct, yPct, ms=600){ const o = document.getElementById('overlay'); if (!o) return; const img = document.createElement('img'); img.src = imgPath; img.alt = 'symbol'; img.className = 'pop'; img.style.position='absolute'; img.style.left=(xPct*100)+'%'; img.style.top=(yPct*100)+'%'; img.style.transform='translate(-50%, -50%)'; img.style.maxWidth='40%'; img.style.maxHeight='70%'; o.appendChild(img); setTimeout(()=> img.remove(), ms); }
// Heuristic mapping from engine symbol ids to available assets
export const engineTierMap = { pikachu:1, charizard:2, squirtle:3, bulbasaur:4, jigglypuff:5, eevee:5, mew:5, snorlax:5 };
const aliasMap = { freespins: ['free spins','freespins','free-spins','scatter'], wild: ['multi','multiplier','x'], pokeball: ['pokeball','poke ball'], masterball: ['master ball','masterball'] };
function extPriority(ext){ switch(String(ext||'').toLowerCase()){ case 'png': return 5; case 'webp': return 4; case 'jpg': case 'jpeg': return 3; case 'svg': return 2; default: return 1; } }
function pickBest(candidates){ if (!candidates || !candidates.length) return null; let best = candidates[0]; let bestScore = extPriority(best.type); for (const c of candidates){ const s = extPriority(c.type); if (s>bestScore){ best = c; bestScore = s; } } return best; }
function findAssetsByExactId(id){ const low = String(id||'').toLowerCase(); return allAssets().filter(a=> String(a.id||'').toLowerCase() === low); }
function findAssetsByLooseMatch(id){ const low = String(id||'').toLowerCase(); return allAssets().filter(a=> String(a.id||'').toLowerCase().includes(low)); }
export function pathFor(symbolId){ const id = String(symbolId||'').toLowerCase(); let found = pickBest(findAssetsByExactId(id)); if (found) return found.path; const aliases = aliasMap[id]; if (aliases){ for (const alt of aliases){ const f = pickBest(findAssetsByLooseMatch(alt)); if (f) return f.path; } } const t = engineTierMap[id]; if (t){ const f = pickBest(findAssetsByExactId('t'+String(t))); if (f) return f.path; } for (let k=1;k<=5;k++){ const f = pickBest(findAssetsByExactId('t'+String(k))); if (f) return f.path; } const any = pickBest(allAssets()); return any? any.path : ''; }
export function spriteFor(symbolId){ const p = pathFor(symbolId); if (!p) return null; return { id: symbolId, path: p }; }
`;
      writeFileSync(outPath, content);
      console.log(`[package:web] symbols.js generated with ${total} assets`);
      return content;
    } catch (e) {
      const content = `// Auto-generated fallback (no assets)
export const registry = { tiers: {1:[],2:[],3:[],4:[],5:[]}, total: 0 };
export function byTier(t){ return []; }
export function allAssets(){ return []; }
export function randomSymbol(){ return null; }
export function popSymbol(){ /* no-op */ }
export function popSymbolAt(){ /* no-op */ }
export const engineTierMap = {};
export function pathFor(){ return ''; }
export function spriteFor(){ return null; }
`;
      writeFileSync(outPath, content);
      console.warn('[package:web] symbols.js fallback written (no assets found)');
      return content;
    }
  }

// ---------- App script (offline demo + RGS scaffolding) ----------
const appJs = `// app.js - orchestrates UI + RGS + anims (with CDN/demo fallbacks)
import { getQuery, pickBaseUrl, formatAmount, formatCurrencyMicro, supportedCurrencies, languages, CurrencyMeta, MICRO, microToNumber, numberToMicro } from './format.js';
import { Animator } from './anim.js';
import { sfx, setMuted, isMuted, resume } from './sounds.js';
const $ = (sel) => document.querySelector(sel);
const stage = $('#stage');
const animator = new Animator(stage);
const q = getQuery();
const sessionID = q.sessionID || q.sessionId || '';
const baseUrl = pickBaseUrl();
const isRgs = !!(sessionID && baseUrl);
const state = { base: baseUrl, rgs: isRgs, sessionID, currency: (q.currency && supportedCurrencies.includes(q.currency) ? q.currency : 'USD'), lang: (q.lang && languages[q.lang] ? q.lang : 'en'), balanceMicro: numberToMicro(1000), betMicro: numberToMicro(1), auto: false, spinning: false, demo: !isRgs, seed: (Date.now()>>>0) ^ (Math.floor(Math.random()*1e9)>>>0), config: { minBet: MICRO, maxBet: 1000*MICRO, stepBet: MICRO, betLevels: [] } };
// UI refs
const el = { balance: $('#balance'), win: $('#win'), bet: $('#bet'), betInc: $('#betInc'), betDec: $('#betDec'), spin: $('#spinBtn'), auto: $('#autoBtn'), mute: $('#muteBtn'), rulesBtn: $('#rulesBtn'), payBtn: $('#paytableBtn'), loader: $('#loader'), msgs: $('#messages'), confirmAuto: $('#confirmAuto'), rules: $('#rulesModal'), rulesBody: $('#rulesBody'), pay: $('#paytableModal'), payBody: $('#paytableBody'), userBtn: $('#userMenuBtn'), userMenu: $('#userMenu'), currencySel: $('#currencySel'), langSel: $('#langSel') };
function setMsg(text){ const div=document.createElement('div'); div.className='msg'; div.textContent=text; el.msgs&&el.msgs.appendChild(div); setTimeout(()=>div.remove(), 3500); }
function setBalanceMicro(m){ state.balanceMicro=m; el.balance.textContent = formatCurrencyMicro(m, state.currency); }
function setBetMicro(m){ m = Math.max(state.config.minBet||MICRO, Math.min(m, state.config.maxBet||m)); if (!state.config.betLevels || state.config.betLevels.length===0){ const step = state.config.stepBet||MICRO; m = Math.round(m/step)*step; } state.betMicro = m; const meta = CurrencyMeta[state.currency] || { decimals: 2 }; const disp = microToNumber(m).toFixed(meta.decimals); if (el.bet) { el.bet.value = disp; el.bet.step = String((state.config.stepBet||MICRO)/MICRO); } }
function setWinDisplay(amount){ el.win.textContent = formatAmount(amount, state.currency); }
function setLoader(hide){ if (!el.loader) return; el.loader.setAttribute('aria-hidden', hide? 'true':'false'); if (hide){ el.loader.setAttribute('hidden',''); } else { el.loader.removeAttribute('hidden'); } }
function setCurrency(cur){ if (!supportedCurrencies.includes(cur)) return; state.currency = cur; if (el.currencySel) el.currencySel.value = cur; setBalanceMicro(state.balanceMicro); setWinDisplay(0); }
function setLanguage(lang){ if (!languages[lang]) return; state.lang = lang; if (el.langSel) el.langSel.value = lang; }
function toggleMute(){ const m = !isMuted(); setMuted(m); el.mute.setAttribute('aria-pressed', String(m)); el.mute.textContent = m? '🔈' : '🔊'; }
function toggleMenu(){ const isHidden = el.userMenu.hasAttribute('hidden'); if (isHidden){ el.userMenu.removeAttribute('hidden'); el.userBtn.setAttribute('aria-expanded','true'); } else { el.userMenu.setAttribute('hidden',''); el.userBtn.setAttribute('aria-expanded','false'); } }
function mulberry32(a){ return function(){ let t = a += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; } }
let rand = mulberry32(state.seed);
function reseed(){ state.seed = (state.seed + 0x9E3779B9) >>> 0; rand = mulberry32(state.seed); }
async function fetchJson(url, init){ try { const r = await fetch(url, init); const status = r.status; let data=null; try{ data = await r.json(); }catch{} if (!r.ok) return { ok:false, status, data }; return { ok:true, status, data }; } catch { return { ok:false, status:0, data:null }; } }
async function loadPaytable(){ const apiUrl = state.base + '/api/paytable'; const api = await fetchJson(apiUrl); if (api.ok && api.data){ renderPaytable(api.data); return api.data; } const local = await fetchJson('index.json'); if (local.ok && local.data){ if (!state.rgs) { state.demo = true; setMsg('Using offline paytable.'); } renderPaytable(local.data); return local.data; } el.payBody.innerHTML = '<p>Paytable unavailable.</p>'; return null; }
function renderPaytable(j){ const rawModes = (j&&j.modes)||[]; const modes = Array.isArray(rawModes) ? rawModes : Object.keys(rawModes).map(k=>({ name:k, ...(rawModes[k]||{}) })); const table=document.createElement('table'); const thead=document.createElement('thead'); const thr=document.createElement('tr'); const th1=document.createElement('th'); th1.textContent='Mode'; const th2=document.createElement('th'); th2.textContent='RTP'; thr.appendChild(th1); thr.appendChild(th2); thead.appendChild(thr); const tbody=document.createElement('tbody'); modes.forEach(m=>{ const tr=document.createElement('tr'); const td1=document.createElement('td'); td1.textContent=String(m.name||m.key||''); const td2=document.createElement('td'); const r = (typeof m.rtp==='number') ? ((m.rtp*100).toFixed(2)+'%') : String(m.rtp??''); td2.textContent=r; tr.appendChild(td1); tr.appendChild(td2); tbody.appendChild(tr); }); table.appendChild(thead); table.appendChild(tbody); el.payBody.innerHTML=''; el.payBody.appendChild(table); }
function renderRules(){ el.rulesBody.innerHTML = '<ul><li>Basic RGS flow: authenticate → play → end-round</li><li>Autoplay queues spins until stopped</li><li>Animations are illustrative; math resolved by RGS</li></ul>'; }
function countUp(from, to, ms){ from=Number(from)||0; to=Number(to)||0; ms=Math.max(100, Number(ms)||600); const start=performance.now(); function step(t){ const p=Math.min(1,(t-start)/ms); const v=from+(to-from)*p; setWinDisplay(v); if (p<1) requestAnimationFrame(step); } requestAnimationFrame(step); }
function demoSpinResult(){
  const cols=6, rows=5; reseed();
  const tiers=['T1','T2','T3','T4','T5'];
  const weight=[5,4,3,2,1];
  const pick=()=>{ let s=0; for (let i=0;i<weight.length;i++) s+=weight[i]; let x=rand()*s; for (let i=0;i<tiers.length;i++){ x-=weight[i]; if (x<=0) return { id: tiers[i] }; } return { id: 'T1' }; };
  const grid = Array.from({length:rows},()=> Array.from({length:cols},()=> pick()));
  const cx = Math.floor(rand()*cols);
  const cy = Math.floor(rand()*rows);
  const winSym = grid[cy][cx].id;
  const winCells = [[cy,cx]];
  const events = [
    { type:'spinStart', payload:{} },
    { type:'win', payload:{ symbol:{ id: winSym }, size:1, multiplier:1, winAmount:1, positions:[], cells: winCells } },
    { type:'spinEnd', payload:{} }
  ];
  return { grid, multiplierMap: {}, totalWinX: 1, events, uiHints: {} };
}
async function spin(){
  if (state.spinning) return;
  state.spinning=true; setLoader(false);
  try {
    let result=null;
    if (state.rgs){
      const url = state.base + '/api/spin?sessionID=' + encodeURIComponent(state.sessionID);
      const r = await fetchJson(url, { method:'POST', headers:{ 'content-type':'application/json' }, body: JSON.stringify({ bet: state.betMicro, seed: state.seed }) });
      if (r.ok && r.data) result = r.data;
    }
    if (!result){ result = demoSpinResult(); setMsg('Offline demo spin.'); }
    const totalX = Number(result.totalWinX||0);
    if (totalX>0){ const add = Math.round((totalX) * state.betMicro / MICRO) * MICRO; state.balanceMicro += add; countUp(0, microToNumber(add), 600); }
    animator.enqueue(result.events||[], result);
  } catch (e) { setMsg('Spin failed'); }
  finally { setLoader(true); state.spinning=false; }
}
// --- UI wiring ---
el.spin.addEventListener('click', ()=>{ sfx.click(); spin(); });
el.auto.addEventListener('click', async ()=>{ sfx.click(); if (state.auto){ state.auto=false; el.auto.setAttribute('aria-pressed','false'); return; } const res = await el.confirmAuto.showModal(); if (res!==undefined) { state.auto=true; el.auto.setAttribute('aria-pressed','true'); while(state.auto){ await spin(); await new Promise(r=>setTimeout(r,300)); } } });
el.mute.addEventListener('click', ()=>{ sfx.click(); toggleMute(); });
el.betInc.addEventListener('click', ()=>{ sfx.click(); setBetMicro(state.betMicro + (state.config.stepBet||MICRO)); });
el.betDec.addEventListener('click', ()=>{ sfx.click(); setBetMicro(state.betMicro - (state.config.stepBet||MICRO)); });
el.currencySel.addEventListener('change', (e)=>{ setCurrency((e.target&&e.target.value)||'USD'); });
el.langSel.addEventListener('change', (e)=>{ setLanguage((e.target&&e.target.value)||'en'); });
el.rulesBtn.addEventListener('click', ()=>{ renderRules(); el.rules.showModal(); });
el.payBtn.addEventListener('click', async ()=>{ const p = await loadPaytable(); if (p) el.pay.showModal(); });
window.addEventListener('keydown', (e)=>{ if (e.code==='Space' && !e.repeat){ e.preventDefault(); spin(); } });
setCurrency(state.currency);
setBetMicro(state.betMicro);
setLoader(true);
`;

// ---------- Main packaging routine ----------
function walk(dir: string): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = resolve(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p)); else out.push(p);
  }
  return out;
}

function copyDir(from: string, to: string) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from)) {
    const s = resolve(from, entry);
    const d = resolve(to, entry);
    const st = statSync(s);
    if (st.isDirectory()) copyDir(s, d); else copyFileSync(s, d);
  }
}

function main(){
  const root = resolve('.');
  const distWeb = resolve(root, 'dist-web');
  // Reset dist-web except assets folder if exists
  if (existsSync(distWeb)) {
    // Remove files we'll regenerate
    try { rmSync(resolve(distWeb, 'index.html'), { force: true }); } catch {}
    try { rmSync(resolve(distWeb, 'styles.css'), { force: true }); } catch {}
    try { rmSync(resolve(distWeb, 'ui.css'), { force: true }); } catch {}
    try { rmSync(resolve(distWeb, 'bg.css'), { force: true }); } catch {}
    try { rmSync(resolve(distWeb, 'guard.js'), { force: true }); } catch {}
    try { rmSync(resolve(distWeb, 'format.js'), { force: true }); } catch {}
    try { rmSync(resolve(distWeb, 'sounds.js'), { force: true }); } catch {}
    try { rmSync(resolve(distWeb, 'anim.js'), { force: true }); } catch {}
    try { rmSync(resolve(distWeb, 'app.js'), { force: true }); } catch {}
    try { rmSync(resolve(distWeb, 'symbols.js'), { force: true }); } catch {}
  } else {
    mkdirSync(distWeb, { recursive: true });
  }

  // If there is an external assets source, copy it under dist-web/assets
  const envAssetsSrc = process.env.ASSETS_SRC;
  const defaultAssetsSrc = resolve('C:/Users/kevin/Desktop/POCKIT- MON/First project (1)');
  const assetsSource = (envAssetsSrc && existsSync(envAssetsSrc)) ? resolve(envAssetsSrc) : defaultAssetsSrc;
  const assetsDest = resolve(distWeb, 'assets');
  if (assetsSource && existsSync(assetsSource)) {
    copyDir(assetsSource, assetsDest);
  } else {
    mkdirSync(assetsDest, { recursive: true });
  }

  // Write core UI files
  writeFileSync(resolve(distWeb, 'index.html'), indexHtml);
  writeFileSync(resolve(distWeb, 'styles.css'), stylesCss);
  writeFileSync(resolve(distWeb, 'ui.css'), uiCss);
  writeFileSync(resolve(distWeb, 'guard.js'), guardJs);
  writeFileSync(resolve(distWeb, 'format.js'), formatJs);
  writeFileSync(resolve(distWeb, 'sounds.js'), soundsJs);
  writeFileSync(resolve(distWeb, 'anim.js'), animJs);

  // Background CSS
  const bgCandidate = findLikelyBackground(distWeb) || 'assets/bg.jpg';
  writeFileSync(resolve(distWeb, 'bg.css'), bgCssTemplate(bgCandidate));

  // Symbols registry
  const symbolsModuleContent = generateSymbolsModule(distWeb);

  // App last, after symbols exist
  writeFileSync(resolve(distWeb, 'app.js'), appJs);
  console.log('[package:web] Wrote static UI to dist-web');

  // --- Build embed.js: single-file, non-ESM bundle for host pages ---
  try {
    // transform helpers: strip ESM exports/imports for embed
    const stripExports = (s: string) => s
      .replace(/^export\s+default\s+/mg, '')
      .replace(/^export\s+const\s+/mg, 'const ')
      .replace(/^export\s+function\s+/mg, 'function ')
      .replace(/^export\s+class\s+/mg, 'class ');
    const stripImports = (s: string) => s
      .replace(/^import\s+[^;]+;\s*\n?/mg, '');

    const formatEmbed = stripExports(formatJs);
    const soundsEmbed = stripExports(soundsJs);
    const symbolsEmbed = stripExports(symbolsModuleContent);
    // For anim, remove imports and replace exported class with local class
    let animEmbed = stripImports(animJs).replace(/\bexport\s+class\s+Animator\b/, 'class Animator');

    // Build app/embed wrapper: take appJs, remove imports and top-level $, stage, animator declarations and wrap into init()
    let appCore = stripImports(appJs);
    // remove the helper and animator declarations we will redefine in init()
    appCore = appCore
      .replace(/\n?const \$\s*=\s*\(sel\)\s*=>\s*document\.querySelector\(sel\);\s*/,'')
      .replace(/\n?const stage\s*=\s*\$('#stage');\s*/,'')
      .replace(/\n?const animator\s*=\s*new\s+Animator\(stage\);\s*/,'');

  const embedJs = `/*! Pocket Munsters embed; v${VERSION} */\n`+
`(function(){\n'use strict';\n\n`+
`// format helpers\n${formatEmbed}\n\n`+
`// sounds\n${soundsEmbed}\n\n`+
`// symbols registry (inlined)\n${symbolsEmbed}\n\n`+
`// animator\n${animEmbed}\n\n`+
`function init(){\n  const $ = (sel)=>document.querySelector(sel);\n  const stage = document.getElementById('stage');\n  if (!stage) { console.warn('[PocketMunsters] No #stage canvas found'); return; }\n  const animator = new Animator(stage);\n${appCore}\n}\n\n`+
`function maybeAuto(){ if (document.getElementById('stage')) init(); }\n`+
`window.PocketMunsters = { init, Animator, sfx, version: '${VERSION}' };\n`+
`if (document.readyState!=='loading') maybeAuto(); else document.addEventListener('DOMContentLoaded', maybeAuto, { once: true });\n`+
`})();\n`;

    writeFileSync(resolve(distWeb, 'embed.js'), embedJs);
    console.log('[package:web] embed.js (single-file bundle) written');
  } catch (e) {
    console.warn('[package:web] embed.js generation failed:', e);
  }
}

// Run
main();
