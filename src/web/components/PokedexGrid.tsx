import React from 'react';

type Cell = any;

interface PokedexGridProps {
  grid: Cell[][];
  multiplierMap: number[][];
  winningCells?: { row: number; col: number }[];
  evolvingCells?: { row: number; col: number }[];
}

const isCellIn = (arr: { row: number; col: number }[] | undefined, r: number, c: number) =>
  !!arr?.some((x) => x.row === r && x.col === c);

export const PokedexGrid: React.FC<PokedexGridProps> = ({
  grid,
  multiplierMap,
  winningCells = [],
  evolvingCells = [],
}) => {
  return (
    <div className="pokedex-container">
      <div className="game-grid-7x7">
        {grid.map((row, ri) =>
          row.map((cell, ci) => (
            <div
              key={`${ri}-${ci}`}
              className={
                'grid-cell' +
                (isCellIn(winningCells, ri, ci) ? ' grid-cell--win' : '') +
                (isCellIn(evolvingCells, ri, ci) ? ' grid-cell--evolving' : '') +
                (cell?.tier ? ` grid-cell--tier${cell.tier}` : '')
              }
            >
              {multiplierMap?.[ri]?.[ci] > 1 && (
                <div className="grid-cell-mult">x{multiplierMap[ri][ci]}</div>
              )}
              {cell?.tier ? (
                <div className="grid-cell-tier">{cell.tier}</div>
              ) : null}
              {cell ? (
                <img
                  src={cell.image}
                  alt={cell.name}
                  className="pokemon-sprite"
                  draggable={false}
                />
              ) : (
                <div className="pokemon-sprite pokemon-sprite--empty" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PokedexGrid;
