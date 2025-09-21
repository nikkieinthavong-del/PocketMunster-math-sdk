"""Scan force-files for simulation id's matching given search criteria"""

import os
import importlib
import json
from typing import List, Dict, Optional, Any, Set


def load_game_config(game_id: str):
    """Load game config class"""
    module_path = f"games.{game_id}.game_config"
    module = importlib.import_module(module_path)
    config = getattr(module, "GameConfig")

    return config()


def get_mode_names_from_config(game_config: Any) -> List[str]:
    """Use BetMode class/config to get all bet mode names."""
    modes = []
    for bet_mode in game_config.bet_modes:
        modes.append(bet_mode.get_name())
    return modes


class ForceTool:
    """
    Pass in target search keys and return book-ids satisfying union of given keys.
    The force_record file could be uploaded if small enough, and polled by the front-end to search for game-keys
    Alternatively, this tool can be used to narrow down ids by finding the union of multiple keys.
    """

    def __init__(self, game_id: str, game_mode: str):
        # Load game-config from id
        self.config = load_game_config(game_id)
        self.target_mode = game_mode
        self.current_force_file = None
        self.search_keys = None
        self.method = None  # For payout range search only

    def get_force_file_name(self):
        "Get force-file path."
        return os.path.join(self.config.library_path, "forces", f"force_record_{self.target_mode}.json")

    def load_force_file(self):
        "Load JSON format force file."
        force_name = self.get_force_file_name()
        with open(force_name, "r", encoding="UTF-8") as f:
            self.current_force_file = json.loads(f.read())

    def print_search_results(self, search_criteria: Dict[str, Any], simulation_ids: List[int], filename: str, game_mode: str) -> None:
        """Record"""
        base_path = os.path.join(self.config.library_path, "forces")
        if not (os.path.exists(base_path)):
            os.mkdir(base_path)

        if not (filename.endswith(".json")):
            filename += ".json"
        fname = os.path.join(base_path, filename)

        print_results = {}
        with open(fname, "w", encoding="UTF-8") as f:
            print_results["MODE"] = game_mode
            print_results["search_condition"] = search_criteria
            print_results["simulation_ids"] = list(simulation_ids)
            f.write(json.dumps(print_results, indent=4))

    def transform_serch_dict(self, item: Dict[str, Any]) -> Dict[str, str]:
        """Transform force_record format."""
        tranform_dict: Dict[str, str] = {}
        for i in item["search"]:
            tranform_dict[i["name"]] = str(i["value"])

        return tranform_dict

    def find_partial_key_match(self, search_keys: Optional[Dict[str, str]] = None, reload_force_json: bool = True) -> Set[int]:
        """
        Returns all ids with partial match in the 'search' field. i.e. search_keys = [{'kind':'3'}] returns all recorded 3-kind entries
        """
        assert search_keys is not None, "must specify serach keys and game_mode"

        if reload_force_json:
            self.load_force_file()
        matched_book_ids: Set[int] = set()
        assert self.current_force_file is not None, "Force file not loaded or empty"
        for entry in self.current_force_file:
            tranform_serach = self.transform_serch_dict(entry)
            if all(tranform_serach.get(k) == v for k, v in search_keys.items()):
                for idx in entry["bookIds"]:
                    matched_book_ids.add(int(idx))

        if len(matched_book_ids) == 0:
            raise Warning("No book-ids found.")
        return matched_book_ids

    def find_union_key_match(self, search_array: List[Dict[str, str]], target_mode: Optional[str] = None) -> Set[int]:
        """
        Returns all id's appearing in multiplie search criteria
        """
        assert target_mode is not None, "Must specify game mode"
        self.load_force_file()

        book_id_sets: List[Set[int]] = []
        for _, search_key in enumerate(search_array):
            book_id_sets.append(self.find_partial_key_match(search_key, False))

        intersection_ids = set.intersection(*book_id_sets) if book_id_sets else set()
        return intersection_ids

    def find_payout_range_ids(
        self,
        method: str,
        min_payout: Optional[int] = None,
        max_payout: Optional[int] = None,
        count_limit: Optional[int] = None,
        lookup_name: Optional[str] = None,
    ) -> List[int]:
        """Search lookup table for simulations where the payout amount fally within a specified range."""
        assert method.upper() in ["RANGE", "MIN", "MAX"], "method must be: RANGE, MIN, or MAX."

        self.method = method.upper()
        match method.upper():
            case "RANGE":
                assert all([min_payout is not None, max_payout is not None])
            case "MIN":
                assert min_payout is not None, "Must specify minimum payout for this method"
                assert max_payout is None, "Cannot specify maximum payout amount for 'MIN' method"
            case "MAX":
                assert max_payout is not None, "Must specify a maximum payout amount"
                assert min_payout is None, "Cannot specify minimum  payout amount for 'MIN' method"

        if lookup_name is None:
            lookup_name = os.path.join(
                self.config.library_path, "lookup_tables", f"lookUpTable_{self.target_mode}.csv"
            )

        recorded_ids = []
        with open(lookup_name, "r", encoding="UTF-8") as f:
            lines = f.readlines()
            for line in lines:
                line_val = int(line.strip().split(",")[-1])
                sim_id = int(line.strip().split(",")[0])
                if (
                    (self.method == "RANGE" and line_val >= min_payout and line_val < max_payout)
                    or (self.method == "MAX" and line_val < max_payout)
                    or (self.method == "MIN" and line_val < min_payout)
                ):
                    recorded_ids.append(sim_id)

                    if count_limit is not None and len(recorded_ids) >= count_limit:
                        break

        return recorded_ids
