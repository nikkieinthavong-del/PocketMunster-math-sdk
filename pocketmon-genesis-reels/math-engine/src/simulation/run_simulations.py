import argparse
import json
import os
from math_engine.src.config.game_config import PocketMonGenesisReelsConfig
from math_engine.src.simulation.core_engine import SimulationEngine

def run_simulations(num_simulations, output_dir):
    config = PocketMonGenesisReelsConfig()
    engine = SimulationEngine(config)

    results = engine.run_monte_carlo_simulation(num_simulations, 1.0)

    output_file = os.path.join(output_dir, f'simulation_results_{num_simulations}.json')
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=4)

    print(f"Simulation results saved to {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Monte Carlo simulations for PocketMon Genesis Reels.")
    parser.add_argument('--simulations', type=int, required=True, help='Number of simulations to run')
    parser.add_argument('--output-dir', type=str, required=True, help='Directory to save simulation results')

    args = parser.parse_args()
    run_simulations(args.simulations, args.output_dir)