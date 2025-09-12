import json
import numpy as np
from typing import Dict, Any

class PARSheetGenerator:
    def __init__(self, simulation_results: Dict[str, Any]):
        self.simulation_results = simulation_results

    def generate_par_sheet(self) -> Dict[str, Any]:
        par_sheet = {
            "rtp": self.calculate_rtp(),
            "volatility": self.calculate_volatility(),
            "hit_frequency": self.calculate_hit_frequency(),
            "max_win": self.calculate_max_win(),
            "feature_frequencies": self.calculate_feature_frequencies(),
            "symbol_frequencies": self.calculate_symbol_frequencies(),
            "detailed_math": self.generate_detailed_math_analysis()
        }
        return par_sheet

    def calculate_rtp(self) -> float:
        total_payout = self.simulation_results['total_payout']
        total_bet = self.simulation_results['total_bet']
        return total_payout / total_bet if total_bet > 0 else 0.0

    def calculate_volatility(self) -> float:
        win_distribution = self.simulation_results['win_distribution']
        mean_win = np.mean(win_distribution)
        variance = np.var(win_distribution)
        return np.sqrt(variance) / mean_win if mean_win > 0 else 0.0

    def calculate_hit_frequency(self) -> float:
        win_distribution = self.simulation_results['win_distribution']
        total_spins = sum(win_distribution)
        total_wins = len([win for win in win_distribution if win > 0])
        return total_wins / total_spins if total_spins > 0 else 0.0

    def calculate_max_win(self) -> int:
        win_distribution = self.simulation_results['win_distribution']
        return np.max(win_distribution)

    def calculate_feature_frequencies(self) -> Dict[str, int]:
        return self.simulation_results['feature_triggers']

    def calculate_symbol_frequencies(self) -> Dict[str, float]:
        # Placeholder for symbol frequency calculation
        return {}

    def generate_detailed_math_analysis(self) -> Dict[str, Any]:
        # Placeholder for detailed math analysis
        return {}

def save_par_sheet(par_sheet: Dict[str, Any], file_path: str) -> None:
    with open(file_path, 'w') as f:
        json.dump(par_sheet, f, indent=4)