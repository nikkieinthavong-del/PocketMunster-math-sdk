function neighbors(r, c) {
    return [
        [r - 1, c],
        [r + 1, c],
        [r, c - 1],
        [r, c + 1],
    ];
}
function diagonalNeighbors(r, c) {
    return [
        [r - 1, c - 1],
        [r - 1, c + 1],
        [r + 1, c - 1],
        [r + 1, c + 1],
    ];
}
function inBounds(grid, r, c) {
    return r >= 0 && c >= 0 && r < grid.length && c < grid[0].length;
}
export function eggAdjacentToWin(grid, winMask) {
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[0].length; c++) {
            if (!winMask[r][c])
                continue;
            for (const [nr, nc] of neighbors(r, c)) {
                if (inBounds(grid, nr, nc) && grid[nr][nc].kind === 'egg')
                    return true;
            }
        }
    }
    return false;
}
const EVOLUTION_CHAINS = {
    'pikachu': {
        nextForm: 'raichu',
        requiredTier: 1,
        minClusterSize: 4,
        evolutionChance: 0.8,
    },
    'charmander': {
        nextForm: 'charmeleon',
        requiredTier: 1,
        minClusterSize: 4,
        evolutionChance: 0.75,
    },
    'charmeleon': {
        nextForm: 'charizard',
        requiredTier: 2,
        minClusterSize: 3,
        evolutionChance: 0.9,
    },
    'charizard': {
        nextForm: 'mega_charizard_x',
        requiredTier: 3,
        minClusterSize: 2,
        evolutionChance: 0.6,
        megaEvolution: true,
    },
    'squirtle': {
        nextForm: 'wartortle',
        requiredTier: 1,
        minClusterSize: 4,
        evolutionChance: 0.75,
    },
    'wartortle': {
        nextForm: 'blastoise',
        requiredTier: 2,
        minClusterSize: 3,
        evolutionChance: 0.9,
    },
    'bulbasaur': {
        nextForm: 'ivysaur',
        requiredTier: 1,
        minClusterSize: 4,
        evolutionChance: 0.75,
    },
    'ivysaur': {
        nextForm: 'venusaur',
        requiredTier: 2,
        minClusterSize: 3,
        evolutionChance: 0.9,
    },
    'mewtwo': {
        nextForm: 'mega_mewtwo_y',
        requiredTier: 3,
        minClusterSize: 1,
        evolutionChance: 0.4,
        megaEvolution: true,
    },
};
function extractSpeciesFromId(id) {
    // Extract species name from cell id (e.g., "tier1_pikachu" -> "pikachu")
    const parts = id.split('_');
    return parts.length > 1 ? parts.slice(1).join('_') : id;
}
/**
 * Enhanced evolution system with complex morphing mechanics
 */
export function performEvolution(grid, rng = Math.random) {
    const rows = grid.length, cols = grid[0].length;
    const bySpecies = new Map();
    // Group cells by species and tier
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = grid[r][c];
            if (cell.kind !== 'standard')
                continue;
            const species = extractSpeciesFromId(cell.id);
            const key = `${species}_tier${cell.tier}`;
            if (!bySpecies.has(key))
                bySpecies.set(key, []);
            bySpecies.get(key).push({ pos: [r, c], cell });
        }
    }
    const evolutionSteps = [];
    // Check evolution conditions for each species group
    for (const [key, cells] of bySpecies.entries()) {
        const [species, tierPart] = key.split('_tier');
        const tier = Number(tierPart);
        if (!EVOLUTION_CHAINS[species] || cells.length < EVOLUTION_CHAINS[species].minClusterSize) {
            continue;
        }
        const evolutionData = EVOLUTION_CHAINS[species];
        // Check if evolution conditions are met
        if (tier >= evolutionData.requiredTier &&
            cells.length >= evolutionData.minClusterSize &&
            rng() < evolutionData.evolutionChance) {
            // Select cells for evolution (prefer larger clusters)
            const evolveCount = Math.min(cells.length, evolutionData.megaEvolution ? cells.length : Math.floor(cells.length * 0.8));
            const cellsToEvolve = cells.slice(0, evolveCount);
            const positions = cellsToEvolve.map(c => c.pos);
            const newTier = evolutionData.megaEvolution ? tier : Math.min(tier + 1, 3);
            evolutionSteps.push({
                fromTier: tier,
                toTier: newTier,
                positions,
                species,
                nextForm: evolutionData.nextForm,
                megaEvolution: evolutionData.megaEvolution,
            });
            // Apply evolution to grid
            for (const [r, c] of positions) {
                grid[r][c] = {
                    kind: 'standard',
                    tier: newTier,
                    id: `tier${newTier}_${evolutionData.nextForm}`,
                };
            }
        }
    }
    return {
        evolved: evolutionSteps.length > 0,
        steps: evolutionSteps,
    };
}
/**
 * Morphing mechanics - symbols can transform into adjacent species
 */
export function performMorphing(grid, rng = Math.random) {
    const morphSteps = [];
    const morphChance = 0.15; // 15% chance for morphing
    const adjacentMorphBonus = 0.3; // Bonus when different species are adjacent
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[0].length; c++) {
            const cell = grid[r][c];
            if (cell.kind !== 'standard' || rng() > morphChance)
                continue;
            const currentSpecies = extractSpeciesFromId(cell.id);
            let morphTarget = null;
            let morphTrigger = 'random';
            // Check for adjacent different species (higher morph chance)
            for (const [nr, nc] of [...neighbors(r, c), ...diagonalNeighbors(r, c)]) {
                if (!inBounds(grid, nr, nc))
                    continue;
                const neighborCell = grid[nr][nc];
                if (neighborCell.kind === 'standard') {
                    const neighborSpecies = extractSpeciesFromId(neighborCell.id);
                    if (neighborSpecies !== currentSpecies && rng() < adjacentMorphBonus) {
                        morphTarget = neighborSpecies;
                        morphTrigger = 'adjacent';
                        break;
                    }
                }
                else if (neighborCell.kind === 'wild' && rng() < 0.4) {
                    // Wild symbols can trigger random morphing
                    const wildInfluenceSpecies = ['pikachu', 'charizard', 'blastoise', 'venusaur'];
                    morphTarget = wildInfluenceSpecies[Math.floor(rng() * wildInfluenceSpecies.length)];
                    morphTrigger = 'wild_influence';
                    break;
                }
            }
            // Random morphing if no adjacent trigger
            if (!morphTarget && rng() < 0.1) {
                const randomSpecies = ['pikachu', 'charmander', 'squirtle', 'bulbasaur', 'eevee'];
                morphTarget = randomSpecies[Math.floor(rng() * randomSpecies.length)];
                morphTrigger = 'random';
            }
            if (morphTarget) {
                morphSteps.push({
                    position: [r, c],
                    fromSpecies: currentSpecies,
                    toSpecies: morphTarget,
                    trigger: morphTrigger,
                });
                // Apply morphing
                grid[r][c] = {
                    kind: 'standard',
                    tier: cell.tier,
                    id: `tier${cell.tier}_${morphTarget}`,
                };
            }
        }
    }
    return {
        morphed: morphSteps.length > 0,
        morphSteps,
    };
}
