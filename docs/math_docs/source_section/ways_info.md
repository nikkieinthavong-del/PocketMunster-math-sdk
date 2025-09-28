# Ways wins evaluation

The `WaysWins` object evaluates winning symbol combinations for the current `self.board` state. Generally 3 or more consecutive symbols result in a win, though these specific combination numbers and payouts can be defined in:

```python
config.paytable = {(kind[int], symbol[string]): payout[float]}
```

The ways calculation will search for like-symbols (or Wilds) on consecutive reels. The maximum number of ways is determined from the board size: `max_ways = (num_rows)^(num_columns)`.
Note: the ways calculation does not account for Wild symbols appearing on the first reel.

The Ways evaluation takes also takes into account multiplier values attached to symbols containing the `multiplier` attribute. Unlike lines calculations where multiplier values are added together for symbols on consecutive reels, the total number of ways is instead multiplied by the multiplier value. Leading to the payout amount to grow substantially more quickly. So for example given the board:

```sh
L5 H1 L4 L4 L4
L1 H4 L3 H2 L4
H1 H1 H1 L3 H3
```

If there is a multiplier value of, say 3x on the `H1` symbol on reel 3, the total ways for symbol `H1` is `(3,H1)` pays:

```sh
(1) * (2) * (3) = 6 ways
```

The `return_data` will include all winning symbol names, number of consecutive like-symbols, winning positions and total win amounts for each unique symbol type. the `meta` tag will additionally include the total number of ways a symbol wins, which will range from `1` to `(num_rows)^(num_columns)` and and additional symbol and/or global multiplier contributions.
