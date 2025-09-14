import React from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onBuyHunt: () => void;
  onBuyArena: () => void;
};

const BonusBuyModal: React.FC<Props> = ({ open, onClose, onBuyHunt, onBuyArena }) => {
  if (!open) return null;

  return (
    <div
      className="bonusbuy-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="bonusbuy-dialog"
        style={{
          width: 420,
          background: '#101317',
          border: '1px solid #2b2f36',
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          color: '#fff',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Buy Bonus</div>
        <div style={{ opacity: 0.8, marginBottom: 16 }}>
          Choose a feature to enter immediately.
        </div>
        <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
          <button
            onClick={onBuyHunt}
            className="pokedex-button"
            style={{ width: '100%' }}
          >
            Enter Bonus Hunt
          </button>
          <button
            onClick={onBuyArena}
            className="pokedex-button"
            style={{ width: '100%' }}
          >
            Enter Battle Arena
          </button>
          <button onClick={onClose} className="pokedex-button ghost" style={{ width: '100%' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BonusBuyModal;