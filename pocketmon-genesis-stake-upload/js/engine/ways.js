const DEFAULT_WAYS_CONFIG = {
  minSymbolsForWin: 3,
  payLeftToRight: true,
  payRightToLeft: false,
  adjacentOnly: true,
  maxWays: 117649, // 7^5 for 7x5 effective grid
};
/**
 * Calculate ways wins for a 7x7 grid supporting up to 117,649 ways
 * Uses adjacency-based calculation for authentic slots feel
 */
export function calculateWaysWins(
  grid,
  paytable, // symbol -> count -> payout
  multiplierMap,
  config = DEFAULT_WAYS_CONFIG,
) {
  const rows = grid.length;
  const cols = grid[0].length;
  const wins = [];
  let totalWinAmount = 0;
  let totalWays = 0;
  // Group symbols by type and tier
  const symbolGroups = new Map();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (cell.kind !== 'standard') continue;
      const symbolKey = `${cell.id}_tier${cell.tier}`;
      if (!symbolGroups.has(symbolKey)) {
        symbolGroups.set(symbolKey, []);
      }
      symbolGroups.get(symbolKey).push({ pos: [r, c], tier: cell.tier });
    }
  }
  // Calculate ways for each symbol group
  for (const [symbolKey, positions] of symbolGroups.entries()) {
    if (positions.length < config.minSymbolsForWin) continue;
    const [symbolId] = symbolKey.split('_tier');
    const tier = positions[0].tier;
    if (config.payLeftToRight) {
      const leftToRightWin = calculateDirectionalWays(positions, rows, cols, 'leftToRight', config);
      if (leftToRightWin.ways > 0 && leftToRightWin.symbolCount >= config.minSymbolsForWin) {
        const payout = getPayoutForSymbol(symbolId, tier, leftToRightWin.symbolCount, paytable);
        const multiplier = calculatePositionMultiplier(leftToRightWin.positions, multiplierMap);
        const winAmount = payout * multiplier * leftToRightWin.ways;
        wins.push({
          symbol: symbolId,
          tier,
          symbolCount: leftToRightWin.symbolCount,
          positions: leftToRightWin.positions,
          ways: leftToRightWin.ways,
          winAmount,
          multiplier,
        });
        totalWinAmount += winAmount;
        totalWays += leftToRightWin.ways;
      }
    }
    if (config.payRightToLeft) {
      const rightToLeftWin = calculateDirectionalWays(positions, rows, cols, 'rightToLeft', config);
      if (rightToLeftWin.ways > 0 && rightToLeftWin.symbolCount >= config.minSymbolsForWin) {
        const payout = getPayoutForSymbol(symbolId, tier, rightToLeftWin.symbolCount, paytable);
        const multiplier = calculatePositionMultiplier(rightToLeftWin.positions, multiplierMap);
        const winAmount = payout * multiplier * rightToLeftWin.ways;
        wins.push({
          symbol: symbolId,
          tier,
          symbolCount: rightToLeftWin.symbolCount,
          positions: rightToLeftWin.positions,
          ways: rightToLeftWin.ways,
          winAmount,
          multiplier,
        });
        totalWinAmount += winAmount;
        totalWays += rightToLeftWin.ways;
      }
    }
  }
  return {
    wins,
    totalWinAmount,
    totalWays,
  };
}
function calculateDirectionalWays(positions, rows, cols, direction, config) {
  // Group positions by column
  const byColumn = new Map();
  for (const { pos } of positions) {
    const [r, c] = pos;
    if (!byColumn.has(c)) byColumn.set(c, []);
    byColumn.get(c).push([r, c]);
  }
  const sortedColumns = Array.from(byColumn.keys()).sort((a, b) =>
    direction === 'leftToRight' ? a - b : b - a,
  );
  if (sortedColumns.length < config.minSymbolsForWin) {
    return { ways: 0, symbolCount: 0, positions: [] };
  }
  // Find consecutive columns starting from leftmost/rightmost
  let consecutiveColumns = [];
  let startCol = direction === 'leftToRight' ? 0 : cols - 1;
  let increment = direction === 'leftToRight' ? 1 : -1;
  for (let c = startCol; direction === 'leftToRight' ? c < cols : c >= 0; c += increment) {
    if (byColumn.has(c)) {
      consecutiveColumns.push(c);
    } else {
      break; // Must be consecutive for ways wins
    }
  }
  if (consecutiveColumns.length < config.minSymbolsForWin) {
    return { ways: 0, symbolCount: 0, positions: [] };
  }
  // Calculate ways by multiplying symbol counts in each consecutive column
  let ways = 1;
  const allPositions = [];
  for (const col of consecutiveColumns) {
    const colPositions = byColumn.get(col);
    ways *= colPositions.length;
    allPositions.push(...colPositions);
    // Limit ways to prevent explosion
    if (ways > config.maxWays) {
      ways = config.maxWays;
      break;
    }
  }
  return {
    ways,
    symbolCount: consecutiveColumns.length,
    positions: allPositions,
  };
}
function getPayoutForSymbol(symbolId, tier, symbolCount, paytable) {
  const tierKey = `tier${tier}`;
  const symbolKey = `${tierKey}_${symbolId}`;
  // Try exact symbol match first
  if (paytable[symbolKey] && paytable[symbolKey][symbolCount]) {
    return paytable[symbolKey][symbolCount];
  }
  // Fallback to tier-based payout
  if (paytable[tierKey] && paytable[tierKey][symbolCount]) {
    return paytable[tierKey][symbolCount];
  }
  // Default tier-based multipliers
  const tierMultipliers = { 1: 1, 2: 3, 3: 10 };
  const basePayouts = {
    3: 0.5,
    4: 2,
    5: 10,
    6: 50,
    7: 250,
  };
  const basePayout = basePayouts[symbolCount] || 0;
  const tierMultiplier = tierMultipliers[tier] || 1;
  return basePayout * tierMultiplier;
}
function calculatePositionMultiplier(positions, multiplierMap) {
  if (!multiplierMap) return 1;
  let totalMultiplier = 1;
  for (const [r, c] of positions) {
    if (multiplierMap[r] && multiplierMap[r][c]) {
      totalMultiplier *= multiplierMap[r][c];
    }
  }
  return totalMultiplier;
}
/**
 * Advanced ways calculation for mega wins
 * Supports special combinations and bonus multipliers
 */
export function calculateMegaWays(grid, paytable, multiplierMap, config = DEFAULT_WAYS_CONFIG) {
  const basicResult = calculateWaysWins(grid, paytable, multiplierMap, config);
  const megaWins = [];
  // Check for evolution chain mega win
  const evolutionChain = checkEvolutionChainWin(grid);
  if (evolutionChain.isWin) {
    const bonusMultiplier = 50;
    const bonusAmount = basicResult.totalWinAmount * bonusMultiplier;
    megaWins.push({
      type: 'evolution_chain',
      multiplier: bonusMultiplier,
      positions: evolutionChain.positions,
      bonusAmount,
    });
    basicResult.totalWinAmount += bonusAmount;
  }
  // Check for full screen of same species
  const fullScreen = checkFullScreenWin(grid);
  if (fullScreen.isWin) {
    const bonusMultiplier = 100;
    const bonusAmount = basicResult.totalWinAmount * bonusMultiplier;
    megaWins.push({
      type: 'full_screen',
      multiplier: bonusMultiplier,
      positions: fullScreen.positions,
      bonusAmount,
    });
    basicResult.totalWinAmount += bonusAmount;
  }
  return {
    ...basicResult,
    megaWins,
  };
}
function checkEvolutionChainWin(grid) {
  const positions = [];
  const speciesFound = new Set();
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      const cell = grid[r][c];
      if (cell.kind === 'standard') {
        const species = cell.id.split('_').slice(1).join('_');
        speciesFound.add(species);
        positions.push([r, c]);
      }
    }
  }
  // Check for complete evolution chains
  const evolutionChains = [
    ['charmander', 'charmeleon', 'charizard'],
    ['squirtle', 'wartortle', 'blastoise'],
    ['bulbasaur', 'ivysaur', 'venusaur'],
  ];
  const hasCompleteChain = evolutionChains.some((chain) =>
    chain.every((species) => speciesFound.has(species)),
  );
  return { isWin: hasCompleteChain, positions };
}
function checkFullScreenWin(grid) {
  const positions = [];
  let firstSpecies = null;
  let allSame = true;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      const cell = grid[r][c];
      if (cell.kind === 'standard') {
        const species = cell.id.split('_').slice(1).join('_');
        if (firstSpecies === null) {
          firstSpecies = species;
        } else if (species !== firstSpecies) {
          allSame = false;
        }
        positions.push([r, c]);
      }
    }
  }
  return {
    isWin: allSame && positions.length === grid.length * grid[0].length,
    positions,
  };
}
