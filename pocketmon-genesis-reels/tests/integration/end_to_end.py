import unittest
from math_engine.src.config.game_config import PocketMonGenesisReelsConfig
from math_engine.src.simulation.core_engine import SimulationEngine

class TestEndToEndIntegration(unittest.TestCase):

    def setUp(self):
        self.config = PocketMonGenesisReelsConfig()
        self.simulation_engine = SimulationEngine(self.config)

    def test_full_game_flow(self):
        # Simulate a spin and check the outcome
        result = self.simulation_engine.simulate_spin(bet_amount=1.0)
        
        # Check that the board is generated
        self.assertIsNotNone(result['board'])
        
        # Check that total win is calculated
        self.assertIn('total_win', result)
        
        # Check that events are generated
        self.assertIsInstance(result['events'], list)

    def test_rtp_validation(self):
        # Run a Monte Carlo simulation to validate RTP
        results = self.simulation_engine.run_monte_carlo_simulation(num_simulations=100000, bet_amount=1.0)
        
        # Check that RTP is within expected range
        self.assertAlmostEqual(results['rtp'], 0.9652, delta=0.01)

if __name__ == '__main__':
    unittest.main()