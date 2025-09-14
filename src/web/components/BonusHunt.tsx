/// <reference types="react" />
/// <reference path="../types/jsx-shim.d.ts" />
import React, { useEffect, useMemo, useState } from 'react';
// Local JSX shim to satisfy isolated analysis contexts
declare namespace JSX { interface IntrinsicElements { [elemName: string]: any } }
import { motion } from 'framer-motion';
// lucide-react icons sometimes have typing mismatches depending on React types; alias to React.FC for JSX
import { Play as PlayIcon, Heart as HeartIcon, Gift as GiftIcon } from 'lucide-react';
import { playAnimation, calculateCaptureRate } from '../lib/arenaAnimations';
import { getBackground } from '../assets/backgrounds';
import type { GameState, BonusFeatures, HistoryEvent } from '../types/game';

export interface BonusHuntProps {
  gameState: GameState;
  setGameState: (s: GameState) => void;
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  currentBet: number;
  lastWin: number;
  setLastWin: (x: number) => void;
  bonusFeatures: BonusFeatures;
  addToHistory?: (e: HistoryEvent) => void;
}

// JSX types provided by src/web/types/jsx-shim.d.ts and types/global-jsx-shim.d.ts

export default function BonusHunt({
  gameState,
  setGameState,
  balance,
  setBalance,
  currentBet,
  lastWin,
  setLastWin,
  bonusFeatures,
  addToHistory,
}: BonusHuntProps) {
  type WildSymbol = { tier: 1 | 2 | 3 | 4 | 5; name: string };

  const [wild, setWild] = useState<WildSymbol | null>(null);
  const [ballsLeft, setBallsLeft] = useState<number>(5);
  const [combo, setCombo] = useState<number>(1);
  const [lastBall, setLastBall] = useState<'pocket' | 'great' | 'ultra' | 'master' | null>(null);
  const [state, setState] = useState<'idle' | 'throwing' | 'capture' | 'success' | 'failure'>('idle');
  const [hpPct, setHpPct] = useState<number>(100);

  const pickWeighted = useMemo(
    () => <T,>(pairs: Array<[T, number]>) => {
      const total = pairs.reduce((a, [, w]) => a + w, 0);
      let x = Math.random() * total;
      for (const [val, w] of pairs) {
        x -= w;
        if (x <= 0) return val;
      }
      return pairs[pairs.length - 1][0];
    },
    []
  );

  const rollWild = useMemo(
    () => (): WildSymbol => {
      const tier = pickWeighted<WildSymbol['tier']>([
        [5, 40],
        [4, 30],
        [3, 20],
        [2, 7],
        [1, 3],
      ]);
      return { tier, name: `Tier ${tier} Alpha` };
    },
    [pickWeighted]
  );

  useEffect(() => {
    if (gameState !== 'hunt') return;
    setWild(rollWild());
    setBallsLeft(bonusFeatures.extraSpins ? 7 : 5);
    setCombo(1);
    setLastBall(null);
    setState('idle');
    setHpPct(100);
  }, [gameState, bonusFeatures, rollWild]);

  function captureChance(ball: 'pocket' | 'great' | 'ultra' | 'master', tier: number, comboVal: number): number {
    const baseMap = { pocket: 0.28, great: 0.36, ultra: 0.44, master: 0.55 };
    const tierFactor = { 1: 1.0, 2: 0.85, 3: 0.72, 4: 0.60, 5: 0.50 }[tier as 1|2|3|4|5] ?? 0.7;
    return calculateCaptureRate(baseMap[ball] * tierFactor, comboVal);
  }

  function payoutX(ball: 'pocket' | 'great' | 'ultra' | 'master', tier: number, comboVal: number): number {
    const tierBase = { 1: 6, 2: 12, 3: 25, 4: 60, 5: 150 }[tier as 1|2|3|4|5] ?? 10;
    const ballMul = { pocket: 1, great: 1.5, ultra: 2.5, master: 4 }[ball];
    const comboMul = Math.min(1 + (comboVal - 1) * 0.25, 2.0);
    return tierBase * ballMul * comboMul;
  }

  async function onThrow() {
    if (!wild || ballsLeft <= 0 || state !== 'idle') return;

    const ball = pickWeighted<NonNullable<typeof lastBall>>([
      ['pocket', 40],
      ['great', 30],
      ['ultra', 22],
      ['master', 8],
    ]);
    setLastBall(ball);
    setState('throwing');
    playAnimation('ball-throw').catch(() => {});

    setTimeout(() => setHpPct((v) => Math.max(12, Math.floor(v - (8 + Math.random() * 12)))), 200);

    setTimeout(() => {
      setState('capture');
      const p = captureChance(ball, wild.tier, combo);
      const success = Math.random() < p;

      if (success) {
        playAnimation('capture-success').catch(() => {});
        const win = +(payoutX(ball, wild.tier, combo) * currentBet).toFixed(2);
        setLastWin(win);
        setBalance((b) => +(b + win).toFixed(2));
        addToHistory?.({
          type: 'feature_win',
          feature: 'hunt',
          symbol: wild.name,
          ball,
          combo,
          win,
          timestamp: new Date().toISOString(),
        });
        setState('success');
        setTimeout(() => setGameState('base'), 1200);
      } else {
        playAnimation('capture-fail').catch(() => {});
        setBallsLeft((n) => Math.max(0, n - 1));
        setCombo((c) => (ball === lastBall ? Math.min(5, c + 1) : 1));
        if (ballsLeft - 1 <= 0) {
          addToHistory?.({
            type: 'feature_loss',
            feature: 'hunt',
            symbol: wild.name,
            timestamp: new Date().toISOString(),
          });
          setState('failure');
          setTimeout(() => setGameState('base'), 1200);
        } else {
          setState('idle');
        }
      }
    }, 800);
  }

  return (
    <div className="pokedex-stage pokedex-shell battle-scene">
      <div className="bg-pokedex-inner pokedex-container scanline-overlay h-pct-100 w-pct-100" />
      {/* Optional external hunt background */}
      {getBackground('hunt') && (
        <img className="absolute-fill cover-image opacity-25" src={getBackground('hunt')!} alt="Hunt Background" />
      )}
      <div className="hud-card abs-top-left-16">
        <div className="hud-title">Wild {wild?.name ?? '...'}</div>
        <div className="hp-bar mt-6">
          <div className={`hp-fill w-pct-${Math.max(0, Math.min(100, Math.round(hpPct)))}`} />
        </div>
      </div>

      <div className="abs-bottom-bar">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onThrow}
          disabled={state !== 'idle' || ballsLeft <= 0}
          className="pokedex-button inline-gap-8"
        >
          {state === 'throwing' ? <div className="loading-spinner" aria-label="throwing" /> : <> {React.createElement(PlayIcon, { size: 18 })} Throw Pocket Ball </>}
        </motion.button>

        <div className="stats-row">
          <div>Balls: {ballsLeft}</div>
          <div>Combo: x{combo}</div>
          <div>Bet: ${currentBet.toFixed(2)}</div>
          <div>Win: ${lastWin.toFixed(2)}</div>
        </div>
      </div>

      {state === 'success' && (
        <div className="capture-overlay visible success center-fill">
          {React.createElement(HeartIcon, { style: { marginRight: 8 } })} Captured!
        </div>
      )}
      {state === 'failure' && (
        <div className="capture-overlay visible fail center-fill">
          {React.createElement(GiftIcon, { style: { marginRight: 8 } })} Escaped…
        </div>
      )}
    </div>
  );
}