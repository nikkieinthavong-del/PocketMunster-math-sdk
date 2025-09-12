from typing import Dict, List
from .config.game_config import PocketMonGenesisReelsConfig
from .simulation.core_engine import SimulationEngine

class GenesisReels:
    def __init__(self):
        self.config = PocketMonGenesisReelsConfig()
        self.simulation_engine = SimulationEngine(self.config)

    def start_game(self, bet_amount: float) -> Dict:
        """Start a new game round with the given bet amount."""
        result = self.simulation_engine.simulate_spin(bet_amount)
        return result

    def run_monte_carlo(self, num_simulations: int, bet_amount: float) -> Dict:
        """Run a Monte Carlo simulation to analyze game performance."""
        results = self.simulation_engine.run_monte_carlo_simulation(num_simulations, bet_amount)
        return results

    def get_paytable(self) -> Dict[str, Dict[int, float]]:
        """Retrieve the paytable for the game."""
        return self.config.cluster_paytable

    def get_evolution_rules(self) -> Dict[str, Dict]:
        """Retrieve the evolution rules for the game."""
        return self.config.evolution_rules

    def get_bonus_triggers(self) -> Dict[str, Dict]:
        """Retrieve the bonus triggers for the game."""
        return self.config.bonus_triggers

    def get_symbols(self) -> Dict[str, float]:
        """Retrieve the symbols and their base values."""
        return {symbol.name: symbol.base_value for symbol in self.config.symbols.values()}