"""Ways wins executables/calculations."""

from collections import defaultdict
from src.calculations.symbol import Symbol
from src.config.config import Config
from src.wins.multiplier_strategy import apply_mult
from src.events.events import (
    win_info_event,
    set_win_event,
    set_total_event,
)


class Ways:
    """Collection of Ways-wins functions"""

    @staticmethod
    def get_ways_data(
        config: Config,
        board: list[list[Symbol]],
        wild_key: str = "wild",
        global_multiplier: int = 1,
        multiplier_key: str = "multiplier",
        multiplier_strategy: str = "symbol",
    ):
        """Ways calculation with possibility for global multiplier application."""
        return_data = {
            "totalWin": 0,
            "wins": [],
        }
        assert multiplier_strategy in ["symbol", "board", "global"]
        board_mult_count = 0
        potential_wins = defaultdict()
        wilds = [[] for _ in range(len(board))]
        for reel, _ in enumerate(board):
            for row, _ in enumerate(board[reel]):
                sym = board[reel][row]
                if reel == 0 and sym.name not in potential_wins:
                    potential_wins[sym.name] = [[] for _ in range(len(board))]
                    potential_wins[sym.name][0] = [{"reel": reel, "row": row}]
                elif sym.name in potential_wins:
                    potential_wins[sym.name][reel].append({"reel": reel, "row": row})

                if sym.name in config.special_symbols[wild_key]:
                    wilds[reel].append({"reel": reel, "row": row})
                    if board[reel][row].check_attribute(multiplier_key):
                        wilds[reel][-1][multiplier_key] = board[reel][row].get_attribute(multiplier_key)

        for symbol in potential_wins:
            kind, ways, cumulative_sym_mult = (0, 1, 0)
            for reel, _ in enumerate(potential_wins[symbol]):
                if len(potential_wins[symbol][reel]) > 0 or len(wilds[reel]) > 0:
                    kind += 1
                    reel_sym_count = 0
                    # Note that here multipliers on subsequent reels multiply (not add, like in lines games)
                    symbols_have_mult = False
                    for s in potential_wins[symbol][reel]:
                        if board[s["reel"]][s["row"]].check_attribute(multiplier_key):
                            symbols_have_mult = True

                    if symbols_have_mult is False:
                        reel_sym_count += len(potential_wins[symbol][reel])
                    else:
                        reel_sym_count = 0
                        for s in potential_wins[symbol][reel]:
                            if (
                                board[s["reel"]][s["row"]].check_attribute(multiplier_key)
                                and multiplier_strategy == "symbol"
                            ):
                                reel_sym_count += board[s["reel"]][s["row"]].get_attribute(multiplier_key)
                            else:
                                reel_sym_count += 1
                                if (
                                    board[s["reel"]][s["row"]].check_attribute(multiplier_key)
                                    and multiplier_strategy == "board"
                                ):
                                    gm = board[s["reel"]][s["row"]].get_attribute(multiplier_key)
                                    board_mult_count += gm * (gm > 1)

                    if len(wilds[reel]) > 0:
                        for sym in wilds[reel]:
                            if board[sym["reel"]][sym["row"]].check_attribute(
                                multiplier_key
                            ) and multiplier_strategy in ["board", "symbol"]:
                                wild_mult_val = board[sym["reel"]][sym["row"]].get_attribute(multiplier_key)
                                cumulative_sym_mult += wild_mult_val * (wild_mult_val > 1)
                                if multiplier_strategy == "board":
                                    reel_sym_count += 1
                                    board_mult_count += wild_mult_val * (wild_mult_val > 1)
                                else:
                                    reel_sym_count += wild_mult_val
                            else:
                                reel_sym_count += 1

                    ways *= reel_sym_count

                else:
                    break

            match multiplier_strategy:
                case "global":
                    win_multiplier = global_multiplier
                case "board":
                    win_multiplier = max(board_mult_count, 1)
                case "symbol":
                    win_multiplier = 1

            if (kind, symbol) in config.paytable:
                positions = []
                for reel in range(kind):
                    for pos in potential_wins[symbol][reel]:
                        positions += [pos]
                    for pos in wilds[reel]:
                        positions += [pos]

                win = round(config.paytable[kind, symbol] * ways, 2)
                win_amt, multiplier = apply_mult(
                    board=board,
                    strategy="global",
                    win_amount=win,
                    global_multiplier=win_multiplier,
                )
                if multiplier_strategy == "symbol":
                    assert win_amt == win

                return_data["wins"] += [
                    {
                        "symbol": symbol,
                        "kind": kind,
                        "win": win_amt,
                        "positions": positions,
                        "meta": {
                            "ways": ways,
                            "globalMult": multiplier,
                            "winWithoutMult": win,
                            "symbolMult": cumulative_sym_mult,
                        },
                    }
                ]
                return_data["totalWin"] += win_amt

        return return_data

    @staticmethod
    def emit_wayswin_events(gamestate) -> None:
        """Transmit win events asociated with ways wins."""
        if gamestate.win_manager.spin_win > 0:
            win_info_event(gamestate)
            gamestate.evaluate_wincap()
            set_win_event(gamestate)
        set_total_event(gamestate)

    @staticmethod
    def record_ways_wins(gamestate) -> None:
        """Record Ways type wins"""
        for win in gamestate.win_data["wins"]:
            gamestate.record(
                {
                    "kind": len(win["positions"]),
                    "symbol": win["symbol"],
                    "ways": win["meta"]["ways"],
                    "gametype": gamestate.gametype,
                }
            )
