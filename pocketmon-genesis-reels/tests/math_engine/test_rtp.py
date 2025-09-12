import pytest
from math_engine.src.config.game_config import PocketMonGenesisReelsConfig
from math_engine.src.simulation.core_engine import SimulationEngine

@pytest.fixture
def setup_simulation():
    config = PocketMonGenesisReelsConfig()
    engine = SimulationEngine(config)
    return engine

def test_rtp_calculation(setup_simulation):
    engine = setup_simulation
    results = engine.run_monte_carlo_simulation(1000000, 1.0)
    assert results['rtp'] >= 0.95, "RTP should be at least 95%"
    assert results['rtp'] <= 0.975, "RTP should not exceed 97.5%"

def test_rtp_stability(setup_simulation):
    engine = setup_simulation
    rtp_values = []
    for _ in range(10):
        results = engine.run_monte_carlo_simulation(100000, 1.0)
        rtp_values.append(results['rtp'])
    
    assert all(0.95 <= rtp <= 0.975 for rtp in rtp_values), "RTP values should be stable within the expected range"