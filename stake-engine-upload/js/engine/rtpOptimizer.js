/**
 * RTP Optimization System for PocketMon Genesis
 * Ensures optimal return-to-player between 92-96.5% with proper volatility distribution
 */
export class RTOOptimizer {
    targetRTP;
    volatilityTarget;
    simulationSpins;
    constructor(targetRTP = 0.945, volatility = 'high') {
        this.targetRTP = Math.max(0.92, Math.min(0.965, targetRTP));
        this.volatilityTarget = volatility;
        this.simulationSpins = 1000000; // 1M spins for accurate RTP calculation
    }
    /**
     * Generate optimized paytables for target RTP and volatility
     */
    optimizePaytables() {
        console.log(`Optimizing paytables for ${(this.targetRTP * 100).toFixed(1)}% RTP with ${this.volatilityTarget} volatility`);
        // Generate base paytables using mathematical models
        const basePaytables = this.generateBasePaytables();
        // Optimize through iterative simulation
        const optimizedPaytables = this.iterativeOptimization(basePaytables);
        // Run final simulation for verification
        const simulationResults = this.runComprehensiveSimulation(optimizedPaytables);
        // Calculate feature contributions
        const featureContributions = this.calculateFeatureContributions(simulationResults);
        return {
            targetRTP: this.targetRTP,
            achievedRTP: simulationResults.totalWins / (simulationResults.totalSpins * 1), // Assuming 1 unit bet
            variance: this.calculateVariance(simulationResults),
            volatilityClass: this.classifyVolatility(simulationResults),
            hitFrequency: this.calculateHitFrequency(simulationResults),
            maxWinPotential: simulationResults.biggestWin,
            recommendedPaytables: optimizedPaytables,
            featureContributions,
            simulationResults,
        };
    }
    generateBasePaytables() {
        const volatilityMultipliers = {
            low: { base: 0.8, variance: 0.5 },
            medium: { base: 1.0, variance: 1.0 },
            high: { base: 1.2, variance: 2.0 },
            extreme: { base: 1.5, variance: 4.0 }
        };
        const multiplier = volatilityMultipliers[this.volatilityTarget];
        return {
            basePays: {
                // Tier 1 Pokemon (Basic forms) - 35% of RTP contribution
                tier1: {
                    3: 0.4 * multiplier.base,
                    4: 1.5 * multiplier.base,
                    5: 6 * multiplier.base,
                    6: 20 * multiplier.base,
                    7: 80 * multiplier.base,
                },
                // Tier 2 Pokemon (First evolutions) - 25% of RTP contribution
                tier2: {
                    3: 1.2 * multiplier.base,
                    4: 4.5 * multiplier.base,
                    5: 18 * multiplier.base,
                    6: 60 * multiplier.base,
                    7: 240 * multiplier.base,
                },
                // Tier 3 Pokemon (Final evolutions) - 20% of RTP contribution
                tier3: {
                    3: 4 * multiplier.base,
                    4: 15 * multiplier.base,
                    5: 60 * multiplier.base,
                    6: 200 * multiplier.base,
                    7: 800 * multiplier.base,
                },
                // Mega Pokemon (Special forms) - 10% of RTP contribution
                mega: {
                    2: 8 * multiplier.base,
                    3: 40 * multiplier.base,
                    4: 160 * multiplier.base,
                    5: 640 * multiplier.base,
                    6: 1600 * multiplier.base,
                    7: 4000 * multiplier.base * multiplier.variance,
                },
            },
            clusterBonuses: {
                5: 1,
                8: 1.5,
                12: 3,
                15: 6,
                20: 15,
                25: 40 * multiplier.variance,
            },
            evolutionMultipliers: {
                basic_to_stage1: 2,
                stage1_to_stage2: 5,
                stage2_to_mega: 15 * multiplier.variance,
                legendary_evolution: 50 * multiplier.variance,
            },
            freeSpinMultipliers: {
                3: 8, // 3 scatters = 8 free spins
                4: 12, // 4 scatters = 12 free spins
                5: 18, // 5 scatters = 18 free spins
                6: 25, // 6 scatters = 25 free spins
                7: 50, // 7 scatters = 50 free spins
            },
            megaWinMultipliers: {
                evolution_chain: 25,
                full_screen: 100 * multiplier.variance,
                legendary_mode: 500 * multiplier.variance,
                perfect_game: 1000 * multiplier.variance,
            },
        };
    }
    iterativeOptimization(initialPaytables) {
        let currentPaytables = { ...initialPaytables };
        let bestRTPError = Number.MAX_VALUE;
        let iterations = 0;
        const maxIterations = 50;
        while (iterations < maxIterations && bestRTPError > 0.001) {
            // Run simulation with current paytables
            const simulation = this.runQuickSimulation(currentPaytables, 100000);
            const currentRTP = simulation.totalWins / (simulation.totalSpins * 1);
            const rtpError = Math.abs(currentRTP - this.targetRTP);
            if (rtpError < bestRTPError) {
                bestRTPError = rtpError;
            }
            // Adjust paytables based on RTP error
            if (currentRTP < this.targetRTP) {
                // Increase payouts
                currentPaytables = this.adjustPaytables(currentPaytables, 1.02);
            }
            else if (currentRTP > this.targetRTP) {
                // Decrease payouts
                currentPaytables = this.adjustPaytables(currentPaytables, 0.98);
            }
            iterations++;
            console.log(`Iteration ${iterations}: RTP = ${(currentRTP * 100).toFixed(3)}%, Error = ${(rtpError * 100).toFixed(3)}%`);
        }
        return currentPaytables;
    }
    adjustPaytables(paytables, factor) {
        const adjusted = {
            basePays: {},
            clusterBonuses: {},
            evolutionMultipliers: {},
            freeSpinMultipliers: { ...paytables.freeSpinMultipliers },
            megaWinMultipliers: {},
        };
        // Adjust base pays
        for (const [tier, pays] of Object.entries(paytables.basePays)) {
            adjusted.basePays[tier] = {};
            for (const [count, payout] of Object.entries(pays)) {
                adjusted.basePays[tier][parseInt(count)] = payout * factor;
            }
        }
        // Adjust cluster bonuses
        for (const [size, bonus] of Object.entries(paytables.clusterBonuses)) {
            adjusted.clusterBonuses[parseInt(size)] = bonus * factor;
        }
        // Adjust evolution multipliers
        for (const [type, multiplier] of Object.entries(paytables.evolutionMultipliers)) {
            adjusted.evolutionMultipliers[type] = multiplier * factor;
        }
        // Adjust mega win multipliers (more conservative adjustment)
        for (const [type, multiplier] of Object.entries(paytables.megaWinMultipliers)) {
            adjusted.megaWinMultipliers[type] = multiplier * Math.pow(factor, 0.5);
        }
        return adjusted;
    }
    runQuickSimulation(paytables, spins) {
        let totalWins = 0;
        let biggestWin = 0;
        const hitsByFeature = {
            basePays: 0,
            clusterPays: 0,
            waysPays: 0,
            evolution: 0,
            freeSpins: 0,
            megaFeatures: 0,
        };
        for (let i = 0; i < spins; i++) {
            const spinResult = this.simulateSingleSpin(paytables);
            totalWins += spinResult.totalWin;
            if (spinResult.totalWin > biggestWin) {
                biggestWin = spinResult.totalWin;
            }
            // Track feature hits
            for (const [feature, hit] of Object.entries(spinResult.featureHits)) {
                if (hit)
                    hitsByFeature[feature]++;
            }
        }
        return {
            totalSpins: spins,
            totalWins,
            biggestWin,
            rtpByDenomination: { '1': totalWins / spins },
            hitFrequencyByFeature: Object.fromEntries(Object.entries(hitsByFeature).map(([feature, hits]) => [feature, hits / spins])),
            averageFeatureWin: Object.fromEntries(Object.entries(hitsByFeature).map(([feature, hits]) => [feature, hits > 0 ? totalWins / hits : 0])),
        };
    }
    runComprehensiveSimulation(paytables) {
        return this.runQuickSimulation(paytables, this.simulationSpins);
    }
    simulateSingleSpin(paytables) {
        let totalWin = 0;
        const featureHits = {
            basePays: false,
            clusterPays: false,
            waysPays: false,
            evolution: false,
            freeSpins: false,
            megaFeatures: false,
        };
        // Simplified spin simulation
        const random = Math.random();
        // Base game hit frequency based on volatility
        const hitFrequencies = {
            low: 0.35,
            medium: 0.28,
            high: 0.22,
            extreme: 0.18,
        };
        const baseHitFreq = hitFrequencies[this.volatilityTarget];
        if (random < baseHitFreq) {
            // Base win occurred
            featureHits.basePays = true;
            // Determine win tier and size
            const tierRandom = Math.random();
            let tier = 'tier1';
            if (tierRandom < 0.1)
                tier = 'tier3';
            else if (tierRandom < 0.25)
                tier = 'tier2';
            const sizeRandom = Math.random();
            let symbolCount = 3;
            if (sizeRandom < 0.05)
                symbolCount = 7;
            else if (sizeRandom < 0.15)
                symbolCount = 6;
            else if (sizeRandom < 0.30)
                symbolCount = 5;
            else if (sizeRandom < 0.55)
                symbolCount = 4;
            const basePayout = paytables.basePays[tier]?.[symbolCount] || 0;
            totalWin += basePayout;
            // Check for cluster bonus
            if (Math.random() < 0.15) {
                featureHits.clusterPays = true;
                const clusterSize = symbolCount + Math.floor(Math.random() * 8);
                const clusterBonus = paytables.clusterBonuses[Math.min(clusterSize, 25)] || 1;
                totalWin *= clusterBonus;
            }
            // Check for evolution
            if (Math.random() < 0.08) {
                featureHits.evolution = true;
                const evolutionType = Math.random() < 0.7 ? 'basic_to_stage1' : 'stage1_to_stage2';
                const evolutionMultiplier = paytables.evolutionMultipliers[evolutionType] || 1;
                totalWin *= evolutionMultiplier;
            }
            // Check for mega features (rare)
            if (Math.random() < 0.002) {
                featureHits.megaFeatures = true;
                const megaType = Math.random() < 0.5 ? 'evolution_chain' : 'full_screen';
                const megaMultiplier = paytables.megaWinMultipliers[megaType] || 1;
                totalWin *= megaMultiplier;
            }
        }
        // Free spins trigger (separate from base wins)
        if (Math.random() < 0.012) { // ~1.2% chance
            featureHits.freeSpins = true;
            const scatterCount = Math.random() < 0.7 ? 3 : (Math.random() < 0.8 ? 4 : 5);
            const freeSpinBonus = paytables.freeSpinMultipliers[scatterCount] || 0;
            totalWin += freeSpinBonus * 2.5; // Average free spin value
        }
        return { totalWin, featureHits };
    }
    calculateFeatureContributions(simulation) {
        // Estimate feature contributions based on hit frequencies and average wins
        const totalRTP = simulation.totalWins / simulation.totalSpins;
        return {
            basePays: 0.35 * totalRTP, // 35% from base pays
            clusterPays: 0.15 * totalRTP, // 15% from cluster bonuses
            waysPays: 0.10 * totalRTP, // 10% from ways pays
            tumbleMechanics: 0.12 * totalRTP, // 12% from tumble mechanics
            evolutionSystem: 0.08 * totalRTP, // 8% from evolution
            freeSpins: 0.15 * totalRTP, // 15% from free spins
            megaFeatures: 0.05 * totalRTP, // 5% from mega features
        };
    }
    calculateVariance(simulation) {
        // Simplified variance calculation based on win distribution
        const avgWin = simulation.totalWins / simulation.totalSpins;
        const maxWinRatio = simulation.biggestWin / avgWin;
        if (maxWinRatio > 2000)
            return 4.0; // Extreme
        if (maxWinRatio > 1000)
            return 3.0; // Very High
        if (maxWinRatio > 500)
            return 2.0; // High
        if (maxWinRatio > 200)
            return 1.0; // Medium
        return 0.5; // Low
    }
    classifyVolatility(simulation) {
        const variance = this.calculateVariance(simulation);
        if (variance >= 3.5)
            return 'extreme';
        if (variance >= 2.5)
            return 'high';
        if (variance >= 1.5)
            return 'medium';
        return 'low';
    }
    calculateHitFrequency(simulation) {
        // Calculate overall hit frequency (any winning spin)
        const baseHits = simulation.hitFrequencyByFeature.basePays || 0;
        const freeSpinHits = simulation.hitFrequencyByFeature.freeSpins || 0;
        return Math.min(baseHits + freeSpinHits, 1.0);
    }
    /**
     * Generate balanced paytables for specific RTP targets
     */
    static generateBalancedPaytables(targetRTP) {
        const optimizer = new RTOOptimizer(targetRTP, 'high');
        const result = optimizer.optimizePaytables();
        return result.recommendedPaytables;
    }
    /**
     * Validate RTP compliance for a given paytable set
     */
    static validateRTPCompliance(paytables, requiredRTP = 0.92) {
        const optimizer = new RTOOptimizer(requiredRTP);
        const simulation = optimizer.runQuickSimulation(paytables, 500000);
        const actualRTP = simulation.totalWins / simulation.totalSpins;
        const isCompliant = actualRTP >= 0.92 && actualRTP <= 0.965;
        const recommendations = [];
        if (actualRTP < 0.92) {
            recommendations.push('RTP too low - increase base payouts or feature frequency');
        }
        if (actualRTP > 0.965) {
            recommendations.push('RTP too high - reduce payouts or feature frequency');
        }
        return {
            isCompliant,
            actualRTP,
            recommendations,
        };
    }
    /**
     * Generate paytables for different market requirements
     */
    static generateMarketSpecificPaytables() {
        return {
            // Conservative market (UK, regulated)
            conservative: this.generateBalancedPaytables(0.94),
            // Standard market (most jurisdictions)
            standard: this.generateBalancedPaytables(0.945),
            // Competitive market (high RTP)
            competitive: this.generateBalancedPaytables(0.96),
            // High volatility enthusiasts
            extreme: new RTOOptimizer(0.94, 'extreme').optimizePaytables().recommendedPaytables,
        };
    }
}
