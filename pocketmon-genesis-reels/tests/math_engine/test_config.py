import pytest
from math_engine.src.config.game_config import PocketMonGenesisReelsConfig

@pytest.fixture
def config():
    return PocketMonGenesisReelsConfig()

def test_symbols(config):
    assert len(config.symbols) > 0
    assert "T1_RATTATA" in config.symbols
    assert config.symbols["T1_RATTATA"].base_value == 0.1

def test_reel_strips(config):
    assert len(config.reel_strips) == 7
    for reel in config.reel_strips.values():
        assert len(reel.symbols) > 0
        assert len(reel.weights) > 0
        assert sum(reel.weights) == reel.total_weight

def test_cluster_paytable(config):
    assert "T1_RATTATA" in config.cluster_paytable
    assert 5 in config.cluster_paytable["T1_RATTATA"]
    assert config.cluster_paytable["T1_RATTATA"][5] == 0.5

def test_evolution_rules(config):
    assert "T1_CHARMANDER" in config.evolution_rules
    assert config.evolution_rules["T1_CHARMANDER"]["evolves_to"] == "T4_CHARMELEON"

def test_bonus_triggers(config):
    assert "free_spins" in config.bonus_triggers
    assert config.bonus_triggers["free_spins"]["symbol"] == "SCATTER_MASTERBALL"