"""Handle symbol classes and initial generation."""

from typing import Dict, Any, Callable


class SymbolStorage:
    """Initial symbol generation from configuration file."""

    def __init__(self, config: Any, all_symbols: list):
        self.config = config
        self.symbols: Dict[str, Symbol] = {}
        for symbol in all_symbols:
            self.symbols[symbol] = Symbol(self.config, symbol)

    def create_symbol_state(self, symbol_name: str) -> "Symbol":
        """Create new symbol class instance."""
        return Symbol(self.config, symbol_name)

    def get_symbol(self, name: str) -> "Symbol":
        """Retrieve symbol class from name."""
        if name not in self.symbols:
            self.symbols[name] = Symbol(self.config, name)
        return self.symbols[name]


class Symbol:
    """Create symbol from name (string) and assign relevant attributes and special functions."""

    def __init__(self, config: Any, name: str) -> None:
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

    def register_special_function(self, special_function: Callable[["Symbol"], None]) -> None:
        """Assign special symbol function."""
        self.special_functions.append(special_function)

    def apply_special_function(self) -> None:
        """Apply registered symbol function."""
        for fun in self.special_functions:
            fun(self)

    def assign_paying_bool(self, config: Any) -> None:
        """Extract paytable from a given symbol."""
        paying_symbols = set()
        pay_value = []
        for tup, val in config.paytable.items():
            assert isinstance(tup[1], str), "paytable expects string for symbol name, (kind, symbol): value"
            paying_symbols.add(tup[1])
            if self.name == tup[1]:
                pay_value.append({str(tup[0]): val})
        if self.name not in list(paying_symbols):
            self.is_paying = False
            self.paytable = None
        else:
            self.is_paying = True
            self.paytable = pay_value

    def is_special(self) -> bool:
        """Boolean if symbol has any special properties."""
        return self.special

    def check_attribute(self, *args) -> bool:
        """Check if an attribute exists in a given list."""
        for arg in args:
            if hasattr(self, arg) and (not (isinstance(getattr(self, arg), bool)) or getattr(self, arg) is True):
                return True
        return False

    def get_attribute(self, attribute) -> type:
        """Return existing attribute value."""
        return getattr(self, attribute)

    def assign_attribute(self, attribute_dict: dict) -> None:
        """Assign attribute value to symbol."""
        for prop, value in attribute_dict.items():
            setattr(self, prop, value)

    def __eq__(self, other: object) -> bool:
        if isinstance(other, Symbol):
            return self.name == other.name
        if isinstance(other, str):
            return self.name == other
        return False
