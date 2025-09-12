import time
import random
from math_engine.src.simulation.core_engine import SimulationEngine
from math_engine.src.config.game_config import PocketMonGenesisReelsConfig

def run_performance_test(num_simulations: int):
    config = PocketMonGenesisReelsConfig()
    engine = SimulationEngine(config)

    start_time = time.time()
    results = engine.run_monte_carlo_simulation(num_simulations, 1.0)
    end_time = time.time()

    elapsed_time = end_time - start_time
    print(f"Ran {num_simulations} simulations in {elapsed_time:.2f} seconds.")
    print(f"Average RTP: {results['rtp']:.4f}")
    print(f"Total Payout: {results['total_payout']:.2f}")
    print(f"Total Bet: {results['total_bet']:.2f}")

if __name__ == "__main__":
    num_simulations = 1000000  # Adjust as needed for testing
    run_performance_test(num_simulations)