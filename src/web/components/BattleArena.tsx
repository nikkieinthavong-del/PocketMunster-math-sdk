/// <reference types="react" />
/// <reference path="../types/jsx-shim.d.ts" />
import React, { useEffect, useState } from 'react';
// Local JSX shim to satisfy isolated analysis contexts
declare namespace JSX { interface IntrinsicElements { [elemName: string]: any } }
import { motion } from 'framer-motion';
import { Swords as SwordsIcon, Heart as HeartIcon, Gift as GiftIcon } from 'lucide-react';
import { playAnimation } from '../lib/arenaAnimations';
import { getPokemonSpriteByName } from '../assets/sprites';
import { getBackground } from '../assets/backgrounds';
import type { GameState, BonusFeatures, HistoryEvent } from '../types/game';

export interface BattleArenaProps {
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

type Leader = { id: number; name: string; element: 'Rock' | 'Water' | 'Volt'; hp: number; payoutX: number };

const leaders: Leader[] = [
  { id: 1, name: 'Leader Alpha', element: 'Rock', hp: 60, payoutX: 250 },
  { id: 2, name: 'Leader Beta', element: 'Water', hp: 80, payoutX: 400 },
  { id: 3, name: 'Leader Gamma', element: 'Volt', hp: 110, payoutX: 650 },
];

const attacks = ['Strike', 'Wave', 'Bolt'] as const;
type Attack = typeof attacks[number];

// JSX types provided by src/web/types/jsx-shim.d.ts and types/global-jsx-shim.d.ts

export default function BattleArena({
  gameState,
  setGameState,
  balance,
  setBalance,
  currentBet,
  lastWin,
  setLastWin,
  bonusFeatures,
  addToHistory,
}: BattleArenaProps) {
  const [leader, setLeader] = useState<Leader | null>(null);
  const [playerHP, setPlayerHP] = useState(100);
  const [leaderHP, setLeaderHP] = useState(0);
  const [state, setState] = useState<'idle' | 'attacking' | 'counter' | 'victory' | 'defeated'>('idle');

  useEffect(() => {
    if (gameState !== 'arena') return;
    const pick = leaders[Math.floor(Math.random() * leaders.length)];
    setLeader(pick);
    setLeaderHP(pick.hp);
    setPlayerHP(100);
    setState('idle');
  }, [gameState]);

  function damageOf(attack: Attack, element: Leader['element']): number {
    const base = { Strike: 16, Wave: 20, Bolt: 24 }[attack] ?? 16;
    const mod =
      element === 'Rock' ? (attack === 'Wave' ? 1.4 : attack === 'Bolt' ? 0.8 : 1) :
      element === 'Water' ? (attack === 'Bolt' ? 1.4 : attack === 'Strike' ? 0.9 : 1) :
      element === 'Volt' ? (attack === 'Strike' ? 1.3 : attack === 'Wave' ? 0.85 : 1) : 1;
    const boom = bonusFeatures.upgradedExplosion ? 1.25 : 1.0;
    return Math.round(base * mod * boom);
  }

  function onAttack(attack: Attack) {
    if (!leader || state !== 'idle' || leaderHP <= 0) return;
    setState('attacking');
    playAnimation('attack').catch(() => {});
    const dmg = damageOf(attack, leader.element);
    setTimeout(() => {
      const next = Math.max(0, leaderHP - dmg);
      setLeaderHP(next);
      if (next <= 0) {
        const win = +(leader.payoutX * currentBet).toFixed(2);
        setLastWin(win);
        setBalance((b) => +(b + win).toFixed(2));
        addToHistory?.({ type: 'feature_win', feature: 'arena', leader: leader.name, win, timestamp: new Date().toISOString() });
        setState('victory');
        setTimeout(() => setGameState('base'), 1200);
      } else {
        setState('counter');
        playAnimation('powermove').catch(() => {});
        setTimeout(() => {
          setPlayerHP((hp) => Math.max(0, hp - 12));
          if (playerHP - 12 <= 0) {
            addToHistory?.({ type: 'feature_loss', feature: 'arena', timestamp: new Date().toISOString() });
            setState('defeated');
            setTimeout(() => setGameState('base'), 1200);
          } else {
            setState('idle');
          }
        }, 700);
      }
    }, 600);
  }

  return (
    <div className="pokedex-stage pokedex-shell battle-scene">
      <div className="bg-pokedex-inner pokedex-container scanline-overlay h-pct-100 w-pct-100" />
      {/* Optional external arena background */}
      {getBackground('arena') && (
        <img className="absolute-fill cover-image opacity-25" src={getBackground('arena')!} alt="Arena Background" />
      )}
      <div className="hud-row">
        <div className="hud-card">
          <div className="hud-title">Player</div>
          <div className="hp-bar"><div className={`hp-fill w-pct-${Math.max(0, Math.min(100, Math.round(playerHP)))}`} /></div>
        </div>
        <div className="hud-card text-right">
          <div className="hud-title">{leader?.name ?? '...'}</div>
          <div className="hud-sub">{leader?.element ?? ''}</div>
          <div className="hp-bar"><div className={`hp-fill w-pct-${Math.max(0, Math.min(100, Math.round((leaderHP / (leader?.hp || 1)) * 100)))}`} /></div>
        </div>
      </div>

      {/* Example sprites: player POV back view (fallback to front view if back missing) vs leader front view */}
      <div className="wild-pokemon absolute-fill pointer-none">
        <div className="player-sprite">
          {(() => {
            const back = getPokemonSpriteByName('Pikachu', { pov: true });
            const front = back ?? getPokemonSpriteByName('Pikachu');
            return front ? (
              <img src={front.image} alt="Player POV" className="sprite-120 opacity-90" />
            ) : null;
          })()}
        </div>
        <div className="leader-sprite">
          {leader?.name && getPokemonSpriteByName(leader.element === 'Rock' ? 'Onix' : leader.element === 'Water' ? 'Blastoise' : 'Zapdos') && (
            <img src={getPokemonSpriteByName(leader.element === 'Rock' ? 'Onix' : leader.element === 'Water' ? 'Blastoise' : 'Zapdos')!.image} alt="Leader" className="sprite-140" />
          )}
        </div>
      </div>

      <div className="abs-bottom-bar">
        <div className="btn-row">
          {attacks.map((atk) => (
            <motion.button key={atk} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} disabled={state !== 'idle'} onClick={() => onAttack(atk)} className="pokedex-button">
              {atk}
            </motion.button>
          ))}
        </div>
        <div className="stats-row">
          <div>Bet: ${currentBet.toFixed(2)}</div>
          <div>Win: ${lastWin.toFixed(2)}</div>
        </div>
      </div>

      {state === 'victory' && (
        <div className="capture-overlay visible success center-fill">
          {React.createElement(HeartIcon, { style: { marginRight: 8 } })} Victory!
        </div>
      )}
      {state === 'defeated' && (
        <div className="capture-overlay visible fail center-fill">
          {React.createElement(GiftIcon, { style: { marginRight: 8 } })} Defeated…
        </div>
      )}
    </div>
  );
}