Add a focused test ensuring `calculateWaysWins` multiplies position-based multipliers into the payout:

- 2x3 uniform grid, multiplierMap boosts two positions (2x and 3x)
- Asserts: ways=8, multiplier>=6, winAmount>=48

Notes:
- Tests-only, no runtime changes
- Validated locally: test suite passes (30/30)
