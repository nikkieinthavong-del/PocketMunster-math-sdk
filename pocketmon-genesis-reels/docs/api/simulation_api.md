# Simulation API Documentation

## Overview

The Simulation API provides a set of functions and classes to facilitate the execution of simulations for the PocketMon Genesis Reels game. This API is designed to handle the core mechanics of the game, including generating game boards, finding winning clusters, and calculating payouts based on the game configuration.

## API Endpoints

### 1. Run Simulations

**Endpoint:** `POST /api/simulations/run`

**Description:** Executes a specified number of Monte Carlo simulations to generate game data.

**Request Body:**
```json
{
  "num_simulations": 1000000,
  "bet_amount": 1.0
}
```

**Response:**
```json
{
  "total_payout": 500000.0,
  "total_bet": 1000000.0,
  "win_distribution": [0, 100, 200, ...],
  "feature_triggers": {
    "free_spins": 100,
    "evolution": 50,
    "bonus": 25
  },
  "rtp": 0.95
}
```

### 2. Generate Game Board

**Endpoint:** `GET /api/simulations/generate_board`

**Description:** Generates a game board based on the current reel configurations.

**Response:**
```json
{
  "board": [
    [0, 1, 2, 3, 4, 5, 6],
    [1, 2, 3, 4, 5, 6, 0],
    [2, 3, 4, 5, 6, 0, 1],
    [3, 4, 5, 6, 0, 1, 2],
    [4, 5, 6, 0, 1, 2, 3],
    [5, 6, 0, 1, 2, 3, 4],
    [6, 0, 1, 2, 3, 4, 5]
  ]
}
```

### 3. Find Winning Clusters

**Endpoint:** `POST /api/simulations/find_clusters`

**Description:** Identifies winning clusters on the generated game board.

**Request Body:**
```json
{
  "board": [
    [0, 1, 2, 3, 4, 5, 6],
    ...
  ]
}
```

**Response:**
```json
{
  "clusters": [
    {
      "symbol": 1,
      "positions": [[0, 1], [1, 1], [2, 1]],
      "size": 3
    },
    ...
  ]
}
```

### 4. Calculate Payouts

**Endpoint:** `POST /api/simulations/calculate_payouts`

**Description:** Calculates the payout for a given cluster based on the paytable.

**Request Body:**
```json
{
  "cluster": {
    "symbol": 1,
    "size": 3
  },
  "paytable": {
    "1": { "3": 10.0, "4": 20.0 },
    ...
  }
}
```

**Response:**
```json
{
  "payout": 10.0
}
```

## Error Handling

All API responses will include an error message in the event of a failure. The error response format is as follows:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Detailed error message."
  }
}
```

## Conclusion

The Simulation API is a powerful tool for simulating game mechanics and analyzing outcomes in the PocketMon Genesis Reels game. By utilizing this API, developers can efficiently run simulations, generate game data, and ensure the integrity of game mechanics.