// anim.js - minimal synced animation runner for engine events (with tumble animations)
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
