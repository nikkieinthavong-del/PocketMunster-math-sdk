"""Analyze symbol hit-rates"""

import csv
import json
import os
from typing import List, Dict, Tuple
from src.config.paths import PATH_TO_GAMES


class HitRateCalculations:
    """Calculate hit-rates of symbol and search key combinations."""

    def __init__(self, game_id, mode, mode_cost):
        self.game_id = game_id
        self.mode = mode
        self.cost = mode_cost
        self.initialize_file()

    def initialize_file(self) -> None:
        """Initialize force files and lookup tables."""
        force_file = os.path.join(
            PATH_TO_GAMES, self.game_id, "library", "forces", f"force_record_{self.mode}.json"
        )
        lut_file = os.path.join(
            PATH_TO_GAMES, self.game_id, "library", "publish_files", f"lookUpTable_{self.mode}_0.csv"
        )
        with open(force_file, "r", encoding="UTF-8") as f:
            file_dict = json.load(f)

        lut_ids: List[int] = []
        weights: List[int] = []
        payouts: List[float] = []
        # Robust CSV read: tolerate header and malformed rows
        with open(lut_file, "r", encoding="UTF-8", newline="") as f:
            reader = csv.reader(f)
            for row in reader:
                if not row:
                    continue
                # Skip commented or header rows
                if isinstance(row[0], str) and (row[0].startswith("#") or row[0].lower() in {"id", "lut_id"}):
                    continue
                try:
                    _id = int(row[0])
                    _w = int(row[1])
                    _p = float(row[2])
                except (ValueError, IndexError):
                    # Malformed row; skip
                    continue
                lut_ids.append(_id)
                weights.append(_w)
                payouts.append(_p)

        # Store aggregates and fast lookup maps
        self.weights = weights
        self.total_weight = sum(weights) if weights else 0
        self.payouts = payouts
        self.id_to_weight: Dict[int, int] = {i: w for i, w in zip(lut_ids, weights)}
        self.id_to_payout: Dict[int, float] = {i: p for i, p in zip(lut_ids, payouts)}
        self.force_dict = file_dict

    def get_hit_rates(self, unique_ids: List[int]) -> float:
        """Get hit-rates using inverse probabilities from optimized lookup tables."""
        if not unique_ids or self.total_weight <= 0:
            return 0.0

        cumulative_weight = 0
        # Deduplicate ids to avoid double counting
        for _id in set(unique_ids):
            w = self.id_to_weight.get(_id, 0)
            if w > 0:
                cumulative_weight += w

        prob = (cumulative_weight / self.total_weight) if self.total_weight else 0.0
        return (1.0 / prob) if prob > 0 else 0.0

    def get_av_wins(self, unique_ids: List[int]) -> float:
        """Return average win amount for a specified list of simulation ids."""
        if not unique_ids:
            return 0.0

        # Total weight for the subset
        ids = set(unique_ids)
        subset_weight = sum(self.id_to_weight.get(_id, 0) for _id in ids)
        if subset_weight <= 0:
            return 0.0

        average_win = 0.0
        # Weighted average payout over the subset
        for _id in ids:
            w = self.id_to_weight.get(_id, 0)
            if w <= 0:
                continue
            p = self.id_to_payout.get(_id, 0.0)
            average_win += p * (w / subset_weight)
        return average_win

    def get_sim_count(self, search_key: Dict[str, str]) -> int:
        """Get raw sim count with partial or complete matches to force file keys."""
        search_key_count = 0
        for key in self.force_dict:
            transform_dict = {}
            for i in key["search"]:
                # Normalize to string for robust comparison
                transform_dict[i["name"]] = str(i["value"])
            if all(transform_dict.get(x) == str(y) for x, y in search_key.items()):
                search_key_count += key["timesTriggered"]
        return search_key_count

    def return_valid_ids(self, search_key: Dict[str, str]) -> List[int]:
        """Extract all ids with a partial match to search conditions."""
        valid_ids = []
        for item in self.force_dict:
            transform_dict = {}
            for i in item["search"]:
                transform_dict[i["name"]] = str(i["value"])

            if all(transform_dict.get(k) == v for k, v in search_key.items()):
                validIDs = item["bookIds"]
                valid_ids.extend(validIDs)

        return valid_ids


def construct_symbol_keys(config) -> List[Dict[str, str]]:
    """Return symbol keys from paytable."""
    search_keys = []
    for symTuple in list(config.paytable.keys()):
        search_keys.append({"kind": str(symTuple[0]), "symbol": str(symTuple[1])})

    return search_keys


def analyse_search_keys(config, modes_to_analyse: List[str], search_keys: List[Dict[str, str]]) -> Tuple[Dict[str, Dict[str, float]], Dict[str, Dict[str, float]], Dict[str, Dict[str, int]]]:
    """Extract win information from search keys."""
    hr_summary, av_win_summary, sim_count_summary = {}, {}, {}
    for mode in modes_to_analyse:
        cost = None
        for bm in config.bet_modes:
            if bm.get_name() == mode:
                cost = bm._cost
                break
        if cost is None:
            raise RuntimeError(f"Mode '{mode}' not found in config.bet_modes")
        GameObject = HitRateCalculations(config.game_id, mode, mode_cost=cost)
        hr_summary[mode], av_win_summary[mode], sim_count_summary[mode] = {}, {}, {}
        for search_key in search_keys:
            valid_key_ids = GameObject.return_valid_ids(search_key)
            hr = GameObject.get_hit_rates(valid_key_ids)
            avg_win = GameObject.get_av_wins(valid_key_ids)
            key_instances = GameObject.get_sim_count(search_key)
            hr_summary[mode][str(search_key)] = hr
            av_win_summary[mode][str(search_key)] = avg_win
            sim_count_summary[mode][str(search_key)] = key_instances

    return hr_summary, av_win_summary, sim_count_summary


def construct_symbol_probabilities(config, modes_to_analyse: List[str]) -> Tuple[Dict[str, Dict[str, float]], Dict[str, Dict[str, float]], Dict[str, Dict[str, int]]]:
    """Find hit-rates of all symbol combinations."""
    check_file = []
    for mode in modes_to_analyse:
        force_file = os.path.join(config.library_path, "forces", f"force_record_{mode}.json")
        check_file.append(os.path.isfile(force_file))
    if not all(check_file):
        raise RuntimeError("Force File Does Not Exist.")

    symbol_search_keys = construct_symbol_keys(config)
    hr_summary, av_win_summary, sim_count_summary = analyse_search_keys(
        config, modes_to_analyse, symbol_search_keys
    )
    return hr_summary, av_win_summary, sim_count_summary


def construct_custom_key_probabilities(config, modes_to_analyse: List[str], custom_search: List[Dict[str, str]]) -> Tuple[Dict[str, Dict[str, float]], Dict[str, Dict[str, float]], Dict[str, Dict[str, int]]]:
    """Analyze win information from user defined search keys."""
    check_file = []
    for mode in modes_to_analyse:
        force_file = os.path.join(config.library_path, "forces", f"force_record_{mode}.json")
        check_file.append(os.path.isfile(force_file))
    if not all(check_file):
        raise RuntimeError("Force File Does Not Exist.")

    hr_summary, av_win_summary, sim_count_summary = analyse_search_keys(config, modes_to_analyse, custom_search)

    return hr_summary, av_win_summary, sim_count_summary
