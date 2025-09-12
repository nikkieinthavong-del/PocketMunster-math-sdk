import unittest
import time
from math_engine.src.simulation.core_engine import SimulationEngine
from math_engine.src.config.game_config import PocketMonGenesisReelsConfig

class LoadTests(unittest.TestCase):
    def setUp(self):
        self.config = PocketMonGenesisReelsConfig()
        self.simulation_engine = SimulationEngine(self.config)

    def test_load_simulation_performance(self):
        start_time = time.time()
        num_simulations = 1000000
        results = self.simulation_engine.run_monte_carlo_simulation(num_simulations, 1.0)
        end_time = time.time()
        
        duration = end_time - start_time
        print(f"Completed {num_simulations} simulations in {duration:.2f} seconds.")
        
        self.assertGreater(results['rtp'], 0.9, "RTP should be greater than 90%")
        self.assertGreater(len(results['win_distribution']), 0, "Win distribution should not be empty")

if __name__ == '__main__':
    unittest.main()