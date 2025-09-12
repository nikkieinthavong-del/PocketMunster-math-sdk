import { Application, Container, Graphics, Text } from 'pixi.js';
import config from '../config.json';
import { spin } from './js/engine/engine';
import { enterHunt, stepHunt, type HuntState } from './js/features/hunt';
import { enterArena, stepArena, type ArenaState } from './js/features/arena';
import { enterFreeSpins, stepFreeSpins, type FreeSpinsState } from './js/features/freespins';

async function boot() {
  const app = new Application();
  await app.init({ resizeTo: window, background: '#0b0f12', antialias: true });
  document.getElementById('app')!.appendChild(app.canvas);

  // Layout
  const gridSize = 7;
  const cellPx = 120;
  const gridPx = cellPx * gridSize;

  const frame = new Container();
  app.stage.addChild(frame);

  const gridArea = new Graphics().roundRect(0, 0, gridPx, gridPx, 12).stroke({ color: 0x2e3436, width: 4 }).fill(0x11161c);
  frame.addChild(gridArea);

  const sidePanel = new Graphics().roundRect(gridPx + 16, 0, 284, gridPx, 12).fill(0x0f141a).stroke({ color: 0x2e3436, width: 4 });
  frame.addChild(sidePanel);

  const title = new Text({ text: 'PocketMon Genesis', style: { fill: 0x8ae234, fontFamily: 'Consolas', fontSize: 22 } });
  title.x = gridPx + 28; title.y = 12;
  frame.addChild(title);

  const status = new Text({ text: 'Click grid to Spin', style: { fill: 0xffffff, fontFamily: 'Consolas', fontSize: 16 } });
  status.x = gridPx + 28; status.y = 50;
  frame.addChild(status);

  // Center frame
  const layout = () => {
    frame.x = (app.renderer.width - (gridPx + 300)) / 2;
    frame.y = (app.renderer.height - gridPx) / 2;
  };
  app.ticker.add(layout);
  layout();

  // Helpers
  function makeButton(label: string, x: number, y: number, w = 240, h = 40) {
    const btn = new Container();
    const bg = new Graphics().roundRect(0, 0, w, h, 8).fill(0x1a222b).stroke({ color: 0x2e3436, width: 2 });
    const txt = new Text({ text: label, style: { fill: 0x8ae234, fontFamily: 'Consolas', fontSize: 16 } });
    txt.x = 12; txt.y = 10;
    btn.addChild(bg, txt);
    btn.x = x; btn.y = y;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    const setEnabled = (en: boolean) => {
      btn.alpha = en ? 1 : 0.4;
      btn.eventMode = en ? 'static' : 'none';
    };
    return { btn, setEnabled, txt };
  }

  // Overlay
  const overlay = new Container();
  const dim = new Graphics().rect(0, 0, 10, 10).fill({ color: 0x000000, alpha: 0.75 });
  overlay.addChild(dim);
  overlay.visible = false;
  overlay.eventMode = 'none';
  app.stage.addChild(overlay);

  function layoutOverlay() {
    if (!overlay.visible) return;
    dim.clear().rect(0, 0, app.renderer.width, app.renderer.height).fill({ color: 0x000000, alpha: 0.75 });
  }
  app.ticker.add(layoutOverlay);

  function showOverlay(content: Container) {
    overlay.removeChildren();
    overlay.addChild(dim, content);
    overlay.visible = true;
    overlay.eventMode = 'static';
  }
  function hideOverlay() {
    overlay.visible = false;
    overlay.eventMode = 'none';
  }

  // Buttons
  const huntBtn = makeButton('Play Hunt', gridPx + 28, 100);
  const arenaBtn = makeButton('Battle Arena', gridPx + 28, 150);
  const freeBtn = makeButton('Free Spins', gridPx + 28, 200);
  const forceHuntBtn = makeButton('DEV: Force Hunt', gridPx + 28, 260);
  const forceArenaBtn = makeButton('DEV: Force Arena', gridPx + 28, 310);
  const forceFreeBtn = makeButton('DEV: Force Free Spins', gridPx + 28, 360);
  frame.addChild(huntBtn.btn, arenaBtn.btn, freeBtn.btn, forceHuntBtn.btn, forceArenaBtn.btn, forceFreeBtn.btn);
  huntBtn.setEnabled(false);
  arenaBtn.setEnabled(false);
  freeBtn.setEnabled(false);
  forceHuntBtn.setEnabled(true);
  forceArenaBtn.setEnabled(true);
  forceFreeBtn.setEnabled(true);

  // Grid content
  const cells: Graphics[][] = [];
  const cellHi: Graphics[][] = [];
  const multLabels: Text[][] = [];

  for (let r = 0; r < gridSize; r++) {
    const row: Graphics[] = [];
    const rowHi: Graphics[] = [];
    const rowLbl: Text[] = [];
    for (let c = 0; c < gridSize; c++) {
      const g = new Graphics();
      g.rect(0, 0, cellPx - 8, cellPx - 8).fill(0x222831);
      g.x = 4 + c * cellPx;
      g.y = 4 + r * cellPx;
      frame.addChild(g);
      row.push(g);

      const hi = new Graphics();
      hi.x = g.x; hi.y = g.y;
      frame.addChild(hi);
      rowHi.push(hi);

      const lbl = new Text({ text: 'x1', style: { fill: 0xb0b6bb, fontFamily: 'Consolas', fontSize: 14 } });
      lbl.x = g.x + 6; lbl.y = g.y + 6;
      frame.addChild(lbl);
      rowLbl.push(lbl);
    }
    cells.push(row);
    cellHi.push(rowHi);
    multLabels.push(rowLbl);
  }

  function colorFor(kind: string, tier: number): number {
    if (kind === 'egg') return 0xffd166;
    if (kind === 'wild') return 0xaaffc3;
    if (kind.startsWith('scatter')) return 0x6fa8dc;
    switch (tier) {
      case 1: return 0x3a506b;
      case 2: return 0x5bc0be;
      case 3: return 0x9bf6ff;
      case 4: return 0xb5179e;
      case 5: return 0xff006e;
      default: return 0x2b2d42;
    }
  }

  function clearHighlights() {
    for (let r = 0; r < gridSize; r++) for (let c = 0; c < gridSize; c++) cellHi[r][c].clear();
  }

  function renderGrid(res: any) {
    const grid = res.grid;
    const mult = res.multiplierMap;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[0].length; c++) {
        const cell = grid[r][c];
        const g = cells[r][c];
        const col = colorFor(String(cell.kind), Number(cell.tier));
        g.clear().rect(0, 0, cellPx - 8, cellPx - 8).fill(col);

        const m = mult?.[r]?.[c] ?? 1;
        multLabels[r][c].text = `x${m}`;
        multLabels[r][c].style.fill = m > 1 ? 0x8ae234 : 0xb0b6bb;
      }
    }

    // highlight winning positions if provided
    clearHighlights();
    const winPos: Set<string> = new Set();
    for (const ev of res.events ?? []) {
      if (ev.type === 'win' && ev.payload?.positions) {
        for (const [rr, cc] of ev.payload.positions as Array<[number, number]>) {
          winPos.add(`${rr},${cc}`);
        }
      }
    }
    for (const key of winPos) {
      const [rr, cc] = key.split(',').map(Number);
      const hi = cellHi[rr]?.[cc];
      if (hi) hi.clear().roundRect(0, 0, cellPx - 8, cellPx - 8, 10).stroke({ color: 0xffff66, width: 4 });
    }
    setTimeout(clearHighlights, 800);
  }

  // State
  let lastWinX = 0;
  let lastFeatures: any = null;
  let lastSeed: number | null = null;

  function doSpin() {
    const res = spin(config, 1);
    renderGrid(res);
    lastWinX = res.totalWinX;
    lastFeatures = res.uiHints ?? null;
    lastSeed = res.events?.find((e: any) => e.type === 'spinStart')?.payload?.seed ?? lastSeed ?? Date.now();
    const casc = (res.events ?? []).filter((e: any) => e.type === 'tumbleEnd').length;
    const feat = res.uiHints?.scatters
      ? ` • Scatters P:${res.uiHints.scatters.pokeball} K:${res.uiHints.scatters.pikachu} T:${res.uiHints.scatters.trainer}`
      : '';
    status.text = `Last Win: ${lastWinX.toFixed(2)}x • Cascades: ${casc}${feat}`;
    huntBtn.setEnabled(!!lastFeatures?.hunt);
    arenaBtn.setEnabled(!!lastFeatures?.arena);
    freeBtn.setEnabled(!!lastFeatures?.freespins);

    if (!overlay.visible) {
      if (lastFeatures?.hunt) openHuntOverlay();
      else if (lastFeatures?.arena) openArenaOverlay();
      else if (lastFeatures?.freespins) openFreeSpinsOverlay();
    }
  }

  // Overlays
  function openHuntOverlay(initial?: HuntState) {
    const baseState = initial ?? lastFeatures?.hunt;
    if (!baseState) return;
    let state: HuntState = baseState;

    const panel = new Container();
    const bg = new Graphics().roundRect(0, 0, 480, 260, 12).fill(0x0f141a).stroke({ color: 0x2e3436, width: 3 });
    panel.addChild(bg);
    panel.x = (app.renderer.width - 480) / 2;
    panel.y = (app.renderer.height - 260) / 2;

    const t = new Text({ text: 'Poké Hunt', style: { fill: 0x8ae234, fontFamily: 'Consolas', fontSize: 20 } });
    t.x = 16; t.y = 12; panel.addChild(t);

    const info = new Text({ text: '', style: { fill: 0xffffff, fontFamily: 'Consolas', fontSize: 16 } });
    info.x = 16; info.y = 48; panel.addChild(info);

    const play = makeButton('THROW', 0, 0, 160, 40);
    play.btn.x = 16; play.btn.y = 200; panel.addChild(play.btn);
    const close = makeButton('EXIT', 0, 0, 120, 40);
    close.btn.x = 200; close.btn.y = 200; panel.addChild(close.btn);

    function render() {
      const last = state.last ? `Last: ${state.last.result.toUpperCase()}  +${state.last.appliedX}x (base ${state.last.baseX}x, combo x${state.last.comboX})` : 'Last: -';
      info.text = `Throws: ${state.throwsLeft}/${state.throwsTotal}\nCombo: ${state.comboType ?? '-'} x${state.comboCount || 0}\nTotal: ${state.totalWinX}x\n${last}`;
      play.setEnabled(!state.ended);
    }
    play.btn.on('pointertap', () => { state = stepHunt(state, config); render(); if (state.ended) play.setEnabled(false); });
    close.btn.on('pointertap', hideOverlay);

    render();
    showOverlay(panel);
  }

  function openArenaOverlay(initial?: ArenaState) {
    let state: ArenaState;
    if (initial) state = initial;
    else if (lastFeatures?.arena) {
      const seed: number = lastFeatures.arena.seed;
      const turns: number = lastFeatures.arena.preview?.turns ?? 10;
      state = enterArena(config, 'brock', seed, turns);
    } else return;

    const panel = new Container();
    const bg = new Graphics().roundRect(0, 0, 520, 260, 12).fill(0x0f141a).stroke({ color: 0x2e3436, width: 3 });
    panel.addChild(bg);
    panel.x = (app.renderer.width - 520) / 2;
    panel.y = (app.renderer.height - 260) / 2;

    const t = new Text({ text: 'Battle Arena — Brock', style: { fill: 0x8ae234, fontFamily: 'Consolas', fontSize: 20 } });
    t.x = 16; t.y = 12; panel.addChild(t);

    const info = new Text({ text: '', style: { fill: 0xffffff, fontFamily: 'Consolas', fontSize: 16 } });
    info.x = 16; info.y = 48; panel.addChild(info);

    const play = makeButton('ATTACK (spin)', 0, 0, 200, 40);
    play.btn.x = 16; play.btn.y = 200; panel.addChild(play.btn);
    const close = makeButton('EXIT', 0, 0, 120, 40);
    close.btn.x = 240; close.btn.y = 200; panel.addChild(close.btn);

    function render() {
      const last = state.last ? `Last: ${state.last.move.toUpperCase()}  dmg ${state.last.appliedDmgX}x` : 'Last: -';
      info.text = `HP: ${state.bossHpLeft}/${state.bossHpMax}x  •  Turns: ${state.turnsLeft}\nTotal Damage: ${state.totalDamageX}x\n${last}`;
      play.setEnabled(!state.ended);
      if (state.ended) {
        const outcome = state.victory ? `VICTORY! Jackpot ${state.bossHpMax}x` : `Defeat. Consolation ${state.totalDamageX}x`;
        info.text += `\n\n${outcome}`;
      }
    }
    play.btn.on('pointertap', () => { state = stepArena(state, config); render(); });
    close.btn.on('pointertap', hideOverlay);

    render();
    showOverlay(panel);
  }

  function openFreeSpinsOverlay(initial?: FreeSpinsState) {
    let state: FreeSpinsState;
    if (initial) state = initial;
    else if (lastFeatures?.freespins) {
      state = enterFreeSpins(config, lastFeatures.scatters?.pikachu ?? 4, lastSeed ?? Date.now());
    } else return;

    const panel = new Container();
    const bg = new Graphics().roundRect(0, 0, 520, 300, 12).fill(0x0f141a).stroke({ color: 0x2e3436, width: 3 });
    panel.addChild(bg);
    panel.x = (app.renderer.width - 520) / 2;
    panel.y = (app.renderer.height - 300) / 2;

    const t = new Text({ text: 'Free Spins', style: { fill: 0x8ae234, fontFamily: 'Consolas', fontSize: 20 } });
    t.x = 16; t.y = 12; panel.addChild(t);

    const info = new Text({ text: '', style: { fill: 0xffffff, fontFamily: 'Consolas', fontSize: 16 } });
    info.x = 16; info.y = 48; panel.addChild(info);

    const play = makeButton('SPIN', 0, 0, 160, 40);
    play.btn.x = 16; play.btn.y = 240; panel.addChild(play.btn);
    const close = makeButton('EXIT', 0, 0, 120, 40);
    close.btn.x = 200; close.btn.y = 240; panel.addChild(close.btn);

    function renderFS() {
      const last = state.lastSpin ? `Last Win: ${state.lastSpin.winX.toFixed(2)}x` : 'Last Win: -';
      info.text = `Spins: ${state.spinsLeft}/${state.spinsTotal}\nTotal: ${state.totalWinX.toFixed(2)}x\n${last}\nMultipliers persist; retrigger = +5 spins and +1 all.`;
      play.setEnabled(!state.ended);
      if (state.lastSpin) {
        renderGrid({ grid: state.lastSpin.grid, multiplierMap: state.multiplierMap, events: [], totalWinX: state.lastSpin.winX, uiHints: null } as any);
      }
    }
    play.btn.on('pointertap', () => { state = stepFreeSpins(state, config); renderFS(); if (state.ended) play.setEnabled(false); });
    close.btn.on('pointertap', hideOverlay);

    renderFS();
    showOverlay(panel);
  }

  // Hook buttons
  huntBtn.btn.on('pointertap', () => openHuntOverlay());
  arenaBtn.btn.on('pointertap', () => openArenaOverlay());
  freeBtn.btn.on('pointertap', () => openFreeSpinsOverlay());

  forceHuntBtn.btn.on('pointertap', () => {
    const seed = lastSeed ?? Date.now();
    const init = enterHunt(config, 5, seed);
    openHuntOverlay(init);
  });
  forceArenaBtn.btn.on('pointertap', () => {
    const seed = lastSeed ?? Date.now();
    const init = enterArena(config, 'brock', seed, 10);
    openArenaOverlay(init);
  });
  forceFreeBtn.btn.on('pointertap', () => {
    const seed = lastSeed ?? Date.now();
    const init = enterFreeSpins(config, 4, seed);
    openFreeSpinsOverlay(init);
  });

  // Click grid to spin
  frame.eventMode = 'static';
  frame.on('pointertap', (e) => {
    const p = e.getLocalPosition(frame);
    if (p.x >= 0 && p.x <= gridPx && p.y >= 0 && p.y <= gridPx && !overlay.visible) {
      doSpin();
    }
  });

  // Keyboard shortcuts
  window.addEventListener('keydown', (ev) => {
    if (overlay.visible) return;
    if (ev.code === 'Space') doSpin();
    if (ev.key.toLowerCase() === 'h') forceHuntBtn.btn.emit('pointertap');
    if (ev.key.toLowerCase() === 'a') forceArenaBtn.btn.emit('pointertap');
    if (ev.key.toLowerCase() === 'f') forceFreeBtn.btn.emit('pointertap');
  });

  // First draw
  doSpin();
}

boot();