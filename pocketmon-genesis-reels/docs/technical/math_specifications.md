# Technical Specifications for the Math Engine

## Overview

The math engine for PocketMon Genesis Reels is designed to handle the core mathematical operations required for the game, including probability calculations, payout structures, and simulation of game mechanics. This document outlines the key components and their functionalities.

## Components

### 1. Symbol Management

- **Symbols**: Each symbol in the game is represented by an instance of the `Symbol` class, which includes properties such as name, base value, and special attributes (wild, scatter, bonus).
- **Symbol Configuration**: The `PocketMonGenesisReelsConfig` class manages the creation and configuration of symbols, including defining their weights and special properties.

### 2. Reel Strips

- **ReelStrip Class**: Represents a single reel strip containing symbols and their associated weights. The class calculates cumulative weights for efficient symbol selection during spins.
- **Reel Configuration**: The configuration for each of the seven reels is defined within the `PocketMonGenesisReelsConfig` class, allowing for varied gameplay experiences.

### 3. Probability Engine

- **Random Number Generation**: Utilizes a parallel random number generator to ensure fair and unpredictable outcomes during spins.
- **Board Generation**: The `generate_board` function creates a 7x7 game board by selecting symbols based on their weights, ensuring that the distribution aligns with the defined probabilities.

### 4. Cluster Detection

- **Finding Clusters**: The engine implements a connected components algorithm to identify winning clusters of symbols on the board. Clusters must meet a minimum size requirement to qualify for payouts.
- **Cluster Payout Calculation**: The `calculate_cluster_payout` function computes payouts based on the size of the cluster and the defined paytable for each symbol.

### 5. Evolution and Bonus Mechanics

- **Evolution Rules**: The engine supports evolution mechanics, allowing certain symbols to evolve into others based on predefined rules and conditions.
- **Bonus Triggers**: The configuration includes mechanisms for triggering bonus features, such as free spins, based on specific symbol combinations.

### 6. Simulation and Optimization

- **Monte Carlo Simulations**: The engine can run extensive Monte Carlo simulations to analyze game performance, RTP (Return to Player), and volatility.
- **Optimization**: The `GameOptimizer` class allows for the adjustment of symbol weights to achieve target RTP values while adhering to game design constraints.

## Performance Metrics

- **Return to Player (RTP)**: The target RTP for the game is set at 96.52%. The engine is designed to ensure that actual RTP remains within acceptable limits through rigorous testing and optimization.
- **Volatility**: The volatility of the game is calculated based on win distribution and cluster payouts, providing insights into the risk and reward balance of the game.

## Conclusion

The math engine for PocketMon Genesis Reels is a robust system designed to deliver a fair and engaging gaming experience. Through careful management of symbols, probabilities, and game mechanics, it ensures that players enjoy a balanced and entertaining game while maintaining the integrity of the underlying mathematics.