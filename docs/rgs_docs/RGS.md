

# RGS Endpoints

This specification outlines the API endpoints available to providers for communicating with the Stake Engine. These APIs enable key operations such as creating bets, completing bets, validating sessions, and retrieving player balances.

# Introduction

This document defines how the provider’s frontend communicates with the Stake Engine endpoints. It includes a detailed description of the core API functionality, along with the corresponding request and response structures.

# URL Structure

Games are hosted under a predefined URL. Providers should use the parameters below to interact with the RGS on behalf of the user and correctly display game information.

```
https://{{.TeamName}}.cdn.stake-engine.com/{{.GameID}}/{{.GameVersion}}/index.html?sessionID={{.SessionID}}&lang={{.Lang}}&device={{.Device}}&rgs_url={{.RgsUrl}}
```

### Query Params in URL

| Field     | Description                                                                                                                           |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| sessionID | Unique session ID for the player. Required for all requests made by the game.                                                         |
| lang      | Language in which the game will be displayed.                                                                                         |
| device    | Specifies 'mobile' or 'desktop'.                                                                                                      |
| rgs_url   | The URL used for authentication, placing bets, and completing rounds. This URL should not be hardcoded, as it may change dynamically. |

## Language

The `lang` parameter should be an [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes) language code.

Supported languages:

- `ar` (Arabic)
- `de` (German)
- `en` (English)
- `es` (Spanish)
- `fi` (Finnish)
- `fr` (French)
- `hi` (Hindi)
- `id` (Indonesian)
- `ja` (Japanese)
- `ko` (Korean)
- `pl` (Polish)
- `pt` (Portuguese)
- `ru` (Russian)
- `tr` (Turkish)
- `vi` (Vietnamese)
- `zh` (Chinese)

# Understanding Money

Monetary values in the Stake Engine are integers with **six decimal places** of precision:

| Value       | Actual Amount |
| ----------- | ------------- |
| 100,000     | 0.1           |
| 1,000,000   | 1             |
| 10,000,000  | 10            |
| 100,000,000 | 100           |

For example, to place a $1 bet, pass `"1000000"` as the amount.

Currency impacts **only** the display layer; it does not affect gameplay logic.

## Supported Currencies

- USD (United States Dollar)
- CAD (Canadian Dollar)
- JPY (Japanese Yen)
- EUR (Euro)
- RUB (Russian Ruble)
- CNY (Chinese Yuan)
- PHP (Philippine Peso)
- INR (Indian Rupee)
- IDR (Indonesian Rupiah)
- KRW (South Korean Won)
- BRL (Brazilian Real)
- MXN (Mexican Peso)
- DKK (Danish Krone)
- PLN (Polish Złoty)
- VND (Vietnamese Đồng)
- TRY (Turkish Lira)
- CLP (Chilean Peso)
- ARS (Argentine Peso)
- PEN (Peruvian Sol)

### Social Casino Currencies

- XGC (Gold)
- XSC (Stake Cash)

# Bet Levels

Although bet levels are not mandatory, bets must satisfy these conditions:

1. The bet must fall between `minBet` and `maxBet` (returned from `/wallet/authenticate`).
2. The bet must be divisible by `stepBet`.

It is recommended to use the predefined `betLevels` to guide players.

Example:

```json
{
  "minBet": 100000,
  "maxBet": 1000000000,
  "stepBet": 10000,
  "betLevels": [
    100000, // $0.10
    200000,
    400000,
    600000,
    ...
    1000000000 // $1000
  ]
}
```

# Bet Modes / Cost Multipliers

Games may have multiple bet modes defined in the game configuration. Refer to the [Math SDK Documentation](https://carrot-engineering.github.io/math-sdk/math_docs/gamestate_section/configuration_section/betmode_overview/).

When making a play request:

```
Player debit amount = Base bet amount × Bet mode cost multiplier
```

# Wallet

The wallet endpoints enable interactions between the RGS and the Operator's Wallet API, managing the player's session and balance operations.

## Authenticate Request

Validates a `sessionID` with the operator. This must be called before using other wallet endpoints. Otherwise, they will throw `ERR_IS` (invalid session).

### Round

The `round` returned may represent a currently active or the last completed round. Frontends should continue the round if it remains active.

### Request

```http
POST /wallet/authenticate
```

```json
{
  "sessionID": "xxxxxxx",
}
```

### Response

```json
{
  "balance": {
    "amount": 100000,
    "currency": "USD"
  },
  "config": {
    "minBet": 100000,
    "maxBet": 1000000000,
    "stepBet": 100000,
    "defaultBetLevel": 1000000,
    "betLevels": [...],
    "jurisdiction": {
      "socialCasino": false,
      "disabledFullscreen": false,
      "disabledTurbo": false,
      ...
    }
  },
  "round": { ... }
}
```

## Balance Request

Retrieves the player’s current balance. Useful for periodic balance updates.

### Request

```http
POST /wallet/balance
```

```json
{
  "sessionID": "xxxxxx"
}
```

### Response

```json
{
  "balance": {
    "amount": 100000,
    "currency": "USD"
  }
}
```

## Play Request

Initiates a game round and debits the bet amount from the player's balance.

### Request

```json
{
  "amount": 100000,
  "sessionID": "xxxxxxx",
  "mode": "BASE"
}
```

### Response

```json
{
  "balance": {
    "amount": 100000,
    "currency": "USD"
  },
  "round": { ... }
}
```

## End Round Request

Completes a round, triggering a payout and ending all activity for that round.

### Request

```http
POST /wallet/end-round
```

```json
{
  "sessionID": "xxxxxx"
}
```

### Response

```json
{
  "balance": {
    "amount": 100000,
    "currency": "USD"
  }
}
```

# Game Play

## Event

Tracks in-progress player actions during a round. Useful for resuming gameplay if a player disconnects.

### Request

```http
POST /bet/event
```

```json
{
  "sessionID": "xxxxxx",
  "event": "xxxxxx"
}
```

### Response

```json
{
  "event": "xxxxxx"
}
```

# Response Codes

Stake Engine uses standard HTTP response codes (200, 400, 500) with specific error codes.

## 400 – Client Errors

| Status Code | Description                                |
| ----------- | ------------------------------------------ |
| ERR_VAL     | Invalid Request                            |
| ERR_IPB     | Insufficient Player Balance                |
| ERR_IS      | Invalid Session Token / Session Timeout    |
| ERR_ATE     | Failed User Authentication / Token Expired |
| ERR_GLE     | Gambling Limits Exceeded                   |
| ERR_LOC     | Invalid Player Location                    |

## 500 – Server Errors

| Status Code     | Description                   |
| --------------- | ----------------------------- |
| ERR_GEN         | General Server Error          |
| ERR_MAINTENANCE | RGS Under Planned Maintenance |



## Math Publication File Formats

When publishing math results, ensure that the [file-format](../rgs_docs/data_format.md) is abided by. These are strict conditions for successful math file publication. 