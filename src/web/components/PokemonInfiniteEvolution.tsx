import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Volume2, VolumeX, Info, ArrowRight, RefreshCw, Zap, Shield, Gift, Sparkles } from 'lucide-react';
import { getSpriteForTier } from '../assets/sprites';
import { getBackground } from '../assets/backgrounds';
import LayeredBackground from './LayeredBackground';
import BonusHunt from './BonusHunt';
import BattleArena from './BattleArena';
import type { GameState, HistoryEvent } from '../types/game';
import BonusBuyModal from './BonusBuyModal';
import RightSidebar from './RightSidebar';
import WinTablePanel, { type PayEntry } from './WinTablePanel';
// Math engine integration
import { spin as mathSpin } from '../../js/engine/engine';
import clientConfig from '../config.client.json';

// Helpers to avoid inline style percentages
function pctWidthClass(percent: number): string {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return `w-pct-${p}`;
}
function pctHeightClass(percent: number): string {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return `h-pct-${p}`;
}

const PokemonInfiniteEvolution = () => {
  // Game state - following Duck Hunters math model precisely
  const [gameState, setGameState] = useState<GameState>('base');
  const [balance, setBalance] = useState(1000);
  const [currentBet, setCurrentBet] = useState(1);
  const [lastWin, setLastWin] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [gameHistory, setGameHistory] = useState<HistoryEvent[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  const [bonusBuyMenu, setBonusBuyMenu] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlayCount, setAutoPlayCount] = useState(10);
  const [featureProgress, setFeatureProgress] = useState({ egg: 0, hunt: 0, arena: 0 });
  const [buyOpen, setBuyOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [showWinTable, setShowWinTable] = useState(false);

  // Stake Engine specific state with Duck Hunters-like model
  const [multiplierMap, setMultiplierMap] = useState<number[][]>(Array.from({ length: 7 }, () => Array(7).fill(1)));
  const [grid, setGrid] = useState<any[][]>(Array.from({ length: 7 }, () => Array(7).fill(null)));
  const [winningCells, setWinningCells] = useState<{row:number; col:number}[]>([]);
  const [pendingTumble, setPendingTumble] = useState(false);
  const [pendingEvolution, setPendingEvolution] = useState(false);
  const [evolutionChain, setEvolutionChain] = useState(0);
  const [currentEvolutionStep, setCurrentEvolutionStep] = useState(0);
  const [evolvingCells, setEvolvingCells] = useState<{row:number; col:number}[]>([]);
  const [freeSpinsCount, setFreeSpinsCount] = useState(0);
  const [freeSpinsActive, setFreeSpinsActive] = useState(false);
  const [bonusFeatures, setBonusFeatures] = useState({
    upgradedEggs: false,
    upgradedExplosion: false,
    extraSpins: false,
  });

  // Animation and performance optimization
  const animationFrameRef = useRef<number | null>(null);
  const spinTimeoutRef = useRef<any>(null);
  const autoPlayTimeoutRef = useRef<any>(null);
  const maxSpinStepsRef = useRef<number>(0);

  // High-performance random number generator with a fixed seed
  const seededRandom = (() => {
    let seed = 123456789; // Fixed seed for reproducible math
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  })();

  // Autoplay recursion without circular hook deps
  const nextAutoSpinRef = useRef<null | (() => void)>(null);

  // Map engine grid cell (tier-based) to our UI cell with sprite by tier
  const mapEngineCellToUi = useCallback((cell: any) => {
    const tier = Math.max(1, Math.min(5, cell?.tier ?? 1));
    const sprite = getSpriteForTier(tier);
    return {
      id: cell?.id ?? `tier${tier}`,
      name: `Tier ${tier}`,
      tier,
      symbol: `tier${tier}`,
      image: sprite.image,
      isWild: cell?.kind === 'wild' || false,
      isEgg: cell?.kind === 'egg' || false,
      isScatter: cell?.kind?.startsWith?.('scatter_') || false,
    } as any;
  }, []);

  // Run a math-backed spin and drive UI state from SpinResult
  const runMathSpin = useCallback((): void => {
    // derive a 32-bit seed from our local RNG for determinism across UI
    const seed = Math.floor(seededRandom() * 0xffffffff) >>> 0;
    const result = mathSpin(clientConfig as any, currentBet, {
      seed,
      initMultiplierMap: multiplierMap as any,
    } as any);

    // Map engine grid to UI grid with sprites
    const mappedGrid = result.grid.map((row: any[]) => row.map(mapEngineCellToUi));
    setGrid(mappedGrid);
    setMultiplierMap(result.multiplierMap as any);

    // Process events (basic win highlight sequencing)
    const winEvents = (result.events || []).filter(e => e.type === 'win');
    const highlightCells: { row: number; col: number }[] = [];
    for (const e of winEvents as any[]) {
      const cells = e?.payload?.cells as { row: number; col: number }[] | undefined;
      if (Array.isArray(cells)) {
        for (const p of cells) {
          if (!highlightCells.some(h => h.row === p.row && h.col === p.col)) highlightCells.push({ row: p.row, col: p.col });
        }
      }
    }
    if (highlightCells.length > 0) {
      setWinningCells(highlightCells);
    } else {
      setWinningCells([]);
    }

    // Apply win accounting
    const winAmount = Number((result.totalWinX || 0).toFixed(2));
    setLastWin(winAmount);
    setBalance(prev => Number((prev + winAmount).toFixed(2)));
    if (winAmount > 0) {
      addToHistory({ type: 'win', clusters: Math.max(1, winEvents.length), size: highlightCells.length, win: winAmount, timestamp: new Date().toISOString() });
    }

    // Simple end-of-spin sequencing
    if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    spinTimeoutRef.current = setTimeout(() => {
      setWinningCells([]);
      setPendingTumble(false);
      setPendingEvolution(false);
      setSpinning(false);

      // Autoplay handling
      if (autoPlay && autoPlayCount > 0) {
        if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current);
        autoPlayTimeoutRef.current = setTimeout(() => {
          setAutoPlayCount(prev => prev - 1);
          // For free spins, button handler decides path; here it's base-game autoplay
          if (nextAutoSpinRef.current) nextAutoSpinRef.current();
        }, 750);
      }
    }, 900);
  }, [autoPlay, autoPlayCount, currentBet, mapEngineCellToUi, multiplierMap, seededRandom]);

  // Pokémon data — images adapted to repo via getSpriteForTier by tier
  const pokemonList = [
    { id: 1, name: 'Bulbasaur', tier: 1, symbol: 'bulbasaur', baseValue: 0.2, clusterPayouts: { 5: 0.8, 8: 2.5, 12: 8, 15: 25 }, weight: 0.35 },
    { id: 2, name: 'Charmander', tier: 1, symbol: 'charmander', baseValue: 0.2, clusterPayouts: { 5: 0.8, 8: 2.5, 12: 8, 15: 25 }, weight: 0.35 },
    { id: 3, name: 'Squirtle', tier: 1, symbol: 'squirtle', baseValue: 0.2, clusterPayouts: { 5: 0.8, 8: 2.5, 12: 8, 15: 25 }, weight: 0.35 },
    { id: 4, name: 'Ivysaur', tier: 2, symbol: 'ivysaur', baseValue: 0.8, clusterPayouts: { 5: 2.5, 8: 8, 12: 25, 15: 75 }, weight: 0.30 },
    { id: 5, name: 'Charmeleon', tier: 2, symbol: 'charmeleon', baseValue: 0.8, clusterPayouts: { 5: 2.5, 8: 8, 12: 25, 15: 75 }, weight: 0.30 },
    { id: 6, name: 'Wartortle', tier: 2, symbol: 'wartortle', baseValue: 0.8, clusterPayouts: { 5: 2.5, 8: 8, 12: 25, 15: 75 }, weight: 0.30 },
    { id: 7, name: 'Venusaur', tier: 3, symbol: 'venusaur', baseValue: 2, clusterPayouts: { 5: 10, 8: 30, 12: 100, 15: 300 }, weight: 0.20 },
    { id: 8, name: 'Charizard', tier: 3, symbol: 'charizard', baseValue: 2, clusterPayouts: { 5: 10, 8: 30, 12: 100, 15: 300 }, weight: 0.20 },
    { id: 9, name: 'Blastoise', tier: 3, symbol: 'blastoise', baseValue: 2, clusterPayouts: { 5: 10, 8: 30, 12: 100, 15: 300 }, weight: 0.20 },
    { id: 10, name: 'Pikachu', tier: 4, symbol: 'pikachu', baseValue: 5, clusterPayouts: { 5: 20, 8: 60, 12: 200, 15: 600 }, weight: 0.10 },
    { id: 11, name: 'Jigglypuff', tier: 4, symbol: 'jigglypuff', baseValue: 5, clusterPayouts: { 5: 20, 8: 60, 12: 200, 15: 600 }, weight: 0.10 },
    { id: 12, name: 'Onix', tier: 4, symbol: 'onix', baseValue: 5, clusterPayouts: { 5: 20, 8: 60, 12: 200, 15: 600 }, weight: 0.10 },
    // Legendary and rares
  { id: 13, name: 'Mewtwo', tier: 5, symbol: 'mewtwo', baseValue: 20, clusterPayouts: { 5: 100, 8: 500, 12: 2000, 15: 6000 }, weight: 0.00045 },
    { id: 14, name: 'Mew', tier: 4, symbol: 'mew', baseValue: 10, clusterPayouts: { 5: 50, 8: 150, 12: 500, 15: 1500 }, weight: 0.01 },
    { id: 15, name: 'Articuno', tier: 5, symbol: 'articuno', baseValue: 20, clusterPayouts: { 5: 100, 8: 500, 12: 2000, 15: 6000 }, weight: 0.005 },
    // New lines (Caterpie -> Butterfree, Omanyte/Kabuto lines, Eevee line)
    { id: 21, name: 'Caterpie', tier: 1, symbol: 'caterpie', baseValue: 0.18, clusterPayouts: {5:0.7,8:2.2,12:7,15:20}, weight: 0.30 },
    { id: 22, name: 'Metapod', tier: 2, symbol: 'metapod', baseValue: 0.7, clusterPayouts: {5:2.2,8:7,12:22,15:66}, weight: 0.25 },
    { id: 23, name: 'Butterfree', tier: 3, symbol: 'butterfree', baseValue: 1.8, clusterPayouts: {5:9,8:27,12:90,15:270}, weight: 0.15 },
    { id: 24, name: 'Omanyte', tier: 1, symbol: 'omanyte', baseValue: 0.22, clusterPayouts: {5:0.9,8:2.8,12:9,15:28}, weight: 0.18 },
    { id: 25, name: 'Omastar', tier: 3, symbol: 'omastar', baseValue: 2.2, clusterPayouts: {5:11,8:33,12:110,15:330}, weight: 0.10 },
    { id: 26, name: 'Kabuto', tier: 1, symbol: 'kabuto', baseValue: 0.22, clusterPayouts: {5:0.9,8:2.8,12:9,15:28}, weight: 0.18 },
    { id: 27, name: 'Kabutops', tier: 3, symbol: 'kabutops', baseValue: 2.2, clusterPayouts: {5:11,8:33,12:110,15:330}, weight: 0.10 },
    { id: 28, name: 'Eevee', tier: 1, symbol: 'eevee', baseValue: 0.25, clusterPayouts: {5:1.0,8:3,12:10,15:30}, weight: 0.20 },
    { id: 29, name: 'Vaporeon', tier: 3, symbol: 'vaporeon', baseValue: 2.0, clusterPayouts: {5:10,8:30,12:100,15:300}, weight: 0.05 },
    { id: 30, name: 'Jolteon', tier: 3, symbol: 'jolteon', baseValue: 2.0, clusterPayouts: {5:10,8:30,12:100,15:300}, weight: 0.05 },
    { id: 31, name: 'Flareon', tier: 3, symbol: 'flareon', baseValue: 2.0, clusterPayouts: {5:10,8:30,12:100,15:300}, weight: 0.05 },
    // Specials
    { id: 16, name: 'Wild (Zapdos)', tier: 0, symbol: 'wild', baseValue: 10, isWild: true, weight: 0.01 },
  { id: 17, name: 'Pocket Egg', tier: 0, symbol: 'egg', baseValue: 0, isEgg: true, weight: 0.005 },
  { id: 18, name: 'Pocket Ball', tier: 0, symbol: 'pokeball', baseValue: 0, isScatter: true, weight: 0.002 },
    { id: 19, name: 'Pikachu Scatter', tier: 0, symbol: 'pikachu_scatter', baseValue: 0, isScatter: true, weight: 0.002 },
    { id: 20, name: 'Trainer', tier: 0, symbol: 'trainer', baseValue: 0, isScatter: true, weight: 0.001 },
  ].map((p) => ({ ...p, image: getSpriteForTier(Math.max(1, Math.min(5, p.tier || 1))).image }));

  // Derive lightweight paytable entries for the Win Table modal
  const payEntries: PayEntry[] = React.useMemo(() => {
    // Group by name/tier and extract standard cluster sizes
    const sizes = [5, 8, 12, 15];
    return pokemonList
      .filter(p => p.tier && p.tier >= 1)
      .slice(0, 16) // keep panel compact
      .map(p => ({
        name: p.name,
        tier: p.tier,
        payouts: sizes
          .filter(s => (p.clusterPayouts as any)?.[s] != null)
          .map(s => ({ size: s, mult: (p.clusterPayouts as any)[s] }))
      }));
  }, [pokemonList]);

  // Bonus buy options
  const bonusBuyOptions = [
  { name: 'Pocket Hunt Spins', description: '7 spins with 1 random upgrade', cost: 70, trigger: () => triggerPocketHuntSpins(7, 1), rtpContribution: 0.2643, probability: 0.004926 },
    { name: 'Hawk Eye Spins', description: '8 spins with 2 random upgrades', cost: 200, trigger: () => triggerHawkEyeSpins(8, 2), rtpContribution: 0.2643, probability: 0.003657 },
    { name: 'Big Game Spins', description: '10 spins with all 3 upgrades', cost: 600, trigger: () => triggerBigGameSpins(10, 3), rtpContribution: 0.2643, probability: 0.00198 },
    { name: 'Day 64 Spins', description: 'Initial multiplier value of all positions will be x64', cost: 90, trigger: () => triggerDaySpins(90, 64), rtpContribution: 0.2643, probability: 0.01111 },
    { name: 'Day 1024 Spins', description: 'Initial multiplier value of all positions will be x1024', cost: 3000, trigger: () => triggerDaySpins(3000, 1024), rtpContribution: 0.2643, probability: 0.000333 },
    { name: 'xBoost™', description: '5x more likely to trigger Free Spins', cost: 2, trigger: () => activateXBoost(), rtpContribution: 0.2643, probability: 0.5 },
  ];

  // Initialize the 7x7 grid
  const initializeGrid = useCallback(() => {
    const newGrid = Array(7).fill(null).map(() => Array(7).fill(null));
    const newMultiplierMap = Array(7).fill(null).map(() => Array(7).fill(freeSpinsActive ? 2 : 1));

    // Cumulative weights for selection
    const weights = pokemonList.map(p => p.weight);
    const cumulative: number[] = [];
    let total = 0;
    for (const w of weights) { total += w; cumulative.push(total); }

    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const rand = seededRandom() * total;
        let idx = 0;
        while (idx < cumulative.length && rand > cumulative[idx]) idx++;
        const selected = pokemonList[Math.min(idx, pokemonList.length - 1)];
        newGrid[r][c] = { ...selected };
      }
    }

    setGrid(newGrid);
    setMultiplierMap(newMultiplierMap);
    setWinningCells([]);
    setEvolvingCells([]);
    setPendingTumble(false);
    setPendingEvolution(false);
    setEvolutionChain(0);
  }, [freeSpinsActive, pokemonList]);

  // Adjacent cells
  const getAdjacentCells = useCallback((row: number, col: number, symbol: string, visited: {row:number; col:number}[] = []) => {
    if (row < 0 || row >= 7 || col < 0 || col >= 7) return [] as {row:number; col:number}[];
    if (visited.some(v => v.row === row && v.col === col)) return [] as {row:number; col:number}[];
    const current = grid[row][col];
    if (!current || (current.symbol !== symbol && !current.isWild)) return [] as {row:number; col:number}[];
    visited.push({ row, col });
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]] as const;
    for (const [dr, dc] of dirs) getAdjacentCells(row + dr, col + dc, symbol, visited);
    return visited;
  }, [grid]);

  // Detect clusters
  const detectClusters = useCallback(() => {
    const clusters: {row:number; col:number}[][] = [];
    const seen = Array(7).fill(null).map(() => Array(7).fill(false));
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (seen[r][c] || !grid[r][c]) continue;
        const symbol = grid[r][c].symbol;
        const adj = getAdjacentCells(r, c, symbol);
        adj.forEach(cell => { seen[cell.row][cell.col] = true; });
        if (adj.length >= 5) clusters.push(adj);
      }
    }
    return clusters;
  }, [grid, getAdjacentCells]);

  // Calculate win
  const calculateWin = useCallback((cluster: {row:number; col:number}[]) => {
    if (!cluster || cluster.length === 0) return 0;
    const symbolCell = grid[cluster[0].row][cluster[0].col];
    const baseValue = symbolCell.baseValue;
    const size = cluster.length;
    let payoutMultiplier = 0;
    if (size >= 15) payoutMultiplier = symbolCell.clusterPayouts?.[15] ?? baseValue * 300;
    else if (size >= 12) payoutMultiplier = symbolCell.clusterPayouts?.[12] ?? baseValue * 100;
    else if (size >= 8) payoutMultiplier = symbolCell.clusterPayouts?.[8] ?? baseValue * 30;
    else if (size >= 5) payoutMultiplier = symbolCell.clusterPayouts?.[5] ?? baseValue * 10;
    let totalMult = 1;
    cluster.forEach(cell => { totalMult *= multiplierMap[cell.row][cell.col]; });
    const evoMult = Math.min(1 + evolutionChain, 3);
    return Number((currentBet * payoutMultiplier * totalMult * evoMult).toFixed(2));
  }, [grid, multiplierMap, evolutionChain, currentBet]);

  // Tumble
  const tumbleGrid = useCallback(() => {
    const newGrid = grid.map(row => row.slice());
    const newMap = multiplierMap.map(row => row.slice());
    winningCells.forEach(cell => {
      newGrid[cell.row][cell.col] = null;
      newMap[cell.row][cell.col] = Math.min(newMap[cell.row][cell.col] * 2, 8192);
    });
    for (let c = 0; c < 7; c++) {
      let empty = 0;
      for (let r = 6; r >= 0; r--) {
        if (newGrid[r][c] == null) empty++;
        else if (empty > 0) {
          newGrid[r + empty][c] = newGrid[r][c];
          newGrid[r][c] = null;
          newMap[r + empty][c] = newMap[r][c];
          newMap[r][c] = 1;
        }
      }
      for (let i = 0; i < empty; i++) {
        const rand = seededRandom();
        let cum = 0; let selected = pokemonList[0];
        for (const p of pokemonList) { cum += p.weight; if (rand <= cum) { selected = p; break; } }
        newGrid[i][c] = { ...selected };
        newMap[i][c] = 1;
      }
    }
    setGrid(newGrid);
    setMultiplierMap(newMap);
    setWinningCells([]);
    // clear tumble overlay and continue
    setPendingTumble(false);
    // schedule next cluster evaluation
    if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    spinTimeoutRef.current = setTimeout(() => { processClusters(); }, 800);
  }, [grid, multiplierMap, winningCells]);

  // Evolution trigger
  const checkForEvolution = useCallback((clusters: {row:number; col:number}[][]) => {
    const eggCells: {row:number; col:number}[] = [];
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (grid[r][c]?.isEgg) {
          const adj = [[r-1,c],[r+1,c],[r,c-1],[r,c+1]];
          for (const [ar, ac] of adj) {
            if (ar>=0&&ar<7&&ac>=0&&ac<7 && clusters.some(cl => cl.some(cell => cell.row===ar&&cell.col===ac))) {
              eggCells.push({ row:r, col:c });
              break;
            }
          }
        }
      }
    }
    if (eggCells.length > 0) {
      setPendingEvolution(true);
      setEvolvingCells(eggCells);
      setTimeout(() => { handleEvolution(); }, 1000);
    } else {
      setPendingTumble(true);
      setTimeout(() => { tumbleGrid(); }, 1000);
    }
  }, [grid, tumbleGrid]);

  // Evolution handling (simplified two-step)
  const handleEvolution = useCallback(() => {
    const newGrid = grid.map(row => row.slice());
    const evoCells: any[] = [];
    // Tier 1 -> Tier 2
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const cell = newGrid[r][c];
        if (!cell || cell.tier !== 1) continue;
        const adj = getAdjacentCells(r, c, cell.symbol);
        if (adj.length >= 4) {
          const tier2 = pokemonList.find(p => p.tier === 2) || pokemonList[4];
          adj.forEach(pos => { newGrid[pos.row][pos.col] = { ...tier2 }; evoCells.push({ ...pos, fromTier:1, toTier:2 }); });
        }
      }
    }
    // Tier 2 -> Tier 3
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const cell = newGrid[r][c];
        if (!cell || cell.tier !== 2) continue;
        const adj = getAdjacentCells(r, c, cell.symbol);
        if (adj.length >= 4) {
          const tier3 = pokemonList.find(p => p.tier === 3) || pokemonList[7];
          adj.forEach(pos => { newGrid[pos.row][pos.col] = { ...tier3 }; evoCells.push({ ...pos, fromTier:2, toTier:3 }); });
        }
      }
    }
    if (evoCells.length > 0) {
      setGrid(newGrid);
      setEvolvingCells(evoCells);
      setEvolutionChain(prev => Math.min(prev + 1, 3));
      setCurrentEvolutionStep(1);
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      spinTimeoutRef.current = setTimeout(() => {
        setCurrentEvolutionStep(2);
        // evolution step resolved, clear overlay and continue
        setPendingEvolution(false);
        if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
        spinTimeoutRef.current = setTimeout(() => { processClusters(); }, 500);
      }, 1000);
    } else {
      setPendingTumble(true);
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      spinTimeoutRef.current = setTimeout(() => { tumbleGrid(); }, 1000);
    }
  }, [grid, getAdjacentCells, tumbleGrid]);

  // Process clusters
  const processClusters = useCallback(() => {
    // Guard against unexpected infinite loops within a single spin
    maxSpinStepsRef.current += 1;
    if (maxSpinStepsRef.current > 50) {
      setPendingTumble(false);
      setPendingEvolution(false);
      setWinningCells([]);
      setEvolvingCells([]);
      setSpinning(false);
      return;
    }
    const clusters = detectClusters();
    if (clusters.length === 0) {
      checkBonusTriggers();
      setPendingTumble(false);
      setPendingEvolution(false);
      setSpinning(false);
      maxSpinStepsRef.current = 0;
      if (autoPlay && autoPlayCount > 0) {
        if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current);
        autoPlayTimeoutRef.current = setTimeout(() => {
          setAutoPlayCount(prev => prev - 1);
          spinReels();
        }, 1500);
      }
      return;
    }
    const setKeys = new Set<string>();
    clusters.forEach(cl => cl.forEach(cell => setKeys.add(`${cell.row}-${cell.col}`)));
    const winArr = Array.from(setKeys).map(k => { const [r,c] = k.split('-').map(Number); return { row:r, col:c }; });
    setWinningCells(winArr);
    let totalWin = 0;
    clusters.forEach(cl => { totalWin += calculateWin(cl); });
    // Jackpot check: 5+ Mewtwo cluster super-rare path -> boost to 100,000x
    try {
      const first = clusters[0];
      if (first && first.length >= 5) {
        const sym = grid[first[0].row][first[0].col]?.symbol;
        if (sym === 'mewtwo') {
          // Roll extremely rare jackpot (approx 0.000003 per eval -> tuned externally by symbol rarity and cluster likelihood)
          const roll = seededRandom();
          if (roll < 0.000003) {
            const jackpot = +(currentBet * 100000).toFixed(2);
            totalWin = Math.max(totalWin, jackpot);
          }
        }
      }
    } catch {}
    setLastWin(totalWin);
    setBalance(prev => Number((prev + totalWin).toFixed(2)));
    addToHistory({ type: 'win', clusters: clusters.length, size: winArr.length, win: totalWin, timestamp: new Date().toISOString() });
    checkForEvolution(clusters);
  }, [detectClusters, calculateWin, checkForEvolution, autoPlay, autoPlayCount]);

  // Bonus triggers
  const checkBonusTriggers = useCallback(() => {
    let pokeballCount = 0, pikachuCount = 0, trainerCount = 0;
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const s = grid[r][c]?.symbol;
        if (s === 'pokeball') pokeballCount++;
        if (s === 'pikachu_scatter') pikachuCount++;
        if (s === 'trainer') trainerCount++;
      }
    }
    setFeatureProgress(prev => ({
      egg: Math.min(100, prev.egg + (pikachuCount * 15)),
      hunt: Math.min(100, prev.hunt + (pokeballCount * 10)),
      arena: Math.min(100, prev.arena + (trainerCount * 8)),
    }));
  if (pikachuCount >= 3 && !freeSpinsActive) {
    triggerPocketHuntSpins(7, 1);
    } else if (pikachuCount >= 4 && !freeSpinsActive) {
      triggerHawkEyeSpins(8, 2);
    } else if (pikachuCount >= 5 && !freeSpinsActive) {
      triggerBigGameSpins(10, 3);
    } else if (pokeballCount >= 3) {
      setGameState('hunt');
    } else if (trainerCount >= 3) {
      setGameState('arena');
    }
  }, [grid, freeSpinsActive]);

  // Free spin functions
  const triggerPocketHuntSpins = (spins: number, upgrades: number) => {
    setFreeSpinsCount(spins);
    setFreeSpinsActive(true);
    setGameState('spins');
    const upgradeOptions = ['upgradedEggs', 'upgradedExplosion', 'extraSpins'] as const;
    const selectedUpgrade = upgradeOptions[Math.floor(seededRandom() * upgradeOptions.length)];
    setBonusFeatures({ upgradedEggs: selectedUpgrade === 'upgradedEggs', upgradedExplosion: selectedUpgrade === 'upgradedExplosion', extraSpins: selectedUpgrade === 'extraSpins' });
  addToHistory({ type: 'feature', feature: 'pocketHuntSpins', spins, upgrades: 1, timestamp: new Date().toISOString() });
  };

  const triggerHawkEyeSpins = (spins: number, upgrades: number) => {
    setFreeSpinsCount(spins);
    setFreeSpinsActive(true);
    setGameState('spins');
    const upgradeOptions = ['upgradedEggs', 'upgradedExplosion', 'extraSpins'] as const;
    const selected = new Set<string>();
    while (selected.size < upgrades) {
      const idx = Math.floor(seededRandom() * upgradeOptions.length);
      selected.add(upgradeOptions[idx]);
    }
    const u = Array.from(selected);
    setBonusFeatures({ upgradedEggs: u.includes('upgradedEggs'), upgradedExplosion: u.includes('upgradedExplosion'), extraSpins: u.includes('extraSpins') });
    addToHistory({ type: 'feature', feature: 'hawkEyeSpins', spins, upgrades, timestamp: new Date().toISOString() });
  };

  const triggerBigGameSpins = (spins: number, upgrades: number) => {
    setFreeSpinsCount(spins);
    setFreeSpinsActive(true);
    setGameState('spins');
    setBonusFeatures({ upgradedEggs: true, upgradedExplosion: true, extraSpins: true });
    addToHistory({ type: 'feature', feature: 'bigGameSpins', spins, upgrades, timestamp: new Date().toISOString() });
  };

  const triggerDaySpins = (cost: number, multiplier: number) => {
    if (balance < currentBet * cost) return;
    setBalance(prev => Number((prev - (currentBet * cost)).toFixed(2)));
    const newMap = Array(7).fill(null).map(() => Array(7).fill(multiplier));
    setMultiplierMap(newMap);
    setFreeSpinsActive(true);
    setGameState('spins');
    setFreeSpinsCount(5);
    addToHistory({ type: 'feature', feature: `day${multiplier}Spins`, cost: currentBet * cost, timestamp: new Date().toISOString() });
  };

  const activateXBoost = () => {
    if (balance < currentBet * 2) return;
    setBalance(prev => Number((prev - (currentBet * 2)).toFixed(2)));
    addToHistory({ type: 'feature', feature: 'xBoost', cost: currentBet * 2, timestamp: new Date().toISOString() });
    alert('xBoost™ activated! 5x more likely to trigger Free Spins.');
  };

  // Spins
  const spinReels = useCallback((): void => {
    if (spinning || balance < currentBet) return;
    setSpinning(true);
    maxSpinStepsRef.current = 0;
    if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    // Deduct bet up-front
    setBalance(prev => Number((prev - currentBet).toFixed(2)));
    setLastWin(0);
    setEvolutionChain(0);
    setWinningCells([]); setEvolvingCells([]); setPendingTumble(false); setPendingEvolution(false);
    // Drive spin from math engine
    runMathSpin();
  }, [spinning, balance, currentBet, runMathSpin]);

  const handleFreeSpin = useCallback((): void => {
    if (!freeSpinsActive || freeSpinsCount <= 0) {
      setFreeSpinsActive(false); setGameState('base'); return;
    }
    setSpinning(true);
    maxSpinStepsRef.current = 0;
    if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    setFreeSpinsCount(prev => prev - 1);
    setLastWin(0); setEvolutionChain(0);
    setWinningCells([]); setEvolvingCells([]); setPendingTumble(false); setPendingEvolution(false);
    // Free spins do not deduct bet here; call math engine to resolve
    runMathSpin();
  }, [freeSpinsActive, freeSpinsCount, runMathSpin]);

  // Keep autoplay ref pointing at the latest spin function
  useEffect(() => { nextAutoSpinRef.current = spinReels; }, [spinReels]);

  // History & small controls
  const addToHistory = useCallback((event: HistoryEvent) => {
    setGameHistory(prev => [{ ...event }, ...prev.slice(0, 9)]);
  }, []);
  const toggleSound = useCallback(() => { setSoundOn(prev => !prev); }, []);
  const adjustBet = useCallback((amount: number) => { setCurrentBet(b => Math.max(0.2, Math.min(100, Number((b + amount).toFixed(2))))); }, []);
  const buyBonusFeature = useCallback((option: any) => {
    const cost = currentBet * option.cost;
    if (balance < cost) return;
    setBalance(prev => Number((prev - cost).toFixed(2)));
    option.trigger();
    setBonusBuyMenu(false);
  }, [balance, currentBet]);
  const toggleAutoPlay = useCallback(() => {
    setAutoPlay(prev => !prev);
    if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current);
  }, []);
  const resetAutoPlay = useCallback(() => {
    setAutoPlayCount(10);
    if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current);
  }, []);

  useEffect(() => () => {
    if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (autoPlayTimeoutRef.current) clearTimeout(autoPlayTimeoutRef.current);
  }, []);

  useEffect(() => { initializeGrid(); }, [initializeGrid]);

  // UI sections
  const renderBaseGame = () => (
    <div className="relative w-full h-full bg-gradient-to-b from-gray-900 to-black rounded-xl overflow-hidden">
      <div className="absolute inset-0 border-4 border-red-600 rounded-xl bg-gray-800 shadow-xl">
        {/* Layered backgrounds: Sky, grass 2, grass, then overlay */}
        <LayeredBackground className="pointer-events-none" />
        <div className="absolute top-4 left-0 right-0 flex justify-between items-center px-6">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-full bg-yellow-400 border-2 border-black" />
            <h1 className="text-xl font-bold text-red-500 tracking-wider">PocketMon: Infinite Evolution</h1>
            <div className="text-sm text-yellow-400 font-bold">RTP: ~96.06%</div>
          </div>
          <div className="flex items-center space-x-4">
            <button title="Show game info" onClick={() => setShowInfo(!showInfo)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors">
              <Info className="w-5 h-5 text-white" />
            </button>
            <button onClick={() => setBuyOpen(true)} className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-bold shadow-lg transition-all transform hover:scale-105">
              BONUS BUY
            </button>
            <button onClick={() => setBonusBuyMenu(!bonusBuyMenu)} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold shadow transition-all">
              More Options
            </button>
            {/* Quick bonus triggers */}
            <button onClick={() => setGameState('hunt')} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow transition-all">Buy Hunt</button>
            <button onClick={() => setGameState('arena')} className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow transition-all">Buy Arena</button>
          </div>
        </div>

  {/* Stats panel */}
        <div className="absolute right-4 top-16 w-56 bg-black border-2 border-gray-700 rounded-lg p-3 shadow-lg">
          <div className="space-y-2">
            <div className="flex justify-between items-center"><span className="text-xs text-gray-400">BALANCE</span><span className="text-lg font-bold text-green-400">${balance.toFixed(2)}</span></div>
            <div className="flex justify-between items-center"><span className="text-xs text-gray-400">LAST WIN</span><span className="text-lg font-bold text-yellow-400">${lastWin.toFixed(2)}</span></div>
            <div className="flex justify-between items-center"><span className="text-xs text-gray-400">BET</span><span className="text-lg font-bold text-blue-400">${currentBet.toFixed(2)}</span></div>
            {freeSpinsActive && (<div className="flex justify-between items-center"><span className="text-xs text-gray-400">FREE SPINS</span><span className="text-lg font-bold text-purple-400">{freeSpinsCount}</span></div>)}
            {evolutionChain > 0 && (<div className="flex justify-between items-center"><span className="text-xs text-gray-400">EVOLUTION CHAIN</span><span className="text-lg font-bold text-pink-400">x{evolutionChain}</span></div>)}
          </div>
        </div>

        {/* Feature progress bars */}
        <div className="absolute left-32 top-16 w-16 space-y-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">EGGS</div>
            <div className="h-16 w-4 bg-gray-700 rounded overflow-hidden">
              <div className={`bg-gradient-to-b from-green-400 to-green-600 w-full transition-all duration-500 ease-out ${pctHeightClass(featureProgress.egg)}`} />
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">HUNT</div>
            <div className="h-16 w-4 bg-gray-700 rounded overflow-hidden">
              <div className={`bg-gradient-to-b from-blue-400 to-blue-600 w-full transition-all duration-500 ease-out ${pctHeightClass(featureProgress.hunt)}`} />
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">ARENA</div>
            <div className="h-16 w-4 bg-gray-700 rounded overflow-hidden">
              <div className={`bg-gradient-to-b from-yellow-400 to-yellow-600 w-full transition-all duration-500 ease-out ${pctHeightClass(featureProgress.arena)}`} />
            </div>
          </div>
        </div>

  {/* 7x7 Game Grid */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] bg-black/80 border-4 border-gray-700 rounded-lg overflow-hidden shadow-inner backdrop-blur-[1px]">
          <div className="grid grid-cols-7 gap-0.5 w-full h-full p-2">
            {grid.map((row, rowIndex) => (
              row.map((cell, colIndex) => (
                <motion.div
                  key={`${rowIndex}-${colIndex}`}
                  className={`relative rounded overflow-hidden flex items-center justify-center border border-gray-800 ${
                    winningCells.some(c => c.row === rowIndex && c.col === colIndex) ? 'ring-2 ring-yellow-400 ring-inset bg-yellow-500/20' : ''
                  } ${
                    evolvingCells.some(c => c.row === rowIndex && c.col === colIndex) ? 'ring-2 ring-purple-400 ring-inset bg-purple-500/20' : ''
                  }`}
                  animate={{ scale: winningCells.some(c => c.row === rowIndex && c.col === colIndex) ? [1, 1.1, 1] : 1 }}
                  transition={{ duration: 0.3, ease: 'backOut' }}
                >
                  <div className="absolute inset-0 bg-gray-900">
                    {multiplierMap[rowIndex][colIndex] > 1 && (
                      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute top-1 right-1 text-xs font-bold text-yellow-300 bg-black/50 px-1 rounded">
                        x{multiplierMap[rowIndex][colIndex]}
                      </motion.div>
                    )}
                  </div>
                  {cell && (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }} className="relative w-full h-full flex items-center justify-center">
                      <img src={cell.image} alt={cell.name} className="w-12 h-12 object-contain drop-shadow-sm" />
                      {cell.isEgg && bonusFeatures.upgradedEggs && (
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">+</span>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                  {evolvingCells.some(c => c.row === rowIndex && c.col === colIndex) && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity }} className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-pink-500/30" />
                  )}
                  {winningCells.some(c => c.row === rowIndex && c.col === colIndex) && (
                    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0, 0.7] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }} className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 to-orange-500/30" />
                  )}
                </motion.div>
              ))
            ))}
          </div>
          {pendingTumble && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
              <div className="text-white font-bold text-2xl bg-black/80 px-4 py-2 rounded-lg border border-yellow-400">TUMBLING...</div>
            </motion.div>
          )}
          {pendingEvolution && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
              <div className="text-white font-bold text-2xl mb-4 bg-black/80 px-4 py-2 rounded-lg border border-purple-400">EGG HATCHING!</div>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-24 h-24 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center text-black font-bold text-3xl">🥚</motion.div>
            </motion.div>
          )}
          {evolvingCells.length > 0 && currentEvolutionStep > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm">
              <div className="text-white font-bold text-3xl mb-4">{currentEvolutionStep === 1 ? 'EVOLVING...' : 'NEW CLUSTER!'}</div>
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }} className="text-6xl">{currentEvolutionStep === 1 ? '➡️' : '💥'}</motion.div>
            </motion.div>
          )}
        </div>

        {/* Control panel */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[90%] bg-black border-4 border-gray-700 rounded-xl p-4 shadow-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <button onClick={() => adjustBet(-0.2)} disabled={spinning} className="w-10 h-10 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-600 transition-colors"><span className="text-xl font-bold text-white">-</span></button>
              <div className="text-center px-4 py-2 bg-gray-800 rounded-lg border-2 border-gray-600 min-w-[120px]"><div className="text-xs text-gray-400">BET</div><div className="text-lg font-bold text-yellow-400">${currentBet.toFixed(2)}</div></div>
              <button onClick={() => adjustBet(0.2)} disabled={spinning} className="w-10 h-10 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-full flex items-center justify-center border-2 border-gray-600 transition-colors"><span className="text-xl font-bold text-white">+</span></button>
            </div>
            <div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={freeSpinsActive ? handleFreeSpin : spinReels} disabled={spinning} className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all ${spinning ? 'bg-gray-600 cursor-not-allowed' : freeSpinsActive ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-500/50' : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-500/50'}`}>
                {spinning ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-12 h-12 border-4 border-white border-t-transparent rounded-full" />
                ) : freeSpinsActive ? (
                  <div className="text-center"><div className="text-white font-bold text-sm">FREE</div><div className="text-white font-bold text-sm">SPIN</div></div>
                ) : (
                  <Play className="w-10 h-10 text-white" />
                )}
              </motion.button>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={toggleSound} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors">{soundOn ? (<Volume2 className="w-5 h-5 text-white" />) : (<VolumeX className="w-5 h-5 text-white" />)}</button>
              <div className="flex items-center space-x-2">
                <button onClick={toggleAutoPlay} className={`px-4 py-2 rounded-lg font-bold transition-colors ${autoPlay ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>{autoPlay ? 'STOP' : 'AUTO'}</button>
                {autoPlay && (
                  <div className="flex items-center space-x-1">
                    <button title="Reset autoplay count" onClick={resetAutoPlay} className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center"><RefreshCw className="w-4 h-4 text-white" /></button>
                    <span className="text-white text-sm">{autoPlayCount}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-yellow-400 to-blue-500" />

        {/* Right Sidebar Controls */}
        <RightSidebar
          onBonusBuy={() => setBuyOpen(true)}
          onToggleWinTable={() => setShowWinTable(true)}
          onToggleHistory={() => setShowHistory(v => !v)}
          historyVisible={showHistory}
        />
      </div>
      {/* CRT scanline effect via CSS class */}
      <div className="absolute inset-0 pointer-events-none opacity-10 scanline-overlay" />
    </div>
  );

  const renderBonusBuyMenu = () => (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-gray-800 border-4 border-red-600 rounded-xl p-6 w-full max-w-2xl shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">BUY BONUS FEATURES</h2>
            <button title="Close bonus buy menu" onClick={() => setBonusBuyMenu(false)} className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors"><ArrowRight className="w-5 h-5 text-white" /></button>
          </div>
          <div className="space-y-4">
            {bonusBuyOptions.map((option, index) => (
              <motion.div key={index} initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: index * 0.1 }} className="bg-gray-700 rounded-lg p-4 border-2 border-gray-600 hover:border-yellow-500 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">{option.name}</h3>
                    <p className="text-sm text-gray-300">{option.description}</p>
                    <p className="text-xs text-gray-400">RTP Contribution: {(option.rtpContribution * 100).toFixed(2)}%</p>
                    <p className="text-xs text-gray-400">Frequency: ~1 in {Math.round(1 / option.probability)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-400">{option.cost}x</div>
                    <div className="text-sm text-gray-300">${(currentBet * option.cost).toFixed(2)}</div>
                    <button onClick={() => buyBonusFeature(option)} disabled={balance < currentBet * option.cost} className={`mt-2 px-4 py-2 rounded-lg font-bold transition-all ${balance < currentBet * option.cost ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white transform hover:scale-105'}`}>BUY NOW</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  const renderInfoPanel = () => (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-gray-800 border-4 border-red-600 rounded-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">GAME INFORMATION</h2>
            <button title="Close info panel" onClick={() => setShowInfo(false)} className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors"><ArrowRight className="w-5 h-5 text-white" /></button>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center"><Sparkles className="w-5 h-5 mr-2" /> GAME FEATURES</h3>
              <ul className="list-disc pl-5 text-gray-300 space-y-2">
                <li>7x7 grid with cluster pays (5+ adjacent symbols)</li>
                <li>Infectious xWays®-style: Pocket Egg Evolution mechanic</li>
                <li>Position multipliers up to x8192</li>
                <li>Free Spins with upgrades</li>
                <li>Max Win: 150,000x bet</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center"><Gift className="w-5 h-5 mr-2" /> POCKET EGG EVOLUTION (INFECTIOUS xWAYS®-STYLE)</h3>
              <p className="text-gray-300 mb-2">When a Pocket Egg is adjacent to a winning cluster, it hatches and scans the grid for 4 identical Tier 1 Pocket Monsters.</p>
              <ul className="list-disc pl-5 text-gray-300 space-y-2">
                <li>Transforms them into their Tier 2 evolution, triggering a new cluster win</li>
                <li>If 4+ Tier 2 Pocket Monsters exist post-tumble, they evolve into Tier 3</li>
                <li>Evolved symbols inherit any position multipliers from their cells</li>
                <li>Each evolution step increases a global evolution multiplier by +1 (max +3 per chain)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center"><Shield className="w-5 h-5 mr-2" /> FREE SPINS</h3>
              <ul className="list-disc pl-5 text-gray-300 space-y-2">
                <li><strong>Pocket Hunt Spins:</strong> 7 spins with 1 random upgrade (70x bet to buy)</li>
                <li><strong>Hawk Eye Spins:</strong> 8 spins with 2 random upgrades (200x bet to buy)</li>
                <li><strong>Big Game Spins:</strong> 10 spins with all 3 upgrades (600x bet to buy)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center"><Zap className="w-5 h-5 mr-2" /> UPGRADES</h3>
              <ul className="list-disc pl-5 text-gray-300 space-y-2">
                <li><strong>Upgraded Eggs:</strong> Pocket Eggs have enhanced evolution capabilities</li>
                <li><strong>Upgraded Explosion:</strong> More powerful cascade effects</li>
                <li><strong>Extra Spins:</strong> Additional free spins awarded during the feature</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">STATISTICS</h3>
              <div className="grid grid-cols-2 gap-4 text-gray-300">
                <div>
                  <p><strong>Volatility:</strong> Extreme (10/10)</p>
                  <p><strong>RTP:</strong> 96.05%</p>
                  <p><strong>Max Win:</strong> 150,000x bet</p>
                </div>
                <div>
                  <p><strong>Free Spin Frequency:</strong> 1 in 203 spins</p>
                  <p><strong>Win 100x Bet:</strong> 1 in 803 spins</p>
                  <p><strong>Bet Range:</strong> $0.20 - $100</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  const renderGameHistory = () => (
    <div className="absolute bottom-6 right-6 w-64 bg-black/80 border-2 border-gray-700 rounded-lg p-3 overflow-hidden shadow-2xl z-10 pointer-none">
      <h3 className="text-white font-bold mb-2 text-center">RECENT HISTORY</h3>
      <div className="max-h-48 overflow-y-auto pr-2 pointer-auto">
        {gameHistory.map((entry: any, index) => (
          <motion.div key={index} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: index * 0.05 }} className="mb-2 p-2 bg-gray-800 rounded border border-gray-700">
            <div className="text-xs text-gray-400">{new Date(entry.timestamp).toLocaleTimeString()}</div>
            {entry.type === 'win' && (<div><div className="text-green-400">Win</div><div className="text-sm">{entry.clusters} cluster{entry.clusters > 1 ? 's' : ''}</div><div className="font-bold">${entry.win.toFixed(2)}</div></div>)}
            {entry.type === 'feature' && (
              <div>
                <div className="text-blue-400">Feature Triggered</div>
                <div className="text-sm">
                  {entry.feature === 'pocketHuntSpins' && `Pocket Hunt Spins (${entry.spins} spins)`}
                  {entry.feature === 'hawkEyeSpins' && `Hawk Eye Spins (${entry.spins} spins)`}
                  {entry.feature === 'bigGameSpins' && `Big Game Spins (${entry.spins} spins)`}
                  {entry.feature && String(entry.feature).startsWith('day') && `${entry.feature} Spins`}
                  {entry.feature === 'xBoost' && `xBoost™ Activated`}
                </div>
                {entry.cost && <div className="text-sm">Cost: ${entry.cost.toFixed(2)}</div>}
                {entry.upgrades && <div className="text-sm">Upgrades: {entry.upgrades}</div>}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="relative game-stage-600">
          {renderBaseGame()}
          {showHistory && renderGameHistory()}
          {gameState === 'hunt' && (
            <div className="absolute inset-0 z-50">
              <BonusHunt
                gameState={gameState}
                setGameState={setGameState}
                balance={balance}
                setBalance={setBalance}
                currentBet={currentBet}
                lastWin={lastWin}
                setLastWin={setLastWin}
                bonusFeatures={bonusFeatures}
                addToHistory={addToHistory}
              />
            </div>
          )}
          {gameState === 'arena' && (
            <div className="absolute inset-0 z-50">
              <BattleArena
                gameState={gameState}
                setGameState={setGameState}
                balance={balance}
                setBalance={setBalance}
                currentBet={currentBet}
                lastWin={lastWin}
                setLastWin={setLastWin}
                bonusFeatures={bonusFeatures}
                addToHistory={addToHistory}
              />
            </div>
          )}
        </div>
  {bonusBuyMenu && renderBonusBuyMenu()}
        {showInfo && renderInfoPanel()}
  <WinTablePanel open={showWinTable} onClose={() => setShowWinTable(false)} entries={payEntries} />
        <div className="mt-4 bg-gray-800 rounded-lg p-4 text-sm text-gray-300 border border-gray-700">
          <h3 className="text-white font-bold mb-2">Stake Engine - PocketMon: Infinite Evolution</h3>
          <p>This UI implements a PocketDex-styled experience with cluster pays, an evolution mechanic, position multipliers, and free spins upgrades.</p>
          <ul className="list-disc pl-5 mt-1">
            <li>7x7 grid with cluster pays (5+ adjacent symbols)</li>
            <li>Pocket Egg Evolution mechanic</li>
            <li>Position multipliers up to x8192</li>
            <li>Free Spins with random upgrades (Pocket Hunt, Hawk Eye, Big Game Spins)</li>
            <li>Bonus Buy menu with pricing examples</li>
          </ul>
        </div>
      </div>
      <BonusBuyModal
      open={buyOpen}
      onClose={() => setBuyOpen(false)}
      onBuyHunt={() => {
        const costX = 100; // example cost multiplier
        const cost = +(currentBet * costX).toFixed(2);
        if (balance >= cost) {
          setBalance(b => +(b - cost).toFixed(2));
          addToHistory({ type: 'feature', feature: 'buy_hunt', cost, timestamp: new Date().toISOString() });
          setGameState('hunt');
          setBuyOpen(false);
        }
      }}
      onBuyArena={() => {
        const costX = 150; // example cost multiplier
        const cost = +(currentBet * costX).toFixed(2);
        if (balance >= cost) {
          setBalance(b => +(b - cost).toFixed(2));
          addToHistory({ type: 'feature', feature: 'buy_arena', cost, timestamp: new Date().toISOString() });
          setGameState('arena');
          setBuyOpen(false);
        }
      }}
      />
    </div>
  );
};

export default PokemonInfiniteEvolution;
