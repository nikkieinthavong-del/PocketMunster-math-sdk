"""Test basic ways-calculation functionality."""

from src.calculations.ways import Ways
from typing import Any


def test_full_reels_h1_with_wild_last_reel(gamestate: Any):
    # Fill all reels with H1 except the last reel with W wilds
    for idx, _ in enumerate(gamestate.board):
        for idy, _ in enumerate(gamestate.board[idx]):
            if idx < len(gamestate.board) - 1:
                gamestate.board[idx][idy] = gamestate.create_symbol("H1")
            else:
                gamestate.board[idx][idy] = gamestate.create_symbol("W")

    totalWays = (len(gamestate.board[0])) ** (len(gamestate.board))
    windata = Ways.get_ways_data(gamestate.config, gamestate.board)
    assert windata["totalWin"] == totalWays * gamestate.config.paytable[(len(gamestate.board), "H1")]


def test_mixed_ways(gamestate: Any):
    sym1Ways = (len(gamestate.board[0]) - 1) ** len(gamestate.board)
    sym2Ways = 1
    for idx, _ in enumerate(gamestate.board):
        for idy, _ in enumerate(gamestate.board[idx]):
            if idy == 0:
                gamestate.board[idx][idy] = gamestate.create_symbol("H1")
            else:
                gamestate.board[idx][idy] = gamestate.create_symbol("H2")

    windata = Ways.get_ways_data(gamestate.config, gamestate.board)
    assert windata["wins"][0]["meta"]["ways"] == sym2Ways
    assert windata["wins"][1]["meta"]["ways"] == sym1Ways
    assert windata["totalWin"] == windata["wins"][0]["win"] + windata["wins"][1]["win"]


def create_non_winning_board(gamestate):
    for idx, _ in enumerate(gamestate.board):
        for idy, _ in enumerate(gamestate.board[idx]):
            gamestate.board[idx][idy] = gamestate.create_symbol("X")


def setup_test_board(gamestate, symbol_name="H1", wild_mults=(2, 3)):
    """Setup a 3x3 board with H1s on reels 0 and 2, and wilds with multipliers on reel 1."""
    create_non_winning_board(gamestate)

    gamestate.board[0][0] = gamestate.create_symbol(symbol_name)
    gamestate.board[2][0] = gamestate.create_symbol(symbol_name)
    gamestate.board[2][1] = gamestate.create_symbol(symbol_name)

    for i, mult in enumerate(wild_mults):
        wild = gamestate.create_symbol("W")
        setattr(wild, "multiplier", mult)
        gamestate.board[1][i] = wild

    return gamestate.board


def test_symbol_multiplier_strategy(gamestate: Any):
    board = setup_test_board(gamestate, wild_mults=(2, 3))
    windata = Ways.get_ways_data(config=gamestate.config, board=board, multiplier_strategy="symbol")

    expected_ways = 1 * (2 + 3) * 2  # H1 * wild counts as 5 symbols * 2 = 10 ways
    expected_win = gamestate.config.paytable[(3, "H1")] * expected_ways

    assert windata["totalWin"] == expected_win, f"Expected {expected_win}, got {windata['totalWin']}"


def test_board_multiplier_strategy(gamestate: Any):
    board = setup_test_board(gamestate, wild_mults=(2, 2))
    windata = Ways.get_ways_data(config=gamestate.config, board=board, multiplier_strategy="board")

    expected_ways = 1 * 2 * 2
    base_win = gamestate.config.paytable[(3, "H1")] * expected_ways
    global_mult = 2 + 2  # 4x total multiplier (additive)

    expected_win = base_win * global_mult

    assert windata["totalWin"] == expected_win, f"Expected {expected_win}, got {windata['totalWin']}"


def test_global_multiplier_strategy(gamestate: Any):
    global_mult = 5
    board = setup_test_board(gamestate, wild_mults=(2, 2))
    windata = Ways.get_ways_data(
        config=gamestate.config, board=board, global_multiplier=global_mult, multiplier_strategy="global"
    )

    expected_ways = 1 * 2 * 2
    base_win = gamestate.config.paytable[(3, "H1")] * expected_ways

    expected_win = base_win * global_mult

    assert windata["totalWin"] == expected_win, f"Expected {expected_win}, got {windata['totalWin']}"
    assert windata["totalWin"] == expected_win, f"Expected {expected_win}, got {windata['totalWin']}"
