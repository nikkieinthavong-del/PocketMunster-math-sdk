import pytest
from math_engine.src.simulation.core_engine import SimulationEngine
from math_engine.src.config.game_config import PocketMonGenesisReelsConfig

@pytest.fixture
def simulation_engine():
    config = PocketMonGenesisReelsConfig()
    engine = SimulationEngine(config)
    return engine

def test_generate_board(simulation_engine):
    board = simulation_engine.generate_board()
    assert board.shape == (7, 7), "Board should be 7x7"
    assert board.dtype == int, "Board should contain integer values"

def test_find_clusters(simulation_engine):
    board = simulation_engine.generate_board()
    clusters = simulation_engine.find_clusters(board)
    assert isinstance(clusters, list), "Clusters should be a list"
    for cluster in clusters:
        assert 'symbol' in cluster, "Cluster should have a symbol"
        assert 'positions' in cluster, "Cluster should have positions"
        assert 'size' in cluster, "Cluster should have a size"

def test_calculate_cluster_payout(simulation_engine):
    cluster = {
        'symbol': 'T1_RATTATA',
        'size': 5
    }
    payout = simulation_engine.calculate_cluster_payout(cluster)
    assert payout >= 0, "Payout should be non-negative"