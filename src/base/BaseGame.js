const BaseGame = ({ game }) => {
  const state = game?.state ?? {
    grid: Array.from({ length: 7 }, () => Array(7).fill(null)),
    multiplierMap: Array.from({ length: 7 }, () => Array(7).fill(1)),
    winningCells: [],
    featureProgress: { hunt: 0 },
    balance: 0,
    currentBet: 1,
    spinning: false,
  };
  const { grid, multiplierMap, winningCells, featureProgress } = state;

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>POCKETMON INFINITE EVOLUTION</h1>
        <div className="balance">${state.balance.toFixed(2)}</div>
      </div>
      <div className="base-game">
        <div className="grid-container">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="grid-row">
              {row.map((cell, cellIndex) => {
                const isWinningCell = winningCells.some(
                  (winningCell) =>
                    winningCell[0] === rowIndex && winningCell[1] === cellIndex
                );
                return (
                  <div
                    key={cellIndex}
                    className={`grid-cell ${
                      isWinningCell ? "winning-cell" : ""
                    }`}
                  >
                    {cell && <span className="cell-content">{cell}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="controls-container">
          <button
            onClick={() => game?.spin?.()}
            disabled={state.spinning}
          >
            SPIN
          </button>
          
          <div className="bet-controls">
            <button onClick={() => game?.adjustBet?.(-0.2)}>-</button>
            <span>BET: ${state.currentBet}</span>
            <button onClick={() => game?.adjustBet?.(0.2)}>+</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaseGame;