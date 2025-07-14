import json
import importlib
import sys
import os

from .get_pay_splits import (
    return_all_filepaths,
    make_split_win_distribution,
    return_hit_rates,
    get_unoptimized_hits,
)
from .get_symbol_hits import construct_symbol_probabilities, construct_custom_key_probabilities


def get_config_class(game_id):
    """Load game configuration class."""
    sys.path.append("././")
    module_path = f"games.{game_id}.game_config"
    module = importlib.import_module(module_path)
    config_class = getattr(module, "GameConfig")

    return config_class()


class GameInformation:
    """Import game configuration details."""

    def __init__(self, gamestate: object, analysis_ranges=None, modes_to_analyse=None, custom_keys=None):
        self.game_id = gamestate.config.game_id
        self.modes_to_analyse = modes_to_analyse
        self.config_path = gamestate.output_files.configs["paths"]["be_config"]
        self.math_config_path = gamestate.output_files.configs["paths"]["math_config"]
        self.load_config()
        self.libraryPath = gamestate.output_files.library_path
        self.lutPath = gamestate.output_files.lookup_path
        self.finalLUTPath = gamestate.output_files.final_lookup_path

        if custom_keys is None:
            self.custom_keys = [{}]
        else:
            assert isinstance(custom_keys, list), "Search keys must be a list of dictionaries."
            key_str = []
            for d in custom_keys:
                key_dict = {}
                for k, v in d.items():
                    key_dict[str(k)] = str(v)
                key_str.append(key_dict)
            self.custom_keys = key_str

        if analysis_ranges is not None:
            self.win_ranges = analysis_ranges
        else:
            self.win_ranges = [
                (0, 0.1),
                (0.1, 1),
                (1, 2),
                (2, 5),
                (5, 10),
                (10, 20),
                (20, 50),
                (50, 100),
                (100, 200),
                (200, 300),
                (300, 500),
                (500, 1000),
                (1000, 2000),
                (2000, 3000),
                (3000, 5000),
                (5000, 10000),
                (10000, gamestate.config.wincap + 1),
            ]
            if gamestate.config.wincap < self.win_ranges[-1][0]:
                restricted_win_ranges = []
                for wr in list(self.win_ranges):
                    if gamestate.config.wincap >= wr[0]:
                        restricted_win_ranges.append(wr)
                    else:
                        break
                self.win_ranges = restricted_win_ranges

        if modes_to_analyse is not None:
            self.modes_to_analyse = modes_to_analyse
        else:
            self.modes_to_analyse = self.all_modes

        self.get_criteria_info()

        self.get_mode_split_hit_rates()
        self.get_symbol_hit_rates(self.modes_to_analyse)
        self.get_custom_hit_rates(modes_to_analyse=self.modes_to_analyse, custom_search_keys=self.custom_keys)
        self.get_range_hit_counts()
        print("Successfully loaded PAR-sheet information.")

    def load_config(self):
        "Load game config details."
        config_class = get_config_class(self.game_id)
        with open(self.config_path, "r", encoding="UTF-8") as f:
            config_object = json.load(f)

        all_modes = []
        cost_mapping = {}
        for mode in config_object["bookShelfConfig"]:
            all_modes.append(mode["name"])
            cost_mapping[mode["name"]] = mode["cost"]

        self.config = config_class
        self.all_modes = all_modes
        self.cost_mapping = cost_mapping

    def get_criteria_info(self):
        "Separate PAR sheet information based on game-types."
        game_type_mapping = {}
        mode_fence_info = {}
        math_config = open(self.math_config_path, "r", encoding="UTF-8")
        math_config_object = json.load(math_config)
        for mode in self.all_modes:
            game_type_mapping[mode] = []
            mode_fence_info[mode] = {}
            for fence in math_config_object["fences"]:
                if fence["bet_mode"] == mode:
                    for fences in fence["fences"]:
                        if fences["name"] not in ["0", "wincap"]:
                            game_type_mapping[mode].append(fences["name"])
                            if fences["hr"] != "x":
                                mode_fence_info[mode][fences["name"]] = {
                                    "hr": float(fences["hr"]),
                                    "rtp": float(fences["rtp"]),
                                    "av_win": round(
                                        float(fences["hr"])
                                        * float(fences["rtp"])
                                        * self.cost_mapping[fence["bet_mode"]],
                                        2,
                                    ),
                                }
                            else:
                                mode_fence_info[mode][fences["name"]] = {}
        self.game_type_fences = game_type_mapping
        self.mode_fence_info = mode_fence_info

    def get_mode_split_hit_rates(self, modes_to_analyse=None) -> None:
        """Separate win information depending on gametype."""
        if modes_to_analyse is None:
            modes_to_analyse = self.all_modes
        mode_hit_rate_info = {}
        for mode in modes_to_analyse:
            mode_hit_rate_info[mode] = {}
            lut_path, split_path = return_all_filepaths(self.game_id, mode)
            sub_modes = list(self.mode_fence_info[mode].keys())
            mode_sorted_distributions, total_mode_weight = make_split_win_distribution(
                lut_path, split_path, sub_modes, "basegame"
            )
            sub_mode_hits, sub_mode_probs, sub_mode_rtp_allocation = return_hit_rates(
                mode_sorted_distributions, total_mode_weight, self.win_ranges, self.cost_mapping[mode]
            )

            mode_hit_rate_info[mode]["all_gameType_hits"] = sub_mode_hits
            mode_hit_rate_info[mode]["all_gameType_probs"] = sub_mode_probs
            mode_hit_rate_info[mode]["all_gameType_rtp"] = sub_mode_rtp_allocation

        self.mode_hit_rate_info = mode_hit_rate_info

    def get_range_hit_counts(self, modes_to_analyse=None) -> None:
        """Count raw instances of win ranges using initial lookup table."""
        if modes_to_analyse is None:
            modes_to_analyse = self.all_modes
        self.mode_hit_rates, self.mode_hit_counts = get_unoptimized_hits(
            self.lutPath, self.all_modes, self.win_ranges
        )

    def get_symbol_hit_rates(self, modes_to_analyse: list) -> None:
        """Extract symbols from config file and get statistics using optimized lookup tables."""
        self.hr_summary, self.av_win_summary, self.sim_count_summary = construct_symbol_probabilities(
            self.config, modes_to_analyse
        )

    def get_custom_hit_rates(self, modes_to_analyse: list, custom_search_keys: list[dict]) -> None:
        """Compute hit rates of user defined search conditions."""
        assert modes_to_analyse is not None, "specify which mode/s to assess"
        assert custom_search_keys is not None
        self.custom_hr_summary, self.custom_av_win_summary, self.custom_sim_count_summary = (
            construct_custom_key_probabilities(self.config, modes_to_analyse, custom_search=custom_search_keys)
        )
