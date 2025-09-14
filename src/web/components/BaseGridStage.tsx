import React from 'react';
import PokedexGrid from './PokedexGrid';

type Cell = any;

type Props = {
  grid: Cell[][];
  multiplierMap: number[][];
  winningCells: { row: number; col: number }[];
  evolvingCells: { row: number; col: number }[];
};

const BaseGridStage: React.FC<Props> = ({ grid, multiplierMap, winningCells, evolvingCells }) => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="pokedex-stage">
        <PokedexGrid
          grid={grid}
          multiplierMap={multiplierMap}
          winningCells={winningCells}
          evolvingCells={evolvingCells}
        />
      </div>
    </div>
  );
};

export default BaseGridStage;
