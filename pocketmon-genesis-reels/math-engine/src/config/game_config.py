import numpy as np
from numba import jit, njit
from typing import Dict, List, Tuple
import json

class Symbol:
    def __init__(self, name: str, base_value: float, is_wild: bool = False, 
                 is_scatter: bool = False, is_bonus: bool = False):
        self.name = name
        self.base_value = base_value
        self.is_wild = is_wild
        self.is_scatter = is_scatter
        self.is_bonus = is_bonus

class ReelStrip:
    def __init__(self, symbols: List[str], weights: List[int]):
        self.symbols = symbols
        self.weights = weights
        self.cumulative_weights = np.cumsum(weights)
        self.total_weight = sum(weights)

class PocketMonGenesisReelsConfig:
    def __init__(self):
        # Symbol definitions - all 151 PocketMon + specials
        self.symbols = self._create_symbols()
        
        # Reel strip configurations for 7 reels
        self.reel_strips = self._create_reel_strips()
        
        # Cluster pay table
        self.cluster_paytable = self._create_cluster_paytable()
        
        # Evolution rules
        self.evolution_rules = self._create_evolution_rules()
        
        # Bonus triggers
        self.bonus_triggers = self._create_bonus_triggers()

    def _create_symbols(self) -> Dict[str, Symbol]:
        symbols = {}
        # Common PocketMon (Tier 1)
        symbols["T1_RATTATA"] = Symbol("T1_RATTATA", 0.1)
        symbols["T1_PIDGEY"] = Symbol("T1_PIDGEY", 0.1)
        # ... all 151 PocketMon
        
        # Special symbols
        symbols["WILD_OAK"] = Symbol("WILD_OAK", 0, is_wild=True)
        symbols["SCATTER_MASTERBALL"] = Symbol("SCATTER_MASTERBALL", 0, is_scatter=True)
        symbols["STONE_FIRE"] = Symbol("STONE_FIRE", 0, is_bonus=True)
        symbols["STONE_WATER"] = Symbol("STONE_WATER", 0, is_bonus=True)
        symbols["STONE_THUNDER"] = Symbol("STONE_THUNDER", 0, is_bonus=True)
        symbols["STONE_LEAF"] = Symbol("STONE_LEAF", 0, is_bonus=True)
        symbols["STONE_MOON"] = Symbol("STONE_MOON", 0, is_bonus=True)
        
        return symbols

    def _create_reel_strips(self) -> Dict[str, List[ReelStrip]]:
        # Define symbol weights for each reel (7 reels total)
        reel_weights = [
            # Reel 1 weights
            [280, 190, 130, 90, 60, 25, 75, 50, 35, 65],  # Total: 1000
            # Reel 2 weights
            [270, 180, 140, 95, 65, 30, 70, 55, 40, 55],  # Total: 1000
            # ... Reels 3-7 with varying weights
        ]
        
        reel_strips = {}
        for i, weights in enumerate(reel_weights):
            symbols = list(self.symbols.keys())
            reel_strips[f"reel_{i+1}"] = ReelStrip(symbols, weights)
        
        return reel_strips

    def _create_cluster_paytable(self) -> Dict[str, Dict[int, float]]:
        paytable = {}
        # Tier 1 PocketMon
        paytable["T1_RATTATA"] = {5: 0.5, 6: 1.0, 7: 1.5, 8: 2.0, 9: 2.5, 10: 3.0}
        # ... all other tiers with appropriate values
        
        # Legendary PocketMon have higher values and lower cluster requirements
        paytable["T6_MEWTWO"] = {3: 10.0, 4: 25.0, 5: 50.0, 6: 100.0, 7: 200.0}
        
        return paytable

    def _create_evolution_rules(self) -> Dict[str, Dict]:
        rules = {
            "T1_CHARMANDER": {
                "evolves_to": "T4_CHARMELEON",
                "required_stone": "STONE_FIRE",
                "required_adjacency": True,
                "multiplier": 2.5
            },
            # ... all evolution chains
        }
        return rules

    def _create_bonus_triggers(self) -> Dict[str, Dict]:
        return {
            "free_spins": {
                "symbol": "SCATTER_MASTERBALL",
                "count": 3,
                "awards": {3: 8, 4: 12, 5: 20}
            }
        }