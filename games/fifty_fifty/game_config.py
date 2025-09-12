"""Game-specific configuration for 'fifty_fifty' 7x7 hybrid (ways, scatter, cluster + bonuses)."""

import os
from src.config.config import Config
from src.config.distributions import Distribution
from src.config.betmode import BetMode


class GameConfig(Config):

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        super().__init__()
        self.game_id = "fifty_fifty"
        self.provider_number = 0
        self.working_name = "Fifty Fifty 7x7 Hybrid"
        self.wincap = 5000.0
        self.win_type = "hybrid"
        self.rtp = 0.9624
        self.construct_paths()

        # 7x7 grid
        self.num_reels = 7
        self.num_rows = [7] * self.num_reels

        # Special symbols and tiers for evolution
        # PB: Pokéball (Poké Hunt), TR: Trainer (Arena), EG: Egg (Evolution trigger)
        self.special_symbols = {"wild": ["W"], "scatter": ["S", "PB", "TR"], "egg": ["EG"], "multiplier": ["W"]}
        self.evolution_tiers = {"tier1": ["L1", "L2"], "tier2": ["H1"], "tier3": ["H2"]}
        self.evolution_map = {"tier1_to_tier2": {"L1": "H1", "L2": "H1"}, "tier2_to_tier3": {"H1": "H2"}}

        # Paytable: ways, scatter pay-anywhere thresholds, and cluster sizes
        self.paytable = {
            # Ways payouts
            (3, "H1"): 2, (4, "H1"): 5, (5, "H1"): 10, (6, "H1"): 20, (7, "H1"): 40,
            (3, "H2"): 1.5, (4, "H2"): 3, (5, "H2"): 6, (6, "H2"): 12, (7, "H2"): 24,
            (3, "L1"): 1, (4, "L1"): 2, (5, "L1"): 3, (6, "L1"): 6, (7, "L1"): 12,
            (3, "L2"): 0.5, (4, "L2"): 1, (5, "L2"): 2, (6, "L2"): 4, (7, "L2"): 8,

            # Scatter anywhere (counts, symbol)
            (8, "H1"): 10, (10, "H1"): 20, (12, "H1"): 30, (15, "H1"): 50, (20, "H1"): 100,
            (8, "H2"): 6, (10, "H2"): 12, (12, "H2"): 18, (15, "H2"): 30, (20, "H2"): 60,
            (8, "L1"): 4, (10, "L1"): 8, (12, "L1"): 12, (15, "L1"): 18, (20, "L1"): 36,
            (8, "L2"): 2, (10, "L2"): 4, (12, "L2"): 6, (15, "L2"): 10, (20, "L2"): 20,

            # Cluster (orthogonal)
            (5, "H1"): 5, (7, "H1"): 10, (9, "H1"): 20, (12, "H1"): 40, (16, "H1"): 80,
            (5, "H2"): 3, (7, "H2"): 6, (9, "H2"): 12, (12, "H2"): 24, (16, "H2"): 48,
            (5, "L1"): 2, (7, "L1"): 4, (9, "L1"): 8, (12, "L1"): 16, (16, "L1"): 32,
            (5, "L2"): 1, (7, "L2"): 2, (9, "L2"): 4, (12, "L2"): 8, (16, "L2"): 16,
        }

        # Reels
        reels = {"BR0": "BR0.csv", "FR0": "FR0.csv"}
        self.reels = {}
        for r, f in reels.items():
            self.reels[r] = self.read_reels_csv(os.path.join(self.reels_path, f))

        self.padding_reels[self.basegame_type] = self.reels["BR0"]
        self.padding_reels[self.freegame_type] = self.reels["FR0"]
        self.padding_symbol_values = {"W": {"multiplier": {2: 60, 3: 30, 5: 8, 10: 2}}}

        # Keep FS placeholders unused in this hybrid
        self.freespin_triggers = {self.basegame_type: {3: 8}, self.freegame_type: {3: 8}}
        self.anticipation_triggers = {self.basegame_type: 2, self.freegame_type: 2}

        # Three bet-modes: ways, scatter, cluster
        self.bet_modes = [
            BetMode(
                name="ways",
                cost=1.0,
                rtp=self.rtp,
                max_win=self.wincap,
                auto_close_disabled=False,
                is_feature=True,
                is_buybonus=False,
                distributions=[
                    Distribution(
                        criteria="wincap",
                        quota=0.001,
                        win_criteria=self.wincap,
                        conditions={
                            "reel_weights": {self.basegame_type: {"BR0": 1}},
                            "mult_values": {2: 60, 3: 30, 5: 8, 10: 2},
                            "force_wincap": True,
                            "force_freegame": False,
                        },
                    ),
                    Distribution(
                        criteria="0",
                        quota=0.45,
                        win_criteria=0.0,
                        conditions={
                            "reel_weights": {self.basegame_type: {"BR0": 1}},
                            "mult_values": {2: 80, 3: 15, 5: 5},
                            "force_wincap": False,
                            "force_freegame": False,
                        },
                    ),
                    Distribution(
                        criteria="basegame",
                        quota=0.549,
                        conditions={
                            "reel_weights": {self.basegame_type: {"BR0": 1}},
                            "mult_values": {2: 60, 3: 30, 5: 8, 10: 2},
                            "force_wincap": False,
                            "force_freegame": False,
                        },
                    ),
                ],
            ),
            BetMode(
                name="scatter",
                cost=1.0,
                rtp=self.rtp,
                max_win=self.wincap,
                auto_close_disabled=False,
                is_feature=True,
                is_buybonus=False,
                distributions=[
                    Distribution(
                        criteria="wincap",
                        quota=0.001,
                        win_criteria=self.wincap,
                        conditions={
                            "reel_weights": {self.basegame_type: {"FR0": 1}},
                            "mult_values": {2: 60, 3: 30, 5: 8, 10: 2},
                            "force_wincap": True,
                            "force_freegame": False,
                        },
                    ),
                    Distribution(
                        criteria="0",
                        quota=0.40,
                        win_criteria=0.0,
                        conditions={
                            "reel_weights": {self.basegame_type: {"FR0": 1}},
                            "mult_values": {2: 80, 3: 15, 5: 5},
                            "force_wincap": False,
                            "force_freegame": False,
                        },
                    ),
                    Distribution(
                        criteria="basegame",
                        quota=0.599,
                        conditions={
                            "reel_weights": {self.basegame_type: {"FR0": 1}},
                            "mult_values": {2: 60, 3: 30, 5: 8, 10: 2},
                            "force_wincap": False,
                            "force_freegame": False,
                        },
                    ),
                ],
            ),
            BetMode(
                name="cluster",
                cost=1.0,
                rtp=self.rtp,
                max_win=self.wincap,
                auto_close_disabled=False,
                is_feature=True,
                is_buybonus=False,
                distributions=[
                    Distribution(
                        criteria="wincap",
                        quota=0.001,
                        win_criteria=self.wincap,
                        conditions={
                            "reel_weights": {self.basegame_type: {"FR0": 1}},
                            "mult_values": {2: 40, 3: 40, 5: 15, 10: 5},
                            "force_wincap": True,
                            "force_freegame": False,
                        },
                    ),
                    Distribution(
                        criteria="0",
                        quota=0.35,
                        win_criteria=0.0,
                        conditions={
                            "reel_weights": {self.basegame_type: {"FR0": 1}},
                            "mult_values": {2: 80, 3: 15, 5: 5},
                            "force_wincap": False,
                            "force_freegame": False,
                        },
                    ),
                    Distribution(
                        criteria="basegame",
                        quota=0.649,
                        conditions={
                            "reel_weights": {self.basegame_type: {"FR0": 1}},
                            "mult_values": {2: 40, 3: 40, 5: 15, 10: 5},
                            "force_wincap": False,
                            "force_freegame": False,
                        },
                    ),
                ],
            ),
        ]
