# Game Configuration Files

The GameState object requires certain parameters to be specified, and should be manually filled out for each new game. These elements are all defined in the `__init__` function. Full details of the expected inputs and data-types are given in the [Source Files/Config](../../source_section/config_info.md) section.

General aspects of the game setup which should be considered when creating a `game_config.py` are:

#### Game-types

Several parts of the engine such as win amount verification, special symbol triggers/attributes and win-levels require the engine to know if the current state of the game is in the _basegame_ or _freegame_. For example it is common to perform a weighted draw of some value:

```python
#Within game config:
self.multiplier_values = {
   "basegame":{1:100, 2:50, 3: 10},
   "freegame":{2:20, 3:50, 5: 20, 10:10, 20:1}}
....
#Within gamestate:
multiplier = get_random_outcome(self.config.multiplier_values[self.gametype])
```

Typically special rules apply when the player enters a freegame. The configuration file allows the user to specify the key corresponding to each gametype. By default this is set to `basegame` and `freegame` respectively. All simulations will start in the basegame mode unless otherwise specified, and the transition to the freegame state is handled in the default `reset_fs_spin()` function, which is called as soon as the `run_freespin()` function is entered.

#### Reels

Most games will use distinct reelstrips for different game-types. It is commonplace for game-modes to have multiple possible reels per mode. One method of adjusting the overall RTP of a game is to have a multiple reelstrips with varying RTP, which can be selected from a weighted draw when calling `self.create_board_from_reelstrips()`. Reelstrips are stored as a dictionary in the `self.config.reels` object. The reelstrip key and csv file name should be specified:

```python
reels = {"BR0": "BR0.csv", "FR0": "FR0.csv"}
self.reels = {}
for r, f in reels.items():
    self.reels[r] = self.read_reels_csv(str.join("/", [self.reels_path, f]))
```

Reelstrip weightings are required [distribution conditions]('gamestate_section/configuration_section/betmode_dist.md/'). An example of using multiple reelstrips for each gametype can be applied as:

```python
conditions={
    "reel_weights": {self.basegame_type: {"BR0": 2, "BR1": 1}, self.freegame_type: {"FR0":5, "FR1": 1}},
},
```

#### Scatter triggers and Anticipation

Freegame entry from the basegame or retriggers in the freegame should be specified in the format `{num_scatters: num_spins}`,

```python
self.freespin_triggers = {
    self.basegame_type: {3: 10, 4: 15, 5: 20},
    self.freegame_type: {2: 4, 3: 6, 4: 8, 5: 10},
}
```

#### Symbol initialization

A symbol is determined to be valid if the name exists either in `self.paytable` or in `self.special_symbols`. If a symbol that does not exist in either of these fields is detected when loading reelstrips, a `RuntimeError` is raised.

#### Symbol values

Winning symbols are determined from the `self.paytable` dictionary object in the game configuration. The expected format is:

```python
self.paytable = {
    (kind[int], name[str]): value[float],
    ...
}
```

Where `kind` is the number of winning symbols. For cascading games, or other circumstances where multiple winning symbol numbers pay the same about, for example in the [scatter pays example game]('sample_section/sample_games.md') where 13+ symbols pay the same amount, `self.pay_group` can be defined. By then calling `self.paytable = self.convert_range_table(pay_group)` a paytable of the expected format is generated. The format of the pay-group objects (inclusive of both values in the kind-range) is given as:

```python
self.pay_group = {
    ((min_kind[int],max_kind[int]), name[str]): value[float],
    ...
}
```

#### Special symbols

Special symbol attributes are assigned based on names appearing in `self.special_symbols = {attribute[str]: [name[str], ...]}`. Multiple symbols can share attributes and multiple attributes can be applied to the same symbol. Most games will at least have a `wild` and `scatter` attribute. Once the symbol is initialized, the value of the attribute is accessed through `symbol.attribute` or symbol.get_attribute(attribute) [see Symbols for more information]('gamestate_section/syms_board_section/symbol_info.md') regarding symbol object structures. By default the attribute is set to `True`, unless otherwise overridden using the `gamestate.special_symbol_functions`, defined in the gamestate override.
