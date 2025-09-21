from collections import defaultdict
from typing import List, Dict
from src.calculations.symbol import Symbol
from src.config.config import Config


class Cluster:
    """Collection of cluster-evaluation functions."""

    @staticmethod
    def get_central_cluster_position(winning_positions: List[Dict]) -> tuple:
        """Return position on screen to display win amount."""
        all_reels = []
        all_rows = []
        for pos in winning_positions:
            all_reels.append(pos["reel"])
            all_rows.append(pos["row"])

        reel_to_overlay = int(round(sum(all_reels) / len(all_rows)))
        row_to_overlay = int(round(sum(all_rows) / len(all_rows)))

        return (reel_to_overlay, row_to_overlay)

    @staticmethod
    def get_neighbours(board: list[list[Symbol]], reel: int, row: int, local_checked: list) -> list:
        """All neighbouring symbols within board range."""
        neighbours = []
        if reel > 0:
            if (reel - 1, row) not in local_checked:
                neighbours += [(reel - 1, row)]
                local_checked += [(reel - 1, row)]
        if reel < len(board) - 1:
            if (reel + 1, row) not in local_checked:
                neighbours += [(reel + 1, row)]
                local_checked += [(reel + 1, row)]
        if row > 0:
            if (reel, row - 1) not in local_checked:
                neighbours += [(reel, row - 1)]
                local_checked += [(reel, row - 1)]
        if row < len(board[reel]) - 1:
            if (reel, row + 1) not in local_checked:
                neighbours += [(reel, row + 1)]
                local_checked += [(reel, row + 1)]
        return neighbours

    @staticmethod
    def in_cluster(board: list[list[Symbol]], reel: int, row: int, og_symbol: str, wild_key: str = "wild") -> bool:
        """Checks if a symbol (including wilds) match cluster type."""
        if board[reel][row].check_attribute(wild_key) or og_symbol == board[reel][row].name:
            return True
        return False

    @staticmethod
    def check_all_neighbours(
        board: list[list[Symbol]],
        already_checked: list,
        local_checked: list,
        potential_cluster: list,
        reel,
        row,
        og_symbol: str,
        wild_key: str = "wild",
    ):
        """Recursively check neighbours for like-symbols."""
        neighbours = Cluster.get_neighbours(board, reel, row, local_checked)
        for reel_, row_ in neighbours:
            if Cluster.in_cluster(board, reel_, row_, og_symbol, wild_key):
                potential_cluster += [(reel_, row_)]
                already_checked += [(reel_, row_)]
                Cluster.check_all_neighbours(
                    board,
                    already_checked,
                    local_checked,
                    potential_cluster,
                    reel_,
                    row_,
                    og_symbol,
                    wild_key,
                )

    @staticmethod
    def get_clusters(board: list[list[Symbol]], wild_key: str = "wild") -> dict:
        """Return all symbol clusters of size >= 1."""
        already_checked = []
        clusters = defaultdict(list)
        for reel, _ in enumerate(board):
            for row, _ in enumerate(board[reel]):
                if (reel, row) not in already_checked and not (board[reel][row].check_attribute(wild_key)):
                    potential_cluster = [(reel, row)]
                    already_checked += [(reel, row)]
                    local_checked = [(reel, row)]
                    symbol = board[reel][row].name
                    Cluster.check_all_neighbours(
                        board,
                        already_checked,
                        local_checked,
                        potential_cluster,
                        reel,
                        row,
                        symbol,
                        wild_key,
                    )
                    clusters[symbol].append(potential_cluster)

        return clusters

    @staticmethod
    def evaluate_clusters(
        config: Config,
        board: list[list[Symbol]],
        clusters: dict,
        global_multiplier: int = 1,
        multiplier_key: str = "multiplier",
        return_data: dict = {"totalWin": 0, "wins": []},
    ) -> tuple[list[list[Symbol]], dict, float]:
        """Determine payout amount from cluster, including symbol multiplier and global multiplier value."""
        exploding_symbols = []
        total_win = 0
        for sym in clusters:
            for cluster in clusters[sym]:
                syms_in_cluster = len(cluster)
                if (syms_in_cluster, sym) in config.paytable:
                    cluster_mult = 0
                    for positions in cluster:
                        if board[positions[0]][positions[1]].check_attribute(multiplier_key):
                            if int(board[positions[0]][positions[1]].get_attribute(multiplier_key)) > 0:
                                cluster_mult += board[positions[0]][positions[1]].get_attribute(multiplier_key)
                    cluster_mult = max(cluster_mult, 1)
                    sym_win = config.paytable[(syms_in_cluster, sym)]
                    symwin_mult = sym_win * cluster_mult * global_multiplier
                    total_win += symwin_mult
                    json_positions = [{"reel": p[0], "row": p[1]} for p in cluster]

                    central_pos = Cluster.get_central_cluster_position(json_positions)
                    return_data["wins"] += [
                        {
                            "symbol": sym,
                            "clusterSize": syms_in_cluster,
                            "win": symwin_mult,
                            "positions": json_positions,
                            "meta": {
                                "globalMult": global_multiplier,
                                "clusterMult": cluster_mult,
                                "winWithoutMult": sym_win,
                                "overlay": {"reel": central_pos[0], "row": central_pos[1]},
                            },
                        }
                    ]

                    for positions in cluster:
                        board[positions[0]][positions[1]].explode = True
                        if {
                            "reel": positions[0],
                            "row": positions[1],
                        } not in exploding_symbols:
                            exploding_symbols.append({"reel": positions[0], "row": positions[1]})

        return board, return_data, total_win

    @staticmethod
    def get_cluster_data(
        config: Config,
        board: list[list[Symbol]],
        global_multiplier: int,
        multiplier_key: str = "multiplier",
        wild_key: str = "wild",
    ) -> dict:
        """Event-ready win information."""
        clusters = Cluster.get_clusters(board, wild_key)
        return_data = {
            "totalWin": 0,
            "wins": [],
        }
        board, return_data, total_win = Cluster.evaluate_clusters(
            config,
            board,
            clusters,
            global_multiplier=global_multiplier,
            multiplier_key=multiplier_key,
            return_data=return_data,
        )

        return_data["totalWin"] += total_win

        return return_data

    @staticmethod
    def record_cluster_wins(gamestate) -> None:
        """force_record win description keys."""
        for win in gamestate.win_data["wins"]:
            gamestate.record(
                {
                    "kind": win["clusterSize"],
                    "symbol": win["symbol"],
                    "mult": int(win["meta"]["globalMult"] + win["meta"]["clusterMult"]),
                    "gametype": gamestate.gametype,
                }
            )
