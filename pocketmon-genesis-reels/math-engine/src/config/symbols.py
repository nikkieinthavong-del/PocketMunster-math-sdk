from typing import Dict

# Define symbol-related constants and configurations
class Symbols:
    # Common PocketMon (Tier 1)
    T1_RATTATA = {"name": "T1_RATTATA", "base_value": 0.1}
    T1_PIDGEY = {"name": "T1_PIDGEY", "base_value": 0.1}
    # ... Add all 151 PocketMon symbols here

    # Special symbols
    WILD_OAK = {"name": "WILD_OAK", "base_value": 0, "is_wild": True}
    SCATTER_MASTERBALL = {"name": "SCATTER_MASTERBALL", "base_value": 0, "is_scatter": True}
    STONE_FIRE = {"name": "STONE_FIRE", "base_value": 0, "is_bonus": True}
    STONE_WATER = {"name": "STONE_WATER", "base_value": 0, "is_bonus": True}
    STONE_THUNDER = {"name": "STONE_THUNDER", "base_value": 0, "is_bonus": True}
    STONE_LEAF = {"name": "STONE_LEAF", "base_value": 0, "is_bonus": True}
    STONE_MOON = {"name": "STONE_MOON", "base_value": 0, "is_bonus": True}

    @classmethod
    def get_symbols(cls) -> Dict[str, Dict]:
        return {symbol["name"]: symbol for symbol in vars(cls).values() if isinstance(symbol, dict)}