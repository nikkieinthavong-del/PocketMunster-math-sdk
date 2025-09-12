import numpy as np
from typing import Dict, Any
from math_engine.src.config.game_config import PocketMonGenesisReelsConfig
from math_engine.src.simulation.core_engine import SimulationEngine

def run_monte_carlo_simulation(num_simulations: int, bet_amount: float) -> Dict[str, Any]:
    config = PocketMonGenesisReelsConfig()
    engine = SimulationEngine(config)
    
    results = {
        "total_payout": 0.0,
        "total_bet": num_simulations * bet_amount,
        "win_distribution": np.zeros(10000),  # Track win sizes
        "feature_triggers": {
            "free_spins": 0,
            "evolution": 0,
            "bonus": 0
        }
    }
    
    for i in range(num_simulations):
        if i % 100000 == 0:
            print(f"Completed {i}/{num_simulations} simulations")
        
        outcome = engine.simulate_spin(bet_amount)
        results["total_payout"] += outcome["total_win"]
        
        # Track win distribution
        win_size = min(int(outcome["total_win"] / bet_amount), 9999)
        results["win_distribution"][win_size] += 1
        
        # Track feature triggers
        for event in outcome["events"]:
            if event["type"] == "free_spins_triggered":
                results["feature_triggers"]["free_spins"] += 1
            elif event["type"] == "evolution":
                results["feature_triggers"]["evolution"] += 1
    
    # Calculate RTP
    results["rtp"] = results["total_payout"] / results["total_bet"]
    
    return results