from tests.win_calculations.game_test_config import create_blank_board


import pytest


class GameWaysConfig:
    """Minimal test configuration for ways-pay calculations.

    Used by ways-pay unit tests to build a deterministic 5x3 mock game and board.
    Provides symbol definitions, paytable, and structural settings required by
    GamestateTest to construct boards and evaluate wins with Ways.get_ways_data().

    Attributes:
        game_id: Identifier for the mock game used by the test harness.
        rtp: Target RTP reference value (not exercised by these tests).
        num_reels: Number of reels (columns) in the test grid.
        num_rows: List of row counts per reel; defaults to 3 rows for each of 5 reels.
        paytable: Mapping of (symbol_count, symbol_code) → payout value.
        special_symbols: Mapping for special symbol groups (wild, scatter, blank).
        bet_modes: Placeholder for bet-mode configuration (unused in these tests).
        basegame_type: Label for base game mode.
        freegame_type: Label for free game mode.
    """

    def __init__(self):
        self.game_id = "0_test_class"
        self.rtp = 0.9700

        # Game Dimensions
        self.num_reels = 5
        self.num_rows = [3] * self.num_reels
        # Board and Symbol Properties
        self.paytable = {
            (5, "H1"): 70,
            (4, "H1"): 60,
            (3, "H1"): 50,
            (5, "H2"): 30,
            (4, "H2"): 20,
    test_gamestate.board = create_blank_board(test_config.num_reels, test_config.num_rows)

    return test_gamestate


@pytest.fixture
def gamestate():
    """Initialise test state."""
    return create_test_ways_gamestate()


def test_basic_ways(gamestate: Any):
    totalWays = len(gamestate.board[0]) ** len(gamestate.board)
    for idx, _ in enumerate(gamestate.board):
        for