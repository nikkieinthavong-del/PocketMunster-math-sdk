# Game API Documentation

## Overview

The Game API provides a set of endpoints and methods for interacting with the PocketMon Genesis Reels game. This API allows developers to integrate game functionalities, retrieve game state, and manage player interactions.

## API Endpoints

### 1. Start Game

**Endpoint:** `POST /api/game/start`

**Description:** Initializes a new game session.

**Request Body:**
```json
{
  "playerId": "string",
  "betAmount": "number"
}
```

**Response:**
```json
{
  "sessionId": "string",
  "initialBoard": "array",
  "message": "string"
}
```

### 2. Spin Reels

**Endpoint:** `POST /api/game/spin`

**Description:** Executes a spin on the reels.

**Request Body:**
```json
{
  "sessionId": "string"
}
```

**Response:**
```json
{
  "board": "array",
  "totalWin": "number",
  "events": "array"
}
```

### 3. Get Game State

**Endpoint:** `GET /api/game/state`

**Description:** Retrieves the current state of the game.

**Query Parameters:**
- `sessionId`: The ID of the game session.

**Response:**
```json
{
  "sessionId": "string",
  "currentBoard": "array",
  "totalBet": "number",
  "totalWin": "number",
  "events": "array"
}
```

### 4. End Game

**Endpoint:** `POST /api/game/end`

**Description:** Ends the current game session and retrieves final results.

**Request Body:**
```json
{
  "sessionId": "string"
}
```

**Response:**
```json
{
  "finalResults": {
    "totalBet": "number",
    "totalWin": "number",
    "message": "string"
  }
}
```

## Error Handling

All API responses will include an error object in case of failure:

```json
{
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

## Conclusion

This API documentation provides the necessary endpoints for integrating and managing the PocketMon Genesis Reels game. For further details on specific functionalities, please refer to the respective sections in the documentation.