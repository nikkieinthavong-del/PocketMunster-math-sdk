"""
Print JSON and Excel format PAR sheet results
Note: The PrintXLSX class assumes the use of 'symbol' and 'kind' keys within the force_record file.
"""

import json
import xlsxwriter
import os

from src.config.paths import PATH_TO_GAMES


class PrintJSON:
    """Parse json-format PAR-sheet information."""

    def __init__(self, game_info: dict):
        self.game_info = game_info
        self.setup_json()
        self.print_info()
        self.json_object.close()

    def setup_json(self):
        """Create new JSON format file for storing PAR sheet results."""
        json_path = os.path.join(
            self.game_info.libraryPath, "statistics_summary.json")
        self.json_object = open(json_path, "w", encoding="UTF-8")

    def print_info(self):
        """Parse game information in JSON format."""
        data = {
            "cost_mapping": self.game_info.cost_mapping,
            "mode_fence_info": self.game_info.mode_fence_info,
            "hr_summary": self.game_info.hr_summary,
            "av_win_summary": self.game_info.av_win_summary,
            "sim_count_summary": self.game_info.sim_count_summary,
            "custom_hr_summary": self.game_info.custom_hr_summary,
            "custom_av_win_summary": self.game_info.custom_av_win_summary,
            "custom_sim_count_summary": self.game_info.custom_sim_count_summary,
        }
        # Add indent for pretty-printing
        json.dump(data, self.json_object, indent=4)


class PrintXLSX:
    """Print summary Excel file."""

    def __init__(self, game_info):
        self.game_info = game_info
        self.global_ranges = list(self.game_info.win_ranges)
        self.setup_xlsx()
        for mode in self.game_info.all_modes:
            self.write_mode_probs(str(mode), 0, 0)
            self.write_range_hit_counts(str(mode), 0, self.top_row_col_end)
            self.write_custom_key_info(str(mode), self.last_row_end + 2)
        self.workbook.close()

    def setup_xlsx(self):
        """Initiate Excel format file."""
        self.stat_file_name = os.path.join(
            PATH_TO_GAMES,
            str(self.game_info.game_id),
            "library",
            f"{self.game_info.game_id}_full_statistics.xlsx",
        )
        self.workbook = xlsxwriter.Workbook(self.stat_file_name)

    def write_mode_probs(self, mode, x0, y0):
        """Write hit-rate information within its own Excel Worksheet."""
        # Main info: rtp-allocation and hit-rates
        self.hit_rate_sheet = self.workbook.add_worksheet(str(mode))
        headers = ["Win Ranges", "Hit Rates", "RTP Allocation"]
        self.hit_rate_sheet.write_row(0, 0, headers)
        hr_dict = self.game_info.mode_hit_rate_info[mode]["all_gameType_hits"]["cumulative"]
        rtp_dict = self.game_info.mode_hit_rate_info[mode]["all_gameType_rtp"]["cumulative"]
        for idx, win_range in enumerate(self.global_ranges):
            self.hit_rate_sheet.write(x0 + idx + 1, y0, str(win_range))
            self.hit_rate_sheet.write(x0 + idx + 1, y0 + 1, hr_dict[win_range])
            self.hit_rate_sheet.write(
                x0 + idx + 1, y0 + 2, list(rtp_dict.values())[idx])

        # Hit-rate table by game-mode
        game_headers = list(
            self.game_info.mode_hit_rate_info[mode]["all_gameType_rtp"].keys())
        game_headers_reduced = game_headers[:-1]
        game_col_start = y0 + 5
        self.hit_rate_sheet.write_row(
            x0, game_col_start + 1, game_headers_reduced)

        hr_dict = self.game_info.mode_hit_rate_info[mode]["all_gameType_hits"]
        rtp_dict = self.game_info.mode_hit_rate_info[mode]["all_gameType_rtp"]

        for idx, win_range in enumerate(self.global_ranges):
            self.hit_rate_sheet.write(
                x0 + idx + 1, game_col_start, str(win_range))
            for idy, game_type in enumerate(game_headers_reduced):
                # print(hr_dict[game_type][list(self.global_ranges)[idx]])
                self.hit_rate_sheet.write(
                    x0 + idx + 1, game_col_start + 1 +
                    idy, str(hr_dict[game_type][list(self.global_ranges)[idx]])
                )

        # Write symbol hit-rate table
        symRow = len(self.global_ranges) + 5
        symCol = 0
        self.top_row_col_end = game_col_start + 4 + idy
        sym_mode_hit_rate = self.game_info.hr_summary[mode]
        sym_count_hit_rate = self.game_info.sim_count_summary[mode]
        sym_avg_win = self.game_info.av_win_summary[mode]

        symbols, kinds = [], []
        for key in list(sym_mode_hit_rate.keys()):
            temp_kind = eval(key)["kind"]
            temp_symbol = eval(key)["symbol"]
            if temp_symbol not in symbols:
                symbols.append(temp_symbol)
            if temp_kind not in kinds:
                kinds.append(temp_kind)

        freq_dict = {}
        count_dict = {}
        av_dict = {}
        for sym in symbols:
            freq_dict[sym] = {}
            count_dict[sym] = {}
            av_dict[sym] = {}
            for kind in kinds:
                freq_dict[sym][kind] = 0
                count_dict[sym][kind] = 0
                av_dict[sym][kind] = 0

        for key in list(sym_mode_hit_rate.keys()):
            temp_sym = eval(key)["symbol"]
            temp_kind = eval(key)["kind"]
            freq_dict[temp_sym][temp_kind] = round(sym_mode_hit_rate[key], 2)
            count_dict[temp_sym][temp_kind] = int(sym_count_hit_rate[key])
            av_dict[temp_sym][temp_kind] = round(sym_avg_win[key], 1)

        # Symbol combination hit-rates
        self.hit_rate_sheet.write(symRow - 1, symCol, str("HIT RATES"))
        for idSym, sym in enumerate(symbols):
            self.hit_rate_sheet.write(symRow + idSym + 1, symCol, str(sym))
        for idKind, kind in enumerate(kinds):
            self.hit_rate_sheet.write(symRow, symCol + 1 + idKind, kind)
            for idSym, sym in enumerate(symbols):
                self.hit_rate_sheet.write(
                    symRow + idSym + 1, symCol + idKind + 1, freq_dict[sym][kind])

        self.last_row_end = symRow + idSym + 1
        self.last_col_end = symCol + idKind + 4

        # Write number valid sim counts
        self.hit_rate_sheet.write(
            symRow - 1, symCol + self.last_col_end, str("SIM COUNTS"))
        for idSym, sym in enumerate(symbols):
            self.hit_rate_sheet.write(
                symRow + idSym + 1, symCol + self.last_col_end, str(sym))
        for idKind, kind in enumerate(kinds):
            self.hit_rate_sheet.write(
                symRow, symCol + 1 + idKind + self.last_col_end, kind)
            for idSym, sym in enumerate(symbols):
                self.hit_rate_sheet.write(
                    symRow + idSym + 1, symCol + idKind + 1 +
                    self.last_col_end, count_dict[sym][kind]
                )

        self.last_col_end += symCol + idKind + 4
        # Write Avg Win for valid symbol combination
        self.hit_rate_sheet.write(
            symRow - 1, symCol + self.last_col_end, str("AVG WINS"))
        for idSym, sym in enumerate(symbols):
            self.hit_rate_sheet.write(
                symRow + idSym + 1, symCol + self.last_col_end, str(sym))
        for idKind, kind in enumerate(kinds):
            self.hit_rate_sheet.write(
                symRow, symCol + 1 + idKind + self.last_col_end, kind)
            for idSym, sym in enumerate(symbols):
                self.hit_rate_sheet.write(
                    symRow + idSym + 1, symCol + idKind + 1 +
                    self.last_col_end, av_dict[sym][kind]
                )

        self.last_row_end = symRow + idSym + 4

    def write_range_hit_counts(self, mode, x0, y0):
        """Write simulation counts to Excel sheet."""
        range_hit_counts = self.game_info.mode_hit_counts
        self.hit_rate_sheet.write(x0, y0, "Win Ranges")
        self.hit_rate_sheet.write(x0, y0 + 1, "SIM COUNTS")
        for idx, key in enumerate(list(range_hit_counts[mode].keys())):
            self.hit_rate_sheet.write(x0 + idx + 1, y0, str(key))
            self.hit_rate_sheet.write(
                x0 + 1 + idx, y0 + 1, range_hit_counts[mode][key])

    def write_custom_key_info(self, mode, row_start):
        """Write summary win information for user-defined search keys."""
        custom_hr = self.game_info.custom_hr_summary[mode]
        custom_count = self.game_info.custom_sim_count_summary[mode]
        custom_avg = self.game_info.custom_av_win_summary[mode]
        custom_keys = list(custom_hr.keys())
        # write hr, sim_count, av_win
        self.hit_rate_sheet.write(row_start, 0, str("CUSTOM"))
        self.hit_rate_sheet.write_row(row_start + 1, 1, ["HR", "COUNT", "AVG"])
        for idx, key in enumerate(custom_keys):
            self.hit_rate_sheet.write(row_start + 2 + idx, 0, str(key))
            self.hit_rate_sheet.write(
                row_start + 2 + idx, 1, str(custom_hr[key]))
            self.hit_rate_sheet.write(
                row_start + 2 + idx, 2, str(custom_count[key]))
            self.hit_rate_sheet.write(
                row_start + 2 + idx, 3, str(custom_avg[key]))
