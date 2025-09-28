# Win calculations

There are several built-in win methods included in the engine:

1. Lines pays
2. Ways pays
3. Cluster pays
4. Scatter pays

###

Irrespective of the win method applied, win information is stored in the gamestate object win_data:

```python
 win_data = {
    'totalWin': [float],
    'wins': [List[Dict]]
 }
```

This initialized `win_data` structure is the return value for all provided win calculation functions. If using the predefined win events, the dictionary items within `wins` must contain the "position" key to account for modifying the row number if needed for the padding symbols. All wins information for the current game board should be included in this structure. Such as all winning symbol combinations, win amounts and positions. The built-in functions also include a `meta' key which includes any additional information which the front-end may need to display. For the win-lines, as an example this appears as:

```python
'wins': {
    'symbol': 'H1',
    'kind': 5,
    'win': 300,
    'positions': [{'reel':1, 'row':1}, ...],
    'meta':{
        'lineIndex': 12,
        'multiplier': 10,
        'winWithoutMult': 30,
        'globalMult': 1,
        'lineMultiplier': 10
    }
}
```

This additional information includes any symbol or global multiplier values applied, the base win amount, and the `lineIndex`, as defined in config.paylines = {[], ...}``

### Multiplier methods

For generality all win methods utilize functions from the `wins/multiplier_strategy` file. By calling `apply_mult()` with a specified strategy (`global`, `symbol`, `combined`), base win amount and winning symbol positions, total win amounts are returned inclusive of any global multipliers or symbol multipliers. By default, if the `combined` or `symbol` strategy is used, multiplier values are added together from winning symbol positions, where the symbol object contains the `multiplier` attribute.

### Overlay values

The cluster and scatter pay sample games, there is an `overlay` key included ine `win_data` "meta" tag of the structure:

```python
'meta': {
    ...
    'overlay': {'reel': [int], 'row': [int]}
}
```

This position is calculated as the board position closest to the centre-of-mass of winning clusters.

### Wallet manager

When writing game logic, the intent is to have a clear separation of logic, events and wins for clarity. The wins are all handled through a `WalletManager` class, which will handle outcomes from single spins while also keeping track of total cumulative win amount for RTP calculations, as well as which gametype the wins arise from.

This can be seen in a typical gamestate `run_spin()` function where wins are calculated, the wallet is updated and corresponding win events are emitted:

```python
self.win_data = self.get_lines()
self.win_manager.update_spinwin(self.win_data["totalWin"])
self.emit_linewin_events()
```

Within a single spin there are wallet manager values associated with:

1. `spin_win`
   - This is the win associated with a specific `reveal` event. If the freegame is entered, this value is reset for each new spin.
   - Updated using `wallet_manager.update_spinwin(win_amount: float)`
2. `running_bet_win`
   - This is the cumulative win amount for a simulation. The final value which the `running_bet_win` is updated with should match the `payout_multiplier` for that simulation.
   - This value is automatically updated with the `wallet_manager.set_spinwin(win_amount: float)` method.
3. `basegame_wins`/`freegame_wins`
   - This value is updated once all basegame actions are completed, or at the end of each freegame spin.
   - Updated using `wallet_manager.update_gametype_wins(self.gametype)`
   - **Important!** As part of the final payout verification _self.final_win_ and _sum(self.basegame_wins + self.freegame_wins)_ must match. If these two payouts do not match a `RuntimeError` is raised.
   - This is useful for game analysis and applying the correct parameters to the optimization algorithm.
4. Cumulative simulation wins
   - `total_cumulative_wins`, `cumulative_base_wins` and `cumulative_free_wins` wins are updated at the end of each simulation. This value is used to display the runtime RTP for all simulations when printed in the terminal.
   - Updated using `wallet_manager.update_end_round_wins()` within the `imprint_wins` function.
