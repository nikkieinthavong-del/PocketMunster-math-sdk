import React from 'react';

type Props = {
  className?: string;
  onBonusBuy: () => void;
  onToggleWinTable: () => void;
  onToggleHistory: () => void;
  historyVisible: boolean;
};

export default function RightSidebar({ className = '', onBonusBuy, onToggleWinTable, onToggleHistory, historyVisible }: Props) {
  return (
    <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-48 bg-black/80 border-2 border-gray-700 rounded-xl p-3 shadow-2xl ${className}`}>
      <div className="space-y-3">
        <button
          onClick={onBonusBuy}
          className="w-full px-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-bold shadow transition-all"
        >
          Bonus Buy
        </button>
        <button
          onClick={onToggleWinTable}
          className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold shadow transition-colors"
        >
          Win Table
        </button>
        <button
          onClick={onToggleHistory}
          className={`w-full px-3 py-2 rounded-lg font-bold shadow transition-colors ${historyVisible ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          {historyVisible ? 'Hide History' : 'Show History'}
        </button>
      </div>
    </div>
  );
}
