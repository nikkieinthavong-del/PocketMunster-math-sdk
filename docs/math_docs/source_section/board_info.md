## Game Board

The `Board` class inherits the [`GeneraGameState`](state_info.md) class and handles the generation of game boards. Most commonly used is the `create_board_reelstrips()` function. Which selects a reelset as defined in the `BetMode.Distribution.conditions` class. For each reel a random stopping position is chosen with uniform probability on the range _[0,len(reelstrip[reel])-1]_. For each reelstop a 2D list of `Symbol` objects are created and attached to the GameState object.

Additionally, special symbol information is included (_special_symbols_on_board_) along with the reelstop values (_reel_positions_), padding symbols directly above and below the active board (_padding_positions_) and which reelstrip-id was used.

The is also an _anticipation_ field which is used for adding a delay to reel reveals if the number of Scatters required for trigging the freegame is almost satisfied. This is an array of values initialized to `0` and counting upwards in `+1` value increments. For example if 3 Scatter symbols are needed to trigger the freegame and there are Scatters revealed on reels 0 and 1, the array would take the form (for a 5 reel game):

```python
self.anticipation = [0, 0, 1, 2, 3]
```

If the selected reel_pos + the length of the board is greater than the total reelstrip length, the stopping position is wrapped around to the 0 index:

```python
 self.reelstrip[reel][(reel_pos - 1) % len(self.reelstrip[reel])]
```

The reelset used is drawn from the weighted possible reelstrips as defined in the `BetMode.betmode.distributions.conditions` class (and hence is a required field in the `BetMode` object):

```python
    self.reelstrip_id = get_random_outcome(
        self.get_current_distribution_conditions()["reel_weights"][self.gametype]
    )
```

Specific stopping positions can also be forced given a reelstrip-id and integer stopping values from `force_board_from_reelstrips()`. If no integer value are provided for a reel, a random position is chosen. This function is typically used in conjunction with `executables.force_special_board`, which will search a reelstrip for a particular symbol name and randomly select a specified number of stopping positions, chosen to land on a randomly selected board row.

Additionally the `Board` class handled symbol generation, displaying the current `.board` in the terminal, and retrieving symbol positions and properties as defined in `config.special_symbols`.
