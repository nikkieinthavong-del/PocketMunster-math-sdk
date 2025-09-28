#Active Game Board

The active game-board is created as a 2D array of symbol objects. Each object within the array creates a new object instance.

### Displaying the board

The board can be displayed by calling the `print_board()` method in the `Board` class, which will display a correctly orientated printout of all symbol names

```python
self.print_board(self.board) ->
```

```sh
L5 L3 L4 L4 L4
L3 H4 L3 H1 L4
L3 H1 S  L3 H1
```

### Active special symbols

When the game board is generated any symbols appearing in `config.special_symbols = {'property' : [symbols, ..]}` will be appended to the gamestate property `special_symbols_on_board = {'property': [{'reel': reel[int], 'row': row[int]}]}`. This property is particularly useful for checking aspects such as freegame entry conditions:

```python
    if len(self.special_symbols_on_board['scatter']) >= min_scatter:
        self.run_freespin_from_base()
```

Care should be taken to update any new symbols which may appear on the board either from cascading events or through the application of some special action, such as removing symbols from the game board. If custom functions are being used which involve altering active symbols, the method `get_special_symbols_on_board()` from the `Board` class should be invoked.

### Tumbling the board

For cascading games (such as the Scatter and Cluster example games), winning symbols are removed from the board and symbols above _tumble_ down to fill these vacant positions. Winning symbols are assigned the attribute `explode`. Subsequently when the `tumble_board()` method is called from the `Tumble` class,

### Top/bottom symbols

In the `config` class, there is a boolean option `include_padding`. This is to account for games where it is desirable for the player to see the symbols immediately above/below the active board. Usually this is displayed as a symbol being partially in-frame. If this flag is set to true, the row indexing for the active game board will start at `row=1`, where `row 0` is the `top_symbol` and `row len(board) + 1` is the `bottom_symbol`. The top and bottom symbols are included in the `board` `reveal` event. Within the gamestate these symbols are stored as:

```python
self.top_symbols = [s1, s2, ....]
self.bottom_symbols = [s1, s2, ....]
```

Note that for cascading/tumbling games, the top symbol is preserved during the tumble.
