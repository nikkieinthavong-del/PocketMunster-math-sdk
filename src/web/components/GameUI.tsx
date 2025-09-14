// @ts-nocheck
import React, { useMemo, useState } from 'react';
// Chrome overlay image (fallback simple gradient if not provided)
// Base overlay backgrounds (copy your files under assets/sprites/gen1)
import bgBase from '../../../assets/sprites/gen1/PokedexOverlayBackground.png';
import bgHunt from '../../../assets/sprites/gen1/Background Bonus Hunt.png';
import bgArena from '../../../assets/sprites/gen1/battle arena background template .png';
import { rebrandText } from '../utils/branding';
import BonusBuyModal from './BonusBuyModal';

export type GameState = 'base' | 'hunt' | 'arena';

type Props = {
  balance: number;
  gameState: GameState;
  BaseGame: React.ComponentType;
  BonusHunt: React.ComponentType;
  BattleArena: React.ComponentType;
  spinReels: () => void;
  // setBonusBuyMenu is optional; we’ll manage a local modal if not provided
  setBonusBuyMenu?: (open: boolean) => void;
  // Optional handlers for buy actions (parent may hook to switch state / charge bet)
  onBuyHunt?: () => void;
  onBuyArena?: () => void;
};

export const GameUI: React.FC<Props> = ({
  balance,
  gameState,
  BaseGame,
  BonusHunt,
  BattleArena,
  spinReels,
  setBonusBuyMenu,
  onBuyHunt,
  onBuyArena,
}) => {
  const [buyOpen, setBuyOpen] = useState(false);

  const modeBg = useMemo(() => {
    switch (gameState) {
      case 'hunt':
        return bgHunt;
      case 'arena':
        return bgArena;
      default:
        return bgBase;
    }
  }, [gameState]);

  const openBuy = () => {
    if (setBonusBuyMenu) setBonusBuyMenu(true);
    setBuyOpen(true);
  };

  const closeBuy = () => {
    if (setBonusBuyMenu) setBonusBuyMenu(false);
    setBuyOpen(false);
  };

  const handleBuyHunt = () => {
    // Fire optional callback for parent
    onBuyHunt?.();
    // Also emit an app-wide event for compatibility
    window.dispatchEvent(new CustomEvent('bonus:buy', { detail: { type: 'hunt' } }));
    closeBuy();
  };

  const handleBuyArena = () => {
    onBuyArena?.();
    window.dispatchEvent(new CustomEvent('bonus:buy', { detail: { type: 'arena' } }));
    closeBuy();
  };

  return (
    <div
      className="pokedex-ui"
      style={{
        background: 'radial-gradient(ellipse at top left, rgba(239,68,68,0.15), transparent 60%), radial-gradient(ellipse at bottom right, rgba(59,130,246,0.15), transparent 60%)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Pocketdex-style header */}
      <header className="pokedex-header">
        <div className="pokedex-title">
          {rebrandText('PocketMon: Infinite Evolution').toUpperCase()}
        </div>
        <div className="balance-display">${balance.toFixed(2)}</div>
      </header>

      {/* Main game area with mode background */}
      <main
        className="game-container"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundImage: `url(${modeBg})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          borderRadius: 12,
          minHeight: 560,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {gameState === 'base' && <BaseGame />}
        {gameState === 'hunt' && <BonusHunt />}
        {gameState === 'arena' && <BattleArena />}

        {/* Ensure anything with id="recent-history" never blocks clicks */}
        <div className="history-click-guard" />
      </main>

      {/* Control panel */}
      <footer className="pokedex-controls">
        <button onClick={spinReels} className="pokedex-button">
          SPIN
        </button>
        <button onClick={openBuy} className="pokedex-button">
          BONUS BUY
        </button>
      </footer>

      <BonusBuyModal
        open={buyOpen}
        onClose={closeBuy}
        onBuyHunt={handleBuyHunt}
        onBuyArena={handleBuyArena}
      />
    </div>
  );
};

export default GameUI;

