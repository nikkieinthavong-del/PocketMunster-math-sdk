"""
Scan force-files for simulation IDs matching given search criteria.

This module provides tools for searching and filtering simulation IDs from force-files
based on various criteria including partial key matches, union operations, and payout ranges.
"""

import json
import logging
import os
import importlib
from pathlib import Path
from typing import Dict, List, Optional, Set, Union, Any
from functools import lru_cache
import time


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ForceToolError(Exception):
    """Custom exception for ForceTool-related errors."""
    pass


class ForceToolConfigurationError(ForceToolError):
    """Exception raised for configuration-related errors."""
    pass


class ForceToolFileError(ForceToolError):
    """Exception raised for file operation errors."""
    pass


class ForceToolValidationError(ForceToolError):
    """Exception raised for input validation errors."""
    pass


def load_game_config(game_id: str) -> Any:
    """
    Load game configuration class dynamically.

    Args:
        game_id: The game identifier used to construct the module path

    Returns:
        Configured game config instance

    Raises:
        ForceToolConfigurationError: If the game config cannot be loaded
    """
    try:
        module_path = f"games.{game_id}.game_config"
        logger.debug(f"Loading game config from: {module_path}")

        module = importlib.import_module(module_path)
        config_class = getattr(module, "GameConfig")
        config_instance = config_class()

        logger.info(f"Successfully loaded game config for game_id: {game_id}")
        return config_instance

    except (ImportError, AttributeError) as e:
        error_msg = f"Failed to load game config for game_id '{game_id}': {str(e)}"
        logger.error(error_msg)
        raise ForceToolConfigurationError(error_msg) from e


def get_mode_names_from_config(game_config: Any) -> List[str]:
    """
    Extract bet mode names from game configuration.

    Args:
        game_config: Game configuration object with bet_modes attribute

    Returns:
        List of bet mode names

    Raises:
        ForceToolValidationError: If game_config is invalid or missing bet_modes
    """
    if not hasattr(game_config, 'bet_modes'):
        raise ForceToolValidationError("Game config missing 'bet_modes' attribute")

    try:
        mode_names = [bet_mode.get_name() for bet_mode in game_config.bet_modes]
        logger.debug(f"Extracted {len(mode_names)} mode names from config")
        return mode_names
    except AttributeError as e:
        raise ForceToolValidationError(f"Invalid bet_mode object in config: {str(e)}") from e


class ForceFileManager:
    """Handles force file operations with caching and validation."""

    def __init__(self, config: Any, target_mode: str):
        """
        Initialize the force file manager.

        Args:
            config: Game configuration object
            target_mode: Target game mode for file operations
        """
        self.config = config
        self.target_mode = target_mode
        self._cache: Optional[Dict[str, Any]] = None
        self._cache_timestamp: Optional[float] = None
        self._cache_ttl = 300  # 5 minutes cache TTL

    def _is_cache_valid(self) -> bool:
        """Check if cached data is still valid."""
        if self._cache_timestamp is None:
            return False
        return (time.time() - self._cache_timestamp) < self._cache_ttl

    def _get_force_file_path(self) -> Path:
        """Get the force file path."""
        return Path(self.config.library_path) / "forces" / f"force_record_{self.target_mode}.json"

    def load_force_file(self, use_cache: bool = True) -> Dict[str, Any]:
        """
        Load and cache force file data.

        Args:
            use_cache: Whether to use cached data if available

        Returns:
            Force file data as dictionary

        Raises:
            ForceToolFileError: If file cannot be read or parsed
        """
        if use_cache and self._is_cache_valid() and self._cache is not None:
            logger.debug("Using cached force file data")
            return self._cache

        file_path = self._get_force_file_path()

        try:
            if not file_path.exists():
                raise ForceToolFileError(f"Force file not found: {file_path}")

            logger.info(f"Loading force file: {file_path}")
            with open(file_path, "r", encoding="UTF-8") as f:
                data = json.load(f)

            # Validate file structure
            if not isinstance(data, list):
                raise ForceToolFileError("Force file must contain a list of entries")

            self._cache = data
            self._cache_timestamp = time.time()
            logger.info(f"Successfully loaded {len(data)} force file entries")

            return data

        except json.JSONDecodeError as e:
            error_msg = f"Invalid JSON in force file {file_path}: {str(e)}"
            logger.error(error_msg)
            raise ForceToolFileError(error_msg) from e
        except (OSError, IOError) as e:
            error_msg = f"Failed to read force file {file_path}: {str(e)}"
            logger.error(error_msg)
            raise ForceToolFileError(error_msg) from e

    def clear_cache(self) -> None:
        """Clear the cached force file data."""
        self._cache = None
        self._cache_timestamp = None
        logger.debug("Force file cache cleared")


class ForceTool:
    """
    Advanced tool for scanning force-files and finding simulation IDs matching search criteria.

    This class provides multiple search strategies:
    - Partial key matching for individual criteria
    - Union operations across multiple criteria
    - Payout range filtering from lookup tables
    - Cached file operations for improved performance
    """

    def __init__(self, game_id: str, game_mode: str):
        """
        Initialize the ForceTool.

        Args:
            game_id: Game identifier for configuration loading
            game_mode: Target game mode for file operations

        Raises:
            ForceToolConfigurationError: If game configuration cannot be loaded
            ForceToolValidationError: If input parameters are invalid
        """
        if not game_id or not game_mode:
            raise ForceToolValidationError("game_id and game_mode cannot be empty")

        self.game_id = game_id
        self.target_mode = game_mode
        self.method: Optional[str] = None

        # Load configuration
        self.config = load_game_config(game_id)

        # Initialize file manager
        self.file_manager = ForceFileManager(self.config, game_mode)

        logger.info(f"ForceTool initialized for game_id: {game_id}, mode: {game_mode}")

    def get_force_file_name(self) -> str:
        """Get the force file path."""
        return str(self.file_manager._get_force_file_path())

    def reload_force_file(self) -> None:
        """Force reload of the force file, clearing cache."""
        self.file_manager.clear_cache()
        logger.info("Force file cache cleared")

    def print_search_results(
        self,
        search_criteria: Dict[str, Any],
        simulation_ids: Union[List[int], Set[int]],
        filename: str,
        game_mode: Optional[str] = None
    ) -> None:
        """
        Save search results to a JSON file.

        Args:
            search_criteria: The search criteria used
            simulation_ids: List or set of matching simulation IDs
            filename: Output filename (will be .json if not specified)
            game_mode: Game mode override (uses instance mode if not provided)

        Raises:
            ForceToolFileError: If results cannot be written
        """
        if game_mode is None:
            game_mode = self.target_mode

        base_path = Path(self.config.library_path) / "forces"

        try:
            base_path.mkdir(parents=True, exist_ok=True)
        except (OSError, IOError) as e:
            raise ForceToolFileError(f"Cannot create forces directory {base_path}: {str(e)}")

        if not filename.endswith(".json"):
            filename += ".json"

        output_path = base_path / filename

        results = {
            "MODE": game_mode,
            "search_condition": search_criteria,
            "simulation_ids": list(simulation_ids),
            "total_count": len(simulation_ids),
            "timestamp": time.time()
        }

        try:
            with open(output_path, "w", encoding="UTF-8") as f:
                json.dump(results, f, indent=2)

            logger.info(f"Search results saved to: {output_path} ({len(simulation_ids)} IDs)")
        except (OSError, IOError) as e:
            raise ForceToolFileError(f"Cannot write results to {output_path}: {str(e)}")

    def transform_search_dict(self, item: Dict[str, Any]) -> Dict[str, str]:
        """
        Transform force record format to searchable dictionary.

        Args:
            item: Force record entry with 'search' field

        Returns:
            Dictionary mapping search names to string values

        Raises:
            ForceToolValidationError: If entry format is invalid
        """
        if not isinstance(item, dict) or "search" not in item:
            raise ForceToolValidationError("Invalid force record entry format")

        try:
            transformed_dict = {}
            for search_item in item["search"]:
                if not isinstance(search_item, dict) or "name" not in search_item or "value" not in search_item:
                    raise ForceToolValidationError("Invalid search item format in force record")

                transformed_dict[search_item["name"]] = str(search_item["value"])

            return transformed_dict
        except (KeyError, TypeError) as e:
            raise ForceToolValidationError(f"Error transforming search dict: {str(e)}") from e

    def find_partial_key_match(
        self,
        search_keys: Dict[str, str],
        reload_force_json: bool = True
    ) -> Set[int]:
        """
        Find simulation IDs with partial key matches.

        Args:
            search_keys: Dictionary of key-value pairs to match
            reload_force_json: Whether to reload the force file from disk

        Returns:
            Set of matching simulation book IDs

        Raises:
            ForceToolValidationError: If search_keys is invalid
            ForceToolError: If no matches found or file cannot be loaded
        """
        if not search_keys:
            raise ForceToolValidationError("search_keys cannot be empty")

        if reload_force_json:
            self.file_manager.clear_cache()

        try:
            force_data = self.file_manager.load_force_file()
            matched_book_ids: Set[int] = set()

            for entry in force_data:
                try:
                    transformed_search = self.transform_search_dict(entry)

                    # Check if all search criteria match
                    if all(transformed_search.get(key) == value for key, value in search_keys.items()):
                        book_ids = entry.get("bookIds", [])
                        if not isinstance(book_ids, list):
                            logger.warning(f"Invalid bookIds format in entry: {book_ids}")
                            continue

                        for book_id in book_ids:
                            try:
                                matched_book_ids.add(int(book_id))
                            except (ValueError, TypeError) as e:
                                logger.warning(f"Invalid book ID '{book_id}': {str(e)}")

                except ForceToolValidationError as e:
                    logger.warning(f"Skipping invalid entry: {str(e)}")
                    continue

            if not matched_book_ids:
                raise ForceToolError("No simulation IDs found matching the search criteria")

            logger.info(f"Found {len(matched_book_ids)} matching simulation IDs")
            return matched_book_ids

        except ForceToolFileError as e:
            logger.error(f"Failed to load force file: {str(e)}")
            raise

    def find_union_key_match(self, search_array: List[Dict[str, str]]) -> Set[int]:
        """
        Find simulation IDs appearing in multiple search criteria (intersection).

        Args:
            search_array: List of search criteria dictionaries

        Returns:
            Set of simulation IDs present in all criteria

        Raises:
            ForceToolValidationError: If search_array is invalid
            ForceToolError: If no intersection found
        """
        if not search_array:
            raise ForceToolValidationError("search_array cannot be empty")

        if len(search_array) < 2:
            raise ForceToolValidationError("At least 2 search criteria required for union operation")

        logger.info(f"Performing union operation on {len(search_array)} search criteria")

        try:
            # Get matching IDs for each search criterion
            id_sets = []
            for i, search_keys in enumerate(search_array):
                logger.debug(f"Processing search criterion {i + 1}/{len(search_array)}")
                ids = self.find_partial_key_match(search_keys, reload_force_json=False)
                id_sets.append(ids)

            # Find intersection of all ID sets
            if not id_sets:
                raise ForceToolError("No matching IDs found in any search criteria")

            intersection_ids = set.intersection(*id_sets)

            if not intersection_ids:
                raise ForceToolError("No simulation IDs found in the intersection of all search criteria")

            logger.info(f"Union operation found {len(intersection_ids)} common simulation IDs")
            return intersection_ids

        except ForceToolError:
            raise  # Re-raise our custom errors
        except Exception as e:
            raise ForceToolError(f"Unexpected error during union operation: {str(e)}") from e

    def find_payout_range_ids(
        self,
        method: str,
        min_payout: Optional[int] = None,
        max_payout: Optional[int] = None,
        count_limit: Optional[int] = None,
        lookup_name: Optional[str] = None,
    ) -> List[int]:
        """
        Search lookup table for simulations where payout amount falls within specified range.

        Args:
            method: Search method - 'RANGE', 'MIN', or 'MAX'
            min_payout: Minimum payout threshold
            max_payout: Maximum payout threshold
            count_limit: Maximum number of results to return
            lookup_name: Custom lookup table path (optional)

        Returns:
            List of matching simulation IDs

        Raises:
            ForceToolValidationError: If method or parameters are invalid
            ForceToolFileError: If lookup table cannot be read
        """
        # Validate method
        valid_methods = ["RANGE", "MIN", "MAX"]
        if method.upper() not in valid_methods:
            raise ForceToolValidationError(f"Method must be one of: {', '.join(valid_methods)}")

        self.method = method.upper()

        # Validate parameters based on method
        if self.method == "RANGE":
            if min_payout is None or max_payout is None:
                raise ForceToolValidationError("Both min_payout and max_payout required for RANGE method")
            if min_payout >= max_payout:
                raise ForceToolValidationError("min_payout must be less than max_payout")
        elif self.method == "MIN":
            if min_payout is None:
                raise ForceToolValidationError("min_payout required for MIN method")
            if max_payout is not None:
                raise ForceToolValidationError("max_payout not allowed for MIN method")
        elif self.method == "MAX":
            if max_payout is None:
                raise ForceToolValidationError("max_payout required for MAX method")
            if min_payout is not None:
                raise ForceToolValidationError("min_payout not allowed for MAX method")

        # Validate count_limit
        if count_limit is not None and count_limit <= 0:
            raise ForceToolValidationError("count_limit must be positive")

        # Determine lookup table path
        if lookup_name is None:
            lookup_name = str(
                Path(self.config.library_path) / "lookup_tables" / f"lookUpTable_{self.target_mode}.csv"
            )

        lookup_path = Path(lookup_name)
        if not lookup_path.exists():
            raise ForceToolFileError(f"Lookup table not found: {lookup_path}")

        logger.info(f"Searching lookup table: {lookup_path} with method: {self.method}")

        try:
            recorded_ids = []
            with open(lookup_path, "r", encoding="UTF-8") as f:
                for line_num, line in enumerate(f, 1):
                    try:
                        parts = line.strip().split(",")
                        if len(parts) < 2:
                            logger.warning(f"Skipping invalid line {line_num}: {line.strip()}")
                            continue

                        sim_id = int(parts[0])
                        payout_value = int(parts[-1])

                        # Check if this entry matches our criteria
                        should_include = False
                        if self.method == "RANGE":
                            should_include = min_payout <= payout_value < max_payout
                        elif self.method == "MIN":
                            should_include = payout_value >= min_payout
                        elif self.method == "MAX":
                            should_include = payout_value <= max_payout

                        if should_include:
                            recorded_ids.append(sim_id)

                            # Check count limit
                            if count_limit is not None and len(recorded_ids) >= count_limit:
                                logger.info(f"Reached count limit of {count_limit}")
                                break

                    except (ValueError, IndexError) as e:
                        logger.warning(f"Skipping invalid line {line_num}: {str(e)}")
                        continue

            logger.info(f"Payout range search found {len(recorded_ids)} matching simulation IDs")
            return recorded_ids

        except (OSError, IOError) as e:
            raise ForceToolFileError(f"Cannot read lookup table {lookup_path}: {str(e)}")
