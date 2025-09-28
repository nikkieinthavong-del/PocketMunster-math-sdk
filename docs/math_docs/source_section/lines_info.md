# Line wins evaluation

The `LinesWins` object evaluates winning symbol combinations for the current `self.board` state. Generally 3 or more consecutive symbols result in a win, though these specific combination numbers and payouts can be defined in:

```python
config.paytable = {(kind[int], symbol[string]): payout[float]}
```

In order to identify winning lines, line arrays must be defined in:

```python
config.paylines = {
    0: [0,0,0,0,0],
    1: [0,1,0,1,0],
        ...
    }
```

in the `.paylines` dictionary, the key is the line-index and the value is an array dictating which rows result in a winning combination. Like symbols are matched and if the key `(kind, name)` exists in `self.paytable`, the corresponding win is evaluated.

Custom keys used to identify **wild** attributes and symbol names can be explicitly set and will default to `"wild"` and `"W"` unless otherwise specified. In the case of `(kind, "W")` existing in `self.paytable`, the base payout value is checked against the `(kind, sym)` where _sym_ is the first non-wild. If for example the payline `[0,0,0,0,0]` has the symbol combination `[W,W,W,L4,L4]`, resulting in wins `(3,"W")` or `(5,"L4")`. We compare both outcomes and determine that the three-kind Wild combination has a larger payout. Therefore we only take the first three symbols as the winning combination. Note that the sample lines calculation provided will only take into account the base-game wins. If the game is more complex, such as having multipliers on symbols, the final payout amount may need to be handled separately when deciding which winning combination to use. One common approach to dealing with this is to only define the Wild symbols to pay when there is a complete line (so only 5-kind Wilds would pay for a board of this size).

The `get_lines()` evaluation function returns all win information including the winning symbol name, winning positions, number of consecutive matches and win amounts. The `meta` information also includes symbol and global multiplier information, as well as the index of winning lines as defined in `config.paylines = {index: [line], ... }.
