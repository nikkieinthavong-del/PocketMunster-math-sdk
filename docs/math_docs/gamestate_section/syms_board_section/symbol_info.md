# Symbol structure

Symbols are handled as their own distinct class objects. Based only off a symbol name, several useful attibutes are assigned to the object based on if the symbol name appears in in the `config.paytable` or `config.special_symbols` fields.

```python
class Symbol:
    def __init__(self, config: object, name: str) -> None:
        self.name = name
        self.special_functions = []
        self.special = False
        is_special = False
        for special_property in config.special_symbols.keys():
            if name in config.special_symbols[special_property]:
                setattr(self, special_property, True)
                is_special = True

        if is_special:
            setattr(self, "special", True)

        self.assign_paying_bool(config)
```

When a new game-board is drawn, a 2D array of symbol objects are generated. At a minimum, the symbol will have the attributes:

- Name
  - [string] shorthand name, typically 1 or 2 letters
- special_functions
  - Within the `GameStateOverride` class, special functions can be applied to a symbol as soon as the object is created. This is done through the abstract function, for example:

```python
def assign_special_sym_function(self):
    self.special_symbol_functions = {
        "W": [self.assign_mult_property],
    }
def assign_mult_property(self, symbol):
    multiplier_value = get_random_outcome(
        self.get_current_distribution_conditions()["mult_values"][self.gametype]
    )
    symbol.assign_attribute({"multiplier": multiplier_value})
```

    `assign_special_sym_function()` is called when the `GameState` is initially created. In this example, we are assigning a multiplier value to any new wild ('W') which is created. Any action defined within `self.special_symbol_functions` with the format `{<name>: @callable_func}` will be assigned to the `special_functions` property.

- is_special
  - This property is assigned as `False` by default unless the name appears as a value within `config.special_symbols`
- special_property
  - Properties appearing in `config.special_functions = {'property': [name]}` are set to `True` by default.
- assign_paying_bool()
  - This function assigns the properties `is_paying` and `paytable`. If the symbol name appears in `config.paytable` `is_paying` is set to `True` and the relevant paytable values are assigned to `paytable`. Otherwise these values are set to `False` and `None` respectively.

## Symbol Attributes

In addition to the application of `special_functions`, attributes are an important characteristic of symbol objects, particularly for checking if there are any special symbols on the game-board which require additional actions. For example if we want to check if a given symbol has a `prize` or `multiplier` attribute:

```python
if self.board[reel][row].check_attribute('prize','multiplier'):
    ...
```

The `check_attribute` function will return a `boolean` value if the given attribute exists and its value is not `False`. I.e.:

```python
if symbol.check_attribute('prize'):
    win += symbol.get_attribute('prize')
```

Furthermore we can assign properties to a symbol using the `assign_attribute` method. As an example, if we have a game where we have a special symbol denoted by the `enhance` tag. Where the effect of this symbol is to add a `multiplier` value to any active `Wild` symbols. In the `gamestate` we could preform the following actions:

```python
if len(self.special_symbols_on_board['enhance']) > 0:
    for sym in self.special_symbols_on_board[wild]:
        mult_val = get_random_outcomes(self.config.mult_values[self.gametype])
        self.board[sym['reel']][sym['row']].assign_attribute({'multiplier', mult_val})
```
