// anim.js - minimal synced animation runner for engine events
import { sfx } from './sounds.js';
import { randomSymbol, popSymbol, popSymbolAt } from './symbols.js';
export class Animator {
  constructor(canvas){ this.canvas = canvas; this.ctx = canvas.getContext('2d',{alpha:true}); this.width=canvas.width; this.height=canvas.height; this.queue=[]; this.running=false; }
  enqueue(events, result){ this.queue.push({ events, result }); if (!this.running) this.run(); }
  clear(){ const c=this.ctx; c.clearRect(0,0,this.width,this.height); }
  drawLabel(text, y){ const c=this.ctx; c.save(); c.font='700 24px system-ui'; c.fillStyle='rgba(0,0,0,.45)'; const w=c.measureText(text).width+16; c.fillRect(16,y-28, w, 36); c.fillStyle='#fff'; c.fillText(text, 24, y); c.restore(); }
  // Draw grid inside an inset "board" rectangle so it doesn't fill the entire canvas
  drawGridBoard(cols=6, rows=5){ const c=this.ctx; const insetX = Math.round(this.width*0.14); const insetY = Math.round(this.height*0.14); const boardW = this.width - insetX*2; const boardH = this.height - insetY*2; c.save(); c.strokeStyle='rgba(255,255,255,.18)'; c.fillStyle='rgba(0,0,0,.15)'; c.lineWidth=1; c.fillRect(insetX, insetY, boardW, boardH); const cw=boardW/cols, rh=boardH/rows; for (let i=1;i<cols;i++){ c.beginPath(); c.moveTo(insetX + i*cw, insetY); c.lineTo(insetX + i*cw, insetY + boardH); c.stroke(); } for (let j=1;j<rows;j++){ c.beginPath(); c.moveTo(insetX, insetY + j*rh); c.lineTo(insetX + boardW, insetY + j*rh); c.stroke(); } c.restore(); return { insetX, insetY, boardW, boardH }; }
  flash(color='rgba(0,255,128,.18)', ms=140){ const c=this.ctx; c.save(); c.fillStyle=color; c.fillRect(0,0,this.width,this.height); c.restore(); return wait(ms); }
  async run(){ this.running=true; while(this.queue.length){ const { events, result } = this.queue.shift(); await this.play(events, result); } this.running=false; }
  async play(events, result){ this.clear(); const { cols, rows } = getGridSize(result); const board = this.drawGridBoard(cols, rows); this.drawLabel('Spin start', 40); sfx.spin(); await wait(150);
    for (const e of events){
      if (e.type==='win'){ this.drawLabel('Win x'+(e.payload&&e.payload.winAmount||0), 80); await this.flash('rgba(255,215,0,.22)', 180); sfx.win(); const sym = randomSymbol();
        const pos = (e && e.payload && e.payload.positions) || [];
        if (Array.isArray(pos) && pos.length && sym){
          const count = Math.min(6, pos.length);
          for (let i=0;i<count;i++){ const p=pos[i]; let col, row;
            if (Array.isArray(p)) { col=p[0]; row=p[1]; } else if (p && typeof p==='object') { col=(p.col ?? p.x ?? p.c ?? 0); row=(p.row ?? p.y ?? p.r ?? 0); } else { col=0; row=0; }
            const xPctCanvas = (board.insetX + (Number(col)+0.5)*(board.boardW/cols)) / this.width;
            const yPctCanvas = (board.insetY + (Number(row)+0.5)*(board.boardH/rows)) / this.height;
            popSymbolAt(sym.path, xPctCanvas, yPctCanvas, 700);
          }
        } else if (sym){ popSymbol(sym.path, 700); }
        await wait(120); }
      else if (e.type==='tumbleInit'){ this.drawLabel('Tumble', 120); await this.flash('rgba(0,200,255,.18)', 120); sfx.tick(); await wait(80); }
      else if (e.type==='masterBall' || e.type==='wildInject'){ this.drawLabel(e.type, 160); sfx.tick(); await wait(180); }
    }
    if ((result&&result.totalWinX||0) >= 1000){ sfx.bigWin(); }
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
