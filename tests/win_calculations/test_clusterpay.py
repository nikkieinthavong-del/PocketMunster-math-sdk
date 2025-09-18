"""Test basic cluster-calculation functionality."""

from typing import Any
import pytest
from tests.win_calculations.game_test_config import GamestateTest, create_blank_board
from src.calculations.cluster import Cluster


class GameClusterConfig:
    """Testing game functions"""

    def __init__(self):
        self.game_id = "0_test_class"
        self.rtp = 0.9700

        # Game Dimensions
        self.num_reels = 6
        self.num_rows = [6] * self.num_reels
        # Board and Symbol Properties
        t1, t2, t3, t4 = (5, 5), (6, 8), (9, 12), (13, 36)
        pay_group = {
            (t1, "H1"): 5.0,
            (t2, "H1"): 12.5,
            (t3, "H1"): 25.0,
            (t4, "H1"): 60.0,
            (t1, "H2"): 5.0,
            (t2, "H2"): 12.5,
            (t3, "H2"): 25.0,
            (t4, "H2"): 60.0,
        }
        self.paytable = convert_range_table(pay_group)

        self.special_symbols = {"wild": ["WM"], "scatter": ["S"], "multiplier": ["WM"], "blank": ["X"]}
        self.bet_modes = []
        self.basegame_type = "basegame"
        self.freegame_type = "freegame"


def convert_range_table(pay_group: dict) -> dict:
    paytable = {}
    for sym_details, payout in pay_group.items():
        min_connections, max_connections = sym_details[0][0], sym_details[0][1]
        symbol = sym_details[1]
        for i in range(min_connections, max_connections + 1):
            paytable[(i, symbol)] = payout

    return paytable


def create_test_cluster_gamestate():
    """Boilerplate gamestate for testing."""
    test_config = GameClusterConfig()
    test_gamestate = GamestateTest(test_config)
    test_gamestate.create_symbol_map()
    test_gamestate.assign_special_sym_function()
    test_gamestate.board = create_blank_board(test_config.num_reels, test_config.num_rows)

    return test_gamestate


@pytest.fixture(scope="function")
def gamestate():
    return create_test_cluster_gamestate()


def test_wild_mult_cluster(gamestate):
    for idx, _ in enumerate(gamestate.board):
        for idy, _ in enumerate(gamestate.board[idx]):
            if idx < 4 and idy < 4:
                gamestate.board[idx][idy] = gamestate.create_symbol("WM")
            else:
                gamestate.board[idx][idy] = gamestate.create_symbol("X")
    gamestate.board[0][4] = gamestate.create_symbol("H1")
    # Expect 10-size wilds with mult defaulting to H1 payout

    clusters = Cluster.get_clusters(gamestate.board)
    _, win_data, total_win = Cluster.evaluate_clusters(
        config=gamestate.config,
        board=gamestate.board,
        clusters=clusters,
    )
    assert total_win == (
        gamestate.config.paytable[(17, "H1")] * sum([3 for _ in range(len(win_data["wins"][0]["positions"]) - 1)])
    )


def test_basic_cluster(gamestate):
    for idx, _ in enumerate(gamestate.board):
        for idy, _ in enumerate(gamestate.board[idx]):
            # 3x3 grid of same symbol
            if idx < 3 and idy < 3:
                gamestate.board[idx][idy] = gamestate.create_symbol("H1")
            else:
                gamestate.board[idx][idy] = gamestate.create_symbol("X")

    clusters = Cluster.get_clusters(gamestate.board)
    _, _, total_win = Cluster.evaluate_clusters(
        config=gamestate.config,
        board=gamestate.board,
        clusters=clusters,
    )
    assert total_win == gamestate.config.paytable[(9, "H1")]
