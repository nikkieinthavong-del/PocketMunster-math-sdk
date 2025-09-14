import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type PayEntry = {
  name: string;
  tier: number;
  payouts: { size: number; mult: number }[];
};

export default function WinTablePanel({ open, onClose, entries }: { open: boolean; onClose: () => void; entries: PayEntry[] }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="bg-gray-800 border-4 border-red-600 rounded-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Win Table</h2>
              <button onClick={onClose} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold">Close</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {entries.map((e, i) => (
                <div key={i} className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-white font-bold">{e.name}</div>
                    <div className="text-xs text-gray-300">Tier {e.tier}</div>
                  </div>
                  <div className="text-sm text-gray-200">
                    {e.payouts.map((p, j) => (
                      <div key={j} className="flex justify-between">
                        <span>{p.size}+</span>
                        <span className="font-bold text-yellow-300">{p.mult}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
