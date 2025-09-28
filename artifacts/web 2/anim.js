// anim.js - Pokédex-themed animation runner for engine events (with enhanced tumble animations)
import { sfx } from './sounds.js';
import { randomSymbol, popSymbol, popSymbolAt, spriteFor, pathFor } from './symbols.js';

export class Animator {
  constructor(canvas){ 
    this.canvas = canvas; 
    this.ctx = canvas.getContext('2d',{alpha:true}); 
    this.width=canvas.width; 
    this.height=canvas.height; 
    this.queue=[]; 
    this.running=false; 
    this._imgCache=new Map(); 
    this.enablePreSpin=true; 
    this.currentGrid=null; 
    this._board=null; 
    this.particleSystem=[];
    this.timing={ 
      gridOpacity:0.18, 
      glowMs:180, 
      popMs:320, 
      popScale:0.12, 
      flashMs:120, 
      dropMs:380, 
      settleMs:500,
      evolutionMs:800,
      multiplierMs:450
    };
    
    // 🔥 ADOBE ANIMATE-STYLE PROFESSIONAL EFFECTS 🔥
    this.adobeEffects = {
      morphing: true,
      elasticTransitions: true,
      particleQuantity: 'cinematic', // minimal, standard, cinematic, ultra
      lightingEffects: true,
      shadowMapping: true,
      postProcessing: true
    }; 
  }

  configureTimings(opts){ 
    try{ 
      opts=opts||{}; 
      function pos(x){ var v=Number(x); return (isFinite(v)&&v>=0)? v: null; } 
      function clamped01(x){ var v=Number(x); if (!isFinite(v)) return null; if (v<0) v=0; if (v>1) v=1; return v; }
      var t=this.timing; 
      if (opts.gridOpacity!=null){ var go=clamped01(opts.gridOpacity); if (go!=null) t.gridOpacity=go; }
      if (opts.glow!=null){ var g=pos(opts.glow); if (g!=null) t.glowMs=g; }
      if (opts.pop!=null){ var p=pos(opts.pop); if (p!=null) t.popMs=p; }
      if (opts.popScale!=null){ var ps=clamped01(opts.popScale); if (ps!=null) t.popScale=ps; }
      if (opts.flash!=null){ var f=pos(opts.flash); if (f!=null) t.flashMs=f; }
      if (opts.drop!=null){ var d=pos(opts.drop); if (d!=null) t.dropMs=d; }
      if (opts.settle!=null){ var s=pos(opts.settle); if (s!=null) t.settleMs=s; }
      if (opts.evolution!=null){ var e=pos(opts.evolution); if (e!=null) t.evolutionMs=e; }
      if (opts.multiplier!=null){ var m=pos(opts.multiplier); if (m!=null) t.multiplierMs=m; }
    }catch(e){} 
  }

  enqueue(events, result){ this.queue.push({ events, result }); if (!this.running) this.run(); }
  cancel(){ try{ this.queue.length = 0; this.running = false; this.particleSystem = []; }catch{}}
  clear(){ const c=this.ctx; c.clearRect(0,0,this.width,this.height); }
  
  drawLabel(text, y, isPokedex=true){ 
    const c=this.ctx; 
    c.save(); 
    if (isPokedex) {
      // Pokédex-style label with red background and yellow text
      c.font='700 20px monospace'; 
      c.fillStyle='#c42525'; 
      const w=c.measureText(text).width+20; 
      c.fillRect(16,y-24, w, 32);
      // Yellow border
      c.strokeStyle='#ffde00';
      c.lineWidth=2;
      c.strokeRect(16,y-24, w, 32);
      c.fillStyle='#ffde00'; 
      c.fillText(text, 26, y); 
    } else {
      c.font='700 24px system-ui'; 
      c.fillStyle='rgba(0,0,0,.45)'; 
      const w=c.measureText(text).width+16; 
      c.fillRect(16,y-28, w, 36); 
      c.fillStyle='#fff'; 
      c.fillText(text, 24, y); 
    }
    c.restore(); 
  }

  // Enhanced Pokédex-style grid board with better visual effects
  drawGridBoard(cols=7, rows=7){ 
    const c=this.ctx; 
    const insetX = Math.round(this.width*0.08); 
    const insetY = Math.round(this.width*0.08); 
    const boardW = this.width - insetX*2; 
    const boardH = this.height - insetY*2; 
    c.save();
    
    // Pokédex screen background with gradient
    const grad = c.createLinearGradient(insetX, insetY, insetX, insetY + boardH);
    grad.addColorStop(0, '#8bac0f');
    grad.addColorStop(1, '#5d7a0a');
    c.fillStyle = grad;
    c.fillRect(insetX, insetY, boardW, boardH);
    
    // Screen bezel effect
    c.strokeStyle='#4a5f08'; 
    c.lineWidth=6; 
    c.strokeRect(insetX, insetY, boardW, boardH);
    
    // Inner screen glow
    c.strokeStyle='rgba(255,255,255,0.3)'; 
    c.lineWidth=2; 
    c.strokeRect(insetX+3, insetY+3, boardW-6, boardH-6);
    
    // Grid lines with Pokédex styling
    c.strokeStyle='rgba(15,56,15,'+this.timing.gridOpacity+')'; 
    c.lineWidth=1.5; 
    const cw=boardW/cols, rh=boardH/rows;
    for (let i=1;i<cols;i++){ 
      c.beginPath(); 
      c.moveTo(insetX + i*cw, insetY); 
      c.lineTo(insetX + i*cw, insetY + boardH); 
      c.stroke(); 
    }
    for (let j=1;j<rows;j++){ 
      c.beginPath(); 
      c.moveTo(insetX, insetY + j*rh); 
      c.lineTo(insetX + boardW, insetY + j*rh); 
      c.stroke(); 
    }
    
    // Corner indicators (like Pokédex screen corners)
    const cornerSize = 8;
    c.fillStyle = '#ffde00';
    // Top-left
    c.fillRect(insetX + 4, insetY + 4, cornerSize, 2);
    c.fillRect(insetX + 4, insetY + 4, 2, cornerSize);
    // Top-right  
    c.fillRect(insetX + boardW - cornerSize - 4, insetY + 4, cornerSize, 2);
    c.fillRect(insetX + boardW - 6, insetY + 4, 2, cornerSize);
    // Bottom-left
    c.fillRect(insetX + 4, insetY + boardH - 6, cornerSize, 2);
    c.fillRect(insetX + 4, insetY + boardH - cornerSize - 4, 2, cornerSize);
    // Bottom-right
    c.fillRect(insetX + boardW - cornerSize - 4, insetY + boardH - 6, cornerSize, 2);
    c.fillRect(insetX + boardW - 6, insetY + boardH - cornerSize - 4, 2, cornerSize);
    
    c.restore(); 
    this._board = { insetX, insetY, boardW, boardH, cw, rh }; 
    return this._board; 
  }

  _loadImage(src){ 
    return new Promise((res,rej)=>{ 
      if (!src) return res(null); 
      if (this._imgCache.has(src)) return res(this._imgCache.get(src)); 
      const img=new Image(); 
      img.onload=()=>{ this._imgCache.set(src,img); res(img); }; 
      img.onerror=()=>res(null); 
      img.src=src; 
    }); 
  }

  // Build and keep a drawable grid state from a result.grid
  _initGridFromResult(result){ 
    const { cols, rows } = getGridSize(result); 
    const g = []; 
    for (let r=0;r<rows;r++){ 
      const row=[]; 
      for (let c=0;c<cols;c++){ 
        const cell = (Array.isArray(result.grid) && result.grid[r] && result.grid[r][c]) || null; 
        const id = cell && (cell.id || cell.symbol || cell.name) || null; 
        row.push(id? { 
          id, 
          path: pathFor(id), 
          alpha: 1, 
          yOff: 0,
          scale: 1,
          rotation: 0,
          glow: 0
        }: null); 
      } 
      g.push(row); 
    } 
    this.currentGrid = { cols, rows, cells: g }; 
    return this.currentGrid; 
  }

  async _drawCurrentGrid(){ 
    if (!this.currentGrid || !this._board) return; 
    const c=this.ctx; 
    const { cols, rows, cells } = this.currentGrid; 
    const { insetX, insetY, cw, rh } = this._board; 
    
    for (let r=0;r<rows;r++){ 
      for (let col=0; col<cols; col++){ 
        const node = cells[r][col]; 
        if (!node || !node.path) continue; 
        const img = await this._loadImage(node.path); 
        if (!img) continue; 
        
        const x0 = insetX + col*cw; 
        const y0 = insetY + r*rh; 
        const w=cw; 
        const h=rh; 
        const pad = Math.max(3, Math.min(10, Math.floor(Math.min(w,h)*0.08))); 
        const scale = Math.min((w-2*pad)/img.width, (h-2*pad)/img.height) * (node.scale || 1); 
        const dw = img.width*scale; 
        const dh = img.height*scale; 
        const dx = x0 + (w-dw)/2; 
        const dy = y0 + (h-dh)/2 + (node.yOff||0); 
        
        c.save();
        
        // Apply glow effect if present
        if (node.glow && node.glow > 0) {
          c.shadowColor = '#ffde00';
          c.shadowBlur = node.glow * 15;
        }
        
        // Apply rotation if present
        if (node.rotation && node.rotation !== 0) {
          c.translate(dx + dw/2, dy + dh/2);
          c.rotate(node.rotation);
          c.translate(-(dx + dw/2), -(dy + dh/2));
        }
        
        // Apply alpha
        if (node.alpha!=null && node.alpha<1){ 
          c.globalAlpha = Math.max(0, Math.min(1, node.alpha)); 
        }
        
        c.drawImage(img, dx, dy, dw, dh); 
        c.restore(); 
      } 
    } 
    
    // Draw particles
    this._drawParticles();
  }

  // 🎬 ADOBE AFTER EFFECTS-LEVEL PARTICLE SYSTEM 🎬
  _addParticle(x, y, type = 'spark', color = '#ffde00') {
    const intensity = this.adobeEffects.particleQuantity === 'ultra' ? 3 : 
                     this.adobeEffects.particleQuantity === 'cinematic' ? 2 : 1;
    
    for(let i = 0; i < intensity; i++){
      this.particleSystem.push({
        x: x + (Math.random() - 0.5) * 10, 
        y: y + (Math.random() - 0.5) * 10,
        type, 
        color: this._getParticleColor(type, color, i),
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1.0,
        decay: 0.015 + Math.random() * 0.015,
        size: 3 + Math.random() * 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        opacity: 1,
        trail: this.adobeEffects.particleQuantity === 'ultra',
        glow: this.adobeEffects.lightingEffects,
        shadowOffset: this.adobeEffects.shadowMapping ? 2 : 0
      });
    }
  }
  
  _getParticleColor(type, baseColor, index) {
    if(type === 'evolution') {
      const evolutionColors = ['#ffd700', '#ff6b35', '#f7931e', '#ffbe0b', '#fb8500'];
      return evolutionColors[index % evolutionColors.length];
    }
    if(type === 'electric') {
      const electricColors = ['#3498db', '#74b9ff', '#00cec9', '#81ecec', '#a29bfe'];
      return electricColors[index % electricColors.length];
    }
    if(type === 'fire') {
      const fireColors = ['#e17055', '#fd79a8', '#fdcb6e', '#ff7675', '#fab1a0'];
      return fireColors[index % fireColors.length];
    }
    return baseColor;
  }

  // 💫 ADOBE-STYLE PHYSICS AND MOTION 💫
  _updateParticles() {
    this.particleSystem = this.particleSystem.filter(p => {
      // Adobe-style motion with easing and elasticity
      p.x += p.vx * (this.adobeEffects.elasticTransitions ? this._elasticEase(p.life) : 1);
      p.y += p.vy * (this.adobeEffects.elasticTransitions ? this._elasticEase(p.life) : 1);
      p.life -= p.decay;
      
      // Advanced physics
      p.vy += 0.15; // Enhanced gravity
      p.vx *= 0.98; // Air resistance
      
      // Adobe Animate-style rotation
      if(p.rotation !== undefined) {
        p.rotation += p.rotationSpeed * p.life;
      }
      
      // Dynamic opacity for professional fade
      p.opacity = Math.max(0, p.life * p.life); // Quadratic fade
      
      return p.life > 0;
    });
  }
  
  _elasticEase(t) {
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
  }

  // 🎨 ADOBE AFTER EFFECTS-LEVEL PARTICLE RENDERING 🎨
  _drawParticles() {
    const c = this.ctx;
    c.save();
    
    for (const p of this.particleSystem) {
      c.save();
      
      // Professional opacity management
      c.globalAlpha = p.opacity || p.life;
      
      // Adobe-style shadow mapping
      if (p.shadowOffset && this.adobeEffects.shadowMapping) {
        c.save();
        c.globalAlpha = (p.opacity || p.life) * 0.3;
        c.fillStyle = '#000000';
        c.beginPath();
        c.arc(p.x + p.shadowOffset, p.y + p.shadowOffset, p.size * p.life, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
      
      // Professional glow effects
      if (p.glow && this.adobeEffects.lightingEffects) {
        const glowSize = p.size * p.life * 2;
        const gradient = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(0.5, p.color + '80'); // 50% transparency
        gradient.addColorStop(1, p.color + '00'); // Fully transparent
        
        c.fillStyle = gradient;
        c.beginPath();
        c.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
        c.fill();
      }
      
      // Adobe Animate-style rotation
      if (p.rotation !== undefined) {
        c.translate(p.x, p.y);
        c.rotate(p.rotation * Math.PI / 180);
        c.translate(-p.x, -p.y);
      }
      
      // Professional particle shape rendering
      c.fillStyle = p.color;
      c.beginPath();
      
      if (p.type === 'star') {
        this._drawStar(c, p.x, p.y, p.size * p.life);
      } else if (p.type === 'diamond') {
        this._drawDiamond(c, p.x, p.y, p.size * p.life);
      } else {
        // Enhanced circle with professional gradient
        const gradient = c.createRadialGradient(p.x - p.size/3, p.y - p.size/3, 0, p.x, p.y, p.size * p.life);
        gradient.addColorStop(0, this._lightenColor(p.color, 0.3));
        gradient.addColorStop(1, p.color);
        c.fillStyle = gradient;
        c.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      }
      
      c.fill();
      
      // Motion blur trail for ultra quality
      if (p.trail && this.adobeEffects.particleQuantity === 'ultra') {
        c.globalAlpha = (p.opacity || p.life) * 0.2;
        c.strokeStyle = p.color;
        c.lineWidth = p.size * p.life * 0.5;
        c.beginPath();
        c.moveTo(p.x - p.vx * 2, p.y - p.vy * 2);
        c.lineTo(p.x, p.y);
        c.stroke();
      }
      
      c.restore();
    }
    
    c.restore();
  }
  
  // ⭐ PROFESSIONAL SHAPE RENDERING ⭐
  _drawStar(ctx, x, y, size) {
    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size * 0.4;
    let rot = Math.PI / 2 * 3;
    const step = Math.PI / spikes;
    
    ctx.moveTo(x, y - outerRadius);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(x + Math.cos(rot) * outerRadius, y + Math.sin(rot) * outerRadius);
      rot += step;
      ctx.lineTo(x + Math.cos(rot) * innerRadius, y + Math.sin(rot) * innerRadius);
      rot += step;
    }
    ctx.lineTo(x, y - outerRadius);
    ctx.closePath();
  }
  
  _drawDiamond(ctx, x, y, size) {
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
  }
  
  _lightenColor(color, amount) {
    // Convert color to lighter shade for professional gradients
    const colorValue = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, Math.floor((colorValue >> 16) * (1 + amount)));
    const g = Math.min(255, Math.floor(((colorValue >> 8) & 0x00FF) * (1 + amount)));
    const b = Math.min(255, Math.floor((colorValue & 0x0000FF) * (1 + amount)));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  async _redrawAll(){ 
    if (!this._board || !this.currentGrid) return; 
    this.clear(); 
    this.drawGridBoard(this.currentGrid.cols, this.currentGrid.rows); 
    this._updateParticles();
    await this._drawCurrentGrid(); 
  }

  // Enhanced glow effect with Pokédex colors
  async _glowCells(positions, color='rgba(255,222,0,0.6)', ms){ 
    if (ms==null) ms=this.timing.glowMs; 
    if (!this._board) return; 
    const pos = normalizePositions(positions); 
    const { insetX, insetY, cw, rh } = this._board; 
    const c=this.ctx; 
    const start=performance.now(); 
    
    // Add glow particles
    for (const {row, col} of pos) {
      const centerX = insetX + col*cw + cw/2;
      const centerY = insetY + row*rh + rh/2;
      for (let i = 0; i < 3; i++) {
        this._addParticle(centerX, centerY, 'glow', color);
      }
    }
    
    await new Promise(done=>{ 
      const step=(t)=>{ 
        const p=Math.min(1,(t-start)/ms); 
        const pulse = Math.sin(p * Math.PI * 4) * 0.5 + 0.5;
        this._redrawAll().then(()=>{ 
          c.save(); 
          c.strokeStyle=color; 
          c.lineWidth=3 + 2*pulse; 
          c.shadowColor = color;
          c.shadowBlur = 10 + 5*pulse;
          for (const {row,col} of pos){ 
            const x=insetX+col*cw+3; 
            const y=insetY+row*rh+3; 
            c.strokeRect(x,y,cw-6,rh-6); 
          } 
          c.restore(); 
          if (p<1) requestAnimationFrame(step); 
          else done(null); 
        }); 
      }; 
      requestAnimationFrame(step); 
    }); 
  }

  // Enhanced pop effect with rotation and particles
  async _popCells(positions, ms){ 
    if (ms==null) ms=this.timing.popMs; 
    if (!this._board) return; 
    const pos = normalizePositions(positions); 
    const { insetX, insetY, cw, rh } = this._board; 
    const c=this.ctx; 
    const start=performance.now(); 
    
    // Add explosion particles
    for (const {row, col} of pos) {
      const centerX = insetX + col*cw + cw/2;
      const centerY = insetY + row*rh + rh/2;
      for (let i = 0; i < 6; i++) {
        this._addParticle(centerX, centerY, 'explosion', '#ff3333');
      }
    }
    
    await new Promise(done=>{ 
      const step=(t)=>{ 
        const p=Math.min(1,(t-start)/ms); 
        const s=1+this.timing.popScale*Math.sin(p*Math.PI*2); 
        const rotation = p * Math.PI * 0.5;
        
        this._redrawAll().then(async ()=>{ 
          c.save(); 
          for (const {row,col} of pos){ 
            const x=insetX+col*cw; 
            const y=insetY+row*rh; 
            c.save(); 
            c.translate(x+cw/2,y+rh/2); 
            c.scale(s,s); 
            c.rotate(rotation);
            c.translate(-(x+cw/2),-(y+rh/2)); 
            
            // Enhanced visual effect
            c.strokeStyle='rgba(255,222,0,0.8)'; 
            c.lineWidth=3*(1-p); 
            c.shadowColor='#ffde00';
            c.shadowBlur=8*(1-p);
            c.strokeRect(x+6,y+6,cw-12,rh-12); 
            c.restore(); 
          } 
          c.restore(); 
          if (p<1) requestAnimationFrame(step); 
          else done(null); 
        }); 
      }; 
      requestAnimationFrame(step); 
    }); 
  }
  // Enhanced Pokédex-style pre-spin with visual flair
  async _preSpin(result){
    try {
      const { cols, rows } = getGridSize(result);
      const board = this._board || this.drawGridBoard(cols, rows);
      const ctx = this.ctx; const w = this.width; const h = this.height;
      const insetX = board.insetX, insetY = board.insetY; const cw = board.cw, rh = board.rh;
      
      // Enhanced speeds and timing for Pokédex feel
      const offsets = Array.from({length: cols}, ()=>0);
      const speeds = Array.from({length: cols}, (_,i)=> (rh * (12 + (i%4)*2)));
      const stopDelay = 120; const spinBase = 1000; const start = performance.now();
      const stops = Array.from({length: cols}, (_,i)=> start + spinBase + i*stopDelay);
      const done = Array.from({length: cols}, ()=>false);
      const finalIds = [];
      
      // Extract final grid state
      try{ 
        const g = result && result.grid; 
        if (Array.isArray(g)){ 
          for (let r=0;r<rows;r++){ 
            for (let c=0;c<cols;c++){ 
              const cell=g[r][c]; 
              if (!finalIds[c]) finalIds[c]=[]; 
              finalIds[c][r] = cell && (cell.id||cell.symbol||cell.name)||null; 
            } 
          } 
        } 
      }catch{}
      
      const randSymPath = ()=>{ const s = randomSymbol(); return s && s.path || pathFor('t'+(1+Math.floor(Math.random()*5))); };
      const stripCache = new Map();
      function getStrip(col){ 
        if (stripCache.has(col)) return stripCache.get(col); 
        const arr=[]; 
        for (let i=0;i<rows+8;i++) arr.push(randSymPath()); 
        stripCache.set(col, arr); 
        return arr; 
      }
      
      const loadImg = (p)=> this._loadImage(p);
      
      // Enhanced column drawing with blur effect during spin
      const drawColumn = async (col, yOff, isSpinning=true)=>{ 
        const strip = getStrip(col); 
        let baseY = insetY + (yOff % rh) - rh*3; 
        
        for (let k=-3;k<rows+5;k++){ 
          const path = strip[(k+strip.length)%strip.length]; 
          const img = await loadImg(path); 
          if (!img) continue; 
          
          const x0 = insetX + col*cw; 
          const y0 = baseY + k*rh; 
          const pad = Math.max(3, Math.min(10, Math.floor(Math.min(cw,rh)*0.08))); 
          const scale = Math.min((cw-2*pad)/img.width, (rh-2*pad)/img.height); 
          const dw = img.width*scale; 
          const dh = img.height*scale; 
          const dx = x0 + (cw-dw)/2; 
          const dy = y0 + (rh-dh)/2; 
          
          if (dy+dh < insetY-5 || dy > insetY + board.boardH + 5) continue; 
          
          // Add motion blur during spinning
          if (isSpinning) {
            ctx.save();
            ctx.globalAlpha = 0.8;
            ctx.filter = 'blur(1px)';
          }
          
          ctx.drawImage(img, dx, dy, dw, dh); 
          
          if (isSpinning) {
            ctx.restore();
          }
        } 
      };
      
      const easeOut = (x)=> 1 - Math.pow(1-x,4); // More dramatic easing
      const settleMs = this.timing.settleMs;
      let allDone=false; let prev = start;
      
      // Add screen flash effect at start
      this.flash('rgba(255,222,0,0.3)', 150);
      
      while(!allDone){
        const now = performance.now(); 
        const dt = Math.max(0, (now - prev)/1000); 
        prev = now;
        
        ctx.clearRect(0,0,w,h); 
        this.drawGridBoard(cols, rows);
        
        // Add scan lines effect during spin
        ctx.save();
        ctx.strokeStyle = 'rgba(255,222,0,0.1)';
        ctx.lineWidth = 1;
        for (let y = insetY; y < insetY + board.boardH; y += 4) {
          ctx.beginPath();
          ctx.moveTo(insetX, y);
          ctx.lineTo(insetX + board.boardW, y);
          ctx.stroke();
        }
        ctx.restore();
        
        allDone = true;
        
        for (let c=0;c<cols;c++){
          if (!done[c]){
            if (now < stops[c]){ 
              offsets[c] += speeds[c]*dt; 
              allDone = false; 
              await drawColumn(c, offsets[c], true); 
            } else {
              // Settling phase with enhanced easing
              const t0 = now; 
              const targetIds = (finalIds[c] && finalIds[c].slice()) || null; 
              const startOff = offsets[c]%rh;
              
              while(true){ 
                const t = performance.now(); 
                const p = Math.min(1, (t - t0)/settleMs); 
                const k = easeOut(p); 
                const y = startOff * (1-k); 
                
                ctx.clearRect(0,0,w,h); 
                this.drawGridBoard(cols, rows);
                
                for (let cc=0; cc<cols; cc++){
                  if (cc===c && targetIds){
                    // Draw settling column with subtle glow effect
                    for (let r=0;r<rows;r++){
                      const id = targetIds[r];
                      const path = id? pathFor(id): randSymPath();
                      const img = await loadImg(path); 
                      if (!img) continue;
                      
                      const x0 = insetX + cc*cw; 
                      const y0 = insetY + r*rh + y;
                      const pad = Math.max(3, Math.min(10, Math.floor(Math.min(cw,rh)*0.08)));
                      const scale = Math.min((cw-2*pad)/img.width, (rh-2*pad)/img.height);
                      const dw = img.width*scale; 
                      const dh = img.height*scale;
                      const dx = x0 + (cw-dw)/2; 
                      const dy = y0 + (rh-dh)/2;
                      
                      // Add settling glow
                      if (p > 0.8) {
                        ctx.save();
                        ctx.shadowColor = '#ffde00';
                        ctx.shadowBlur = 5 * (1-p);
                      }
                      
                      ctx.drawImage(img, dx, dy, dw, dh);
                      
                      if (p > 0.8) {
                        ctx.restore();
                      }
                    }
                  } else if (cc===c){
                    await drawColumn(cc, offsets[cc], false);
                  } else if (!done[cc] && performance.now() < stops[cc]){
                    await drawColumn(cc, offsets[cc], true);
                  } else {
                    // Draw final symbols for completed columns
                    const ids = (finalIds[cc] && finalIds[cc].slice())||null;
                    if (ids){
                      for (let r=0;r<rows;r++){
                        const id=ids[r]; 
                        const path = id? pathFor(id): randSymPath();
                        const img = await loadImg(path); 
                        if (!img) continue;
                        
                        const x0=insetX + cc*cw; 
                        const y0 = insetY + r*rh;
                        const pad = Math.max(3, Math.min(10, Math.floor(Math.min(cw,rh)*0.08)));
                        const sc = Math.min((cw-2*pad)/img.width, (rh-2*pad)/img.height);
                        const dw=img.width*sc; 
                        const dh=img.height*sc;
                        const dx=x0+(cw-dw)/2; 
                        const dy=y0+(rh-dh)/2;
                        
                        ctx.drawImage(img, dx, dy, dw, dh);
                      }
                    }
                  }
                }
                if (p>=1) break;
              }
              done[c] = true;
              
              // Add column completion sound
              sfx.tick();
            }
          } else {
            // Draw completed columns
            const ids = (finalIds[c] && finalIds[c].slice())||null; 
            if (ids){ 
              for (let r=0;r<rows;r++){ 
                const id=ids[r]; 
                const path = id? pathFor(id): randSymPath(); 
                const img = await loadImg(path); 
                if (!img) continue; 
                
                const x0=insetX + c*cw; 
                const y0 = insetY + r*rh; 
                const sc = Math.min(cw/img.width, rh/img.height)*0.9; 
                const dw=img.width*sc; 
                const dh=img.height*sc; 
                const dx=x0+(cw-dw)/2; 
                const dy=y0+(rh-dh)/2; 
                
                ctx.drawImage(img, dx, dy, dw, dh); 
              } 
            }
          }
        }
        if (!allDone){ 
          await new Promise(r=>requestAnimationFrame(()=>r(null))); 
        }
      }
      
      // Final completion flash
      this.flash('rgba(255,222,0,0.2)', 100);
      
    } catch (e) {
      console.warn('Pre-spin animation error:', e);
    }
  }

  // Evolution animation with Pokédex-style transformation
  async _evolutionAnimation(positions, fromSymbol, toSymbol, ms) {
    if (ms == null) ms = this.timing.evolutionMs;
    if (!this._board) return;
    
    const pos = normalizePositions(positions);
    const { insetX, insetY, cw, rh } = this._board;
    const c = this.ctx;
    const start = performance.now();
    
    // Load symbol images
    const fromImg = await this._loadImage(pathFor(fromSymbol));
    const toImg = await this._loadImage(pathFor(toSymbol));
    if (!fromImg || !toImg) return;
    
    // Add dramatic particles for evolution
    for (const {row, col} of pos) {
      const centerX = insetX + col*cw + cw/2;
      const centerY = insetY + row*rh + rh/2;
      for (let i = 0; i < 12; i++) {
        this._addParticle(centerX, centerY, 'evolution', '#ffde00');
      }
    }
    
    // Play evolution sound
    sfx.play('evolution');
    
    await new Promise(done => {
      const step = (t) => {
        const p = Math.min(1, (t - start) / ms);
        const phase = Math.floor(p * 4); // 4 phases of evolution
        
        this._redrawAll().then(() => {
          c.save();
          
          for (const {row, col} of pos) {
            const x = insetX + col*cw;
            const y = insetY + row*rh;
            const centerX = x + cw/2;
            const centerY = y + rh/2;
            
            // Evolution energy ring
            c.strokeStyle = '#ffde00';
            c.lineWidth = 4;
            c.beginPath();
            c.arc(centerX, centerY, 30 + 20*Math.sin(p*Math.PI*4), 0, Math.PI*2);
            c.stroke();
            
            // Symbol transformation
            c.save();
            c.translate(centerX, centerY);
            
            if (phase < 2) {
              // Phase 1-2: Shrink original symbol
              const scale = 1 - (p * 2) * 0.5;
              c.scale(scale, scale);
              c.globalAlpha = 1 - (p * 2) * 0.5;
              c.drawImage(fromImg, -fromImg.width/2, -fromImg.height/2);
            } else {
              // Phase 3-4: Grow new symbol
              const scale = ((p * 2) - 2) * 1.2 + 0.1;
              c.scale(scale, scale);
              c.globalAlpha = ((p * 2) - 2);
              c.drawImage(toImg, -toImg.width/2, -toImg.height/2);
            }
            
            c.restore();
            
            // White flash at climax
            if (phase === 2) {
              c.fillStyle = 'rgba(255,255,255,0.8)';
              c.fillRect(x, y, cw, rh);
            }
          }
          
          c.restore();
          
          if (p < 1) requestAnimationFrame(step);
          else done(null);
        });
      };
      requestAnimationFrame(step);
    });
  }

  // Multiplier upgrade animation
  async _multiplierAnimation(positions, multiplier, ms) {
    if (ms == null) ms = this.timing.multiplierMs;
    if (!this._board) return;
    
    const pos = normalizePositions(positions);
    const { insetX, insetY, cw, rh } = this._board;
    const c = this.ctx;
    const start = performance.now();
    
    await new Promise(done => {
      const step = (t) => {
        const p = Math.min(1, (t - start) / ms);
        const pulse = Math.sin(p * Math.PI * 6) * 0.5 + 0.5;
        
        this._redrawAll().then(() => {
          c.save();
          
          for (const {row, col} of pos) {
            const x = insetX + col*cw;
            const y = insetY + row*rh;
            const centerX = x + cw/2;
            const centerY = y + rh/2;
            
            // Multiplier indicator
            c.fillStyle = '#ff3333';
            c.strokeStyle = '#ffde00';
            c.lineWidth = 2;
            
            const size = 20 + 10*pulse;
            c.fillRect(centerX - size/2, centerY - size/2, size, size);
            c.strokeRect(centerX - size/2, centerY - size/2, size, size);
            
            // Multiplier text
            c.fillStyle = '#ffde00';
            c.font = 'bold 14px monospace';
            c.textAlign = 'center';
            c.fillText(`x${multiplier}`, centerX, centerY + 5);
          }
          
          c.restore();
          
          if (p < 1) requestAnimationFrame(step);
          else done(null);
        });
      };
      requestAnimationFrame(step);
    });
  }
  flash(color='rgba(0,255,128,.18)', ms){ if (ms==null) ms=this.timing.flashMs; const c=this.ctx; c.save(); c.fillStyle=color; c.fillRect(0,0,this.width,this.height); c.restore(); return wait(ms); }
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
  const dropMs = this.timing.dropMs; const start = performance.now();
    const step = async (t) => { const p = easeOutCubic(Math.min(1, (t-start)/dropMs)); for (let i=0;i<endPositions.length;i++){ const ep = endPositions[i]; const node = ep.node; const targetY = (ep.toR)*this._board.rh; const fromY = (startPositions[i].fromR<0) ? node.yOff : (startPositions[i].fromR)*this._board.rh; const baseY = fromY + (targetY - fromY) * p; // translate into yOff relative to toR
        node.yOff = baseY - (ep.toR*this._board.rh); node.alpha = 1; }
      await this._redrawAll(); if (p<1) requestAnimationFrame(step); };
    await new Promise(r=>{ requestAnimationFrame(async t=>{ await step(t); r(null); }); });
    // finalize positions
    for (const { node, toR, toC } of endPositions){ node.yOff = 0; }
    sfx.tick();
  }
  async play(events, result){ 
    const { cols, rows } = getGridSize(result); 
    const board = this.drawGridBoard(cols, rows); 
    await this._redrawAll(); 
    this.drawLabel('SCANNING...', 40, true); 
    sfx.spin();
    
    if (this.enablePreSpin) { await this._preSpin(result); }
    this._initGridFromResult(result); await this._redrawAll();
    
    // Enhanced event processing with Pokédx theming
    let pendingExplodePos = null; let tumbleChainActive=false; let tumbleHitCount=0;
    let evolutionEvents = []; let multiplierEvents = [];
    
    for (const e of events||[]){
      if (e.type==='win'){
        await this._redrawAll(); 
        const winAmount = e.payload&&e.payload.winAmount||0;
        this.drawLabel('MATCH FOUND x'+(winAmount), 80, true); 
        const posRaw = (e && e.payload && (e.payload.positions || e.payload.cells)) || []; const arr = Array.isArray(posRaw)? posRaw: [];
        if (tumbleChainActive && tumbleHitCount>=1) { sfx.moreHits(); } else { sfx.clusterWin(); }
        tumbleHitCount++;
        
        // Enhanced glow with Pokédx colors
        await this._glowCells(arr, 'rgba(255,222,0,0.7)', this.timing.glowMs);
        await this._popCells(arr, this.timing.popMs);
        await this.flash('rgba(255,222,0,0.25)', this.timing.flashMs);
        
        const sid = (e.payload&&e.payload.symbol&&e.payload.symbol.id)||null; const sym = sid? spriteFor(sid): null; 
        if (arr.length){ const count = Math.min(12, arr.length); for (let i=0;i<count;i++){ const p=arr[i]; let col, row; if (Array.isArray(p)) { row=p[0]; col=p[1]; } else if (p && typeof p==='object') { row=(p.row ?? p.y ?? p.r ?? 0); col=(p.col ?? p.x ?? p.c ?? 0); } else { row=0; col=0; } const xPctCanvas = (board.insetX + (Number(col)+0.5)*(board.boardW/cols)) / this.width; const yPctCanvas = (board.insetY + (Number(row)+0.5)*(board.boardH/rows)) / this.height; const path = sym&&sym.path ? sym.path : (randomSymbol()?.path||''); if (path) popSymbolAt(path, xPctCanvas, yPctCanvas, 800); } }
        pendingExplodePos = arr; await wait(120);
      }
      else if (e.type==='tumbleInit' || e.type==='cascadeStart'){ 
        await this._redrawAll(); this.drawLabel('REORGANIZING...', 120, true); sfx.tick(); tumbleChainActive = true; tumbleHitCount = 0; await wait(80); 
      }
      else if (e.type==='tumbleExplode'){
        const pos = (e && e.payload && (e.payload.positions || e.payload.cells)) || pendingExplodePos || [];
        await this._explode(pos, 280);
      }
      else if (e.type==='tumbleSlide' || e.type==='tumbleRefill'){
        await this._collapseAndRefill(e && e.payload);
      }
      else if (e.type==='evolution') { evolutionEvents.push(e); }
      else if (e.type==='multiplier' || e.type==='multiplierUpgrade') { multiplierEvents.push(e); }
      else if (e.type==='pokeHunt') { 
        await this._redrawAll(); this.drawLabel('POKÉ HUNT ACTIVATED!', 160, true); 
        await this.flash('rgba(255,100,100,0.4)', 200); sfx.tick(); await wait(300); 
      }
      else if (e.type==='freeSpins') { 
        await this._redrawAll(); this.drawLabel('FREE SPINS ACTIVATED!', 160, true); 
        await this.flash('rgba(100,255,100,0.4)', 200); sfx.tick(); await wait(300); 
      }
      else if (e.type==='battleArena') { 
        await this._redrawAll(); this.drawLabel('BATTLE ARENA ACTIVATED!', 160, true); 
        await this.flash('rgba(100,100,255,0.4)', 200); sfx.tick(); await wait(300); 
      }
      else if (e.type==='masterBall' || e.type==='wildInject'){ 
        await this._redrawAll(); this.drawLabel('SPECIAL EVENT', 160, true); sfx.tick(); await wait(220); 
      }
    }
    
    // Process evolution animations
    for (const e of evolutionEvents) {
      if (e.payload && e.payload.positions && e.payload.fromSymbol && e.payload.toSymbol) {
        await this._evolutionAnimation(e.payload.positions, e.payload.fromSymbol, e.payload.toSymbol, this.timing.evolutionMs);
      }
    }
    
    // Process multiplier animations  
    for (const e of multiplierEvents) {
      if (e.payload && e.payload.positions && e.payload.multiplier) {
        await this._multiplierAnimation(e.payload.positions, e.payload.multiplier, this.timing.multiplierMs);
      }
    }
    
    // If we saw a win but no explicit tumble events, simulate one basic tumble cycle
    if (pendingExplodePos && (!events || !events.some(ev=>/^tumble/i.test(ev.type)))){
      await this._explode(pendingExplodePos, 280);
      await this._collapseAndRefill(null);
    }
    
    await this._redrawAll(); 
    const totalWin = (result&&result.totalWinX||0);
    if (totalWin >= 1000){ 
      this.drawLabel('BIG WIN!', 200, true); 
      await this.flash('rgba(255,222,0,0.5)', 300); 
      sfx.bigWin(); 
    } else if (totalWin > 0) { 
      this.drawLabel('DATA RECORDED', 200, true); 
    } else { 
      this.drawLabel('SCAN COMPLETE', 200, true); 
    }
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
