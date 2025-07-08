import os
from collections import defaultdict

from src.config.paths import PATH_TO_GAMES


class OutputFiles:
    """Construct all output filename and directories."""

    def __init__(self, game_config: object):
        self.game_config = game_config
        self.setup_output_directories()
        self.assign_config_details()
        self.assign_book_details()
        self.assign_force_details()
        self.assign_lookup_details()

    def check_folder_exists(self, folder_path: str) -> None:
        """Check if target folder exists, and create if it does not."""
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)

    def setup_output_directories(self):
        """Entrypoint for saving all output files."""
        self.library_path = os.path.join(PATH_TO_GAMES, str(self.game_config.game_id), "library")
        self.temp_path = os.path.join(self.library_path, "temp_multi_threaded_files")
        self.config_path = os.path.join(self.library_path, "configs")
        self.force_path = os.path.join(self.library_path, "forces")
        self.book_path = os.path.join(self.library_path, "books")
        self.lookup_path = os.path.join(self.library_path, "lookup_tables")
        self.publish_path = os.path.join(self.library_path, "publish_files")
        self.optimization_path = os.path.join(self.library_path, "optimization_files")
        self.index_config_path = self.publish_path  # Required RGS files
        self.compressed_path = self.publish_path  # Required RGS files
        self.final_lookup_path = self.publish_path  # Required RGS files
        self.optimization_result_path = os.path.join(self.optimization_path, "trial_results")

        all_paths = [
            "library_path",
            "book_path",
            "compressed_path",
            "lookup_path",
            "config_path",
            "force_path",
            "temp_path",
            "optimization_path",
            "optimization_result_path",
            "publish_path",
        ]
        for p in all_paths:
            self.check_folder_exists(getattr(self, p))

    def assign_config_details(self):
        """All config filenames and paths."""
        self.configs = {
            "folder_dir": self.config_path,
            "names": {
                "manifest": "index.json",
                "be_config": "config.json",
                "fe_config": "fe_config.json",
                "math_config": "math_config.json",
            },
            "paths": {
                "manifest": os.path.join(self.publish_path, "index.json"),
                "be_config": os.path.join(self.config_path, "config.json"),
                "fe_config": os.path.join(self.config_path, f"config_fe_{self.game_config.game_id}.json"),
                "math_config": os.path.join(self.config_path, "math_config.json"),
            },
        }

    def assign_book_details(self):
        """Compressed and uncompressed simulation books."""
        self.books = defaultdict(dict)
        for mode in self.game_config.bet_modes:
            if not self.game_config.output_regular_json:
                books_name = f"books_{mode.get_name()}"
                ext_name = ".jsonl"
            else:
                books_name = f"books_{mode.get_name()}"
                ext_name = ".json"

            self.books[mode.get_name()] = {
                "folder_dir": self.book_path,
                "names": {
                    "books_uncompressed": books_name + ext_name,
                    "books_compressed": books_name + ".jsonl.zst",
                },
                "paths": {
                    "books_uncompressed": os.path.join(self.book_path, books_name + ext_name),
                    "books_compressed": os.path.join(self.compressed_path, books_name + ".jsonl.zst"),
                },
            }

    def assign_force_details(self):
        """Recorded game event files."""
        self.force = defaultdict(dict)
        for mode in self.game_config.bet_modes:
            self.force[mode.get_name()] = {
                "folder_dir": self.force_path,
                "names": {"force_record": f"force_record_{mode.get_name()}.json"},
                "paths": {"force_record": os.path.join(self.force_path, f"force_record_{mode.get_name()}.json")},
            }

    def assign_lookup_details(self):
        """Lookup tables and gametype win information."""
        self.lookups = defaultdict(dict)
        for mode in self.game_config.bet_modes:
            self.lookups[mode.get_name()] = {
                "folder_dir": self.lookup_path,
                "names": {
                    "base_lookup": f"lookUpTable_{mode.get_name()}.csv",
                    "optimized_lookup": f"lookUpTable_{mode.get_name()}_0.csv",
                    "segmented_id": f"lookUpTableSegmented_{mode.get_name()}.csv",
                },
                "paths": {
                    "base_lookup": os.path.join(self.lookup_path, f"lookUpTable_{mode.get_name()}.csv"),
                    "optimized_lookup": os.path.join(self.publish_path, f"lookUpTable_{mode.get_name()}_0.csv"),
                    "segmented_id": os.path.join(self.lookup_path, f"lookUpTableSegmented_{mode.get_name()}.csv"),
                },
            }

    def get_temp_multi_thread_name(self, betmode: str, thread_index: int, repeat_count: int, compress: bool):
        """Naming convention for temp book files."""
        if compress:
            filename = f"books_{betmode}_{thread_index}_{repeat_count}.jsonl.zst"
        elif not (compress) and self.game_config.output_regular_json:
            filename = f"books_{betmode}_{thread_index}_{repeat_count}.json"
        elif not (compress) and not (self.game_config.output_regular_json):
            filename = f"books_{betmode}_{thread_index}_{repeat_count}.jsonl"
        else:
            raise RuntimeError("Error in logic generating book name")

        return os.path.join(self.temp_path, filename)

    def get_temp_lookup_name(self, betmode: str, thread_index: int, repeat_count: int):
        """Naming convention for temp lookup files."""
        return os.path.join(self.temp_path, f"lookUpTable_{betmode}_{thread_index}_{repeat_count}")

    def get_temp_segmented_name(self, betmode: str, thread_index: int, repeat_count: int):
        """Naming convention for temp segmented lookup files."""
        return os.path.join(self.temp_path, f"lookUpTableSegmented_{betmode}_{thread_index}_{repeat_count}")

    def get_temp_force_name(self, betmode: str, thread_index: int, repeat_count: int):
        """Naming convention for temp force files."""
        return os.path.join(self.temp_path, f"force_{betmode}_{thread_index}_{repeat_count}.json")

    def get_final_book_name(self, betmode: str, compress: bool):
        """Returns final simulation books output name."""
        if compress:
            filename = f"books_{betmode}.jsonl.zst"
        elif not (compress) and self.game_config.output_regular_json:
            filename = f"books_{betmode}.json"
        elif not (compress) and not (self.game_config.output_regular_json):
            filename = f"books_{betmode}.jsonl"
        else:
            raise RuntimeError("Logic error in name generation.")
        return os.path.join(self.compressed_path if compress else self.book_path, filename)

    def get_final_lookup_name(self, betmode: str):
        """Final csv lookup table name."""
        return os.path.join(self.lookup_path, f"lookUpTable_{betmode}.csv")

    def get_optimized_lookup_name(self, betmode: str):
        """Optimized lookup table"""
        return os.path.join(self.publish_path, f"lookUpTable_{betmode}_0.csv")

    def get_final_segmented_name(self, betmode: str):
        """Final csv segmented wins lookup table name."""
        return os.path.join(self.lookup_path, f"lookUpTableSegmented_{betmode}.csv")
