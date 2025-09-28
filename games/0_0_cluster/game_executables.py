from game_calculations import GameCalculations
from src.calculations.cluster import Cluster
from .game_events import update_grid_mult_event
from src.events.events import update_freespin_event


class GameExecutables(GameCalculations):
    """Game dependent grouped functions."""

    def reset_grid_mults(self):
        """Initialize all grid position multipliers."""
        self.position_multipliers = [
            [0 for _ in range(self.config.num_rows[reel])] for reel in range(self.config.num_reels)
        ]

    def update_grid_mults(self):
        """Per-position multiplier progression (doubling):
        - Stored grid value 0 means baseline x1 (inactive).
        - On first win at a position: 0 → 2 (i.e., x2 active).
        - On subsequent wins: value doubles (e.g., 2→4→8...), capped by maximum_board_mult.
        This aligns with the frontend engine semantics and design doc (x1→x2→x4...→x8192)."""
        if self.win_data["totalWin"] > 0:
            for win in self.win_data["wins"]:
                for pos in win["positions"]:
                    r = pos["row"]
                    c = pos["reel"]
                    cur = self.position_multipliers[c][r]
                    # 0 represents x1 baseline; first activation becomes x2
                    if cur <= 0:
                        nxt = 2
                    else:
                        nxt = cur * 2
                    self.position_multipliers[c][r] = min(nxt, self.config.maximum_board_mult)
            update_grid_mult_event(self)

    def get_clusters_update_wins(self):
        """Find clusters on board and update win manager."""
        clusters = Cluster.get_clusters(self.board, "wild")
        return_data = {
            "totalWin": 0,
            "wins": [],
        }
        self.board, self.win_data = self.evaluate_clusters_with_grid(
            config=self.config,
            board=self.board,
            clusters=clusters,
            pos_mult_grid=self.position_multipliers,
            global_multiplier=self.global_multiplier,
            return_data=return_data,
        )

        Cluster.record_cluster_wins(self)
        self.win_manager.update_spinwin(self.win_data["totalWin"])
        self.win_manager.tumble_win = self.win_data["totalWin"]

    def update_freespin(self) -> None:
        """Called before a new reveal during freegame."""
        self.fs += 1
        update_freespin_event(self)
        self.win_manager.reset_spin_win()
        self.tumblewin_mult = 0
        self.win_data = {}
