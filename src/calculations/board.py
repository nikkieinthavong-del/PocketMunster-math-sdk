"""Handles generating game-boards from reelstrips"""

import random
from typing import List, Dict, Any
from src.state.state import GeneralGameState
from src.calculations.statistics import get_random_outcome
from src.events.events import reveal_event


class Board(GeneralGameState):
    """Handles generation of a game board and symbols"""

    def create_board_reelstrips(self) -> None:
        """Randomly selects stopping positions from a reelstrip."""
        top_symbols: List[Any] = []
        bottom_symbols: List[Any] = []
        if self.config.include_padding:
            top_symbols = []
            bottom_symbols = []
        self.refresh_special_syms()
        self.reelstrip_id = get_random_outcome(
            self.get_current_distribution_conditions()["reel_weights"][self.gametype]
        )
        self.reelstrip = self.config.reels[self.reelstrip_id]
        anticipation = [0] * self.config.num_reels
        board = [[]] * self.config.num_reels
        for i in range(self.config.num_reels):
            board[i] = [0] * self.config.num_rows[i]
        reel_positions = [random.randrange(0, len(self.reelstrip[reel])) for reel in range(self.config.num_reels)]
        padding_positions = [0] * self.config.num_reels
        first_scatter_reel = -1
        for reel in range(self.config.num_reels):
            reel_pos = reel_positions[reel]
            if self.config.include_padding:
                top_symbols.append(
                    self.create_symbol(self.reelstrip[reel][(reel_pos - 1) % len(self.reelstrip[reel])])
                )
                bottom_symbols.append(
                    self.create_symbol(
                        self.reelstrip[reel][(reel_pos + len(board[reel])) % len(self.reelstrip[reel])]
                    )
                )
            for row in range(self.config.num_rows[reel]):
                sym_id = self.reelstrip[reel][(reel_pos + row) % len(self.reelstrip[reel])]
                sym = self.create_symbol(sym_id)
                board[reel][row] = sym
                if sym.special:
                    for special_symbol in self.special_syms_on_board:
                        for s in self.config.special_symbols[special_symbol]:
                            if board[reel][row].name == s:
                                self.special_syms_on_board[special_symbol] += [{"reel": reel, "row": row}]
                                if (
                                    board[reel][row].check_attribute("scatter")
                                    and len(self.special_syms_on_board[special_symbol])
                                    >= self.config.anticipation_triggers[self.gametype]
                                    and first_scatter_reel == -1
                                ):
                                    first_scatter_reel = reel + 1
            padding_positions[reel] = (reel_positions[reel] + len(board[reel]) + 1) % len(self.reelstrip[reel])

        if first_scatter_reel > -1 and first_scatter_reel != self.config.num_reels:
            count = 1
            for reel in range(first_scatter_reel, self.config.num_reels):
                anticipation[reel] = count
                count += 1

        for r in range(1, self.config.num_reels):
            if anticipation[r - 1] > anticipation[r]:
                raise RuntimeError("anticipation values must be non-decreasing left-to-right")

        self.board = board
        self.get_special_symbols_on_board()
        self.reel_positions = reel_positions
        self.padding_position = padding_positions
        self.anticipation = anticipation
        if self.config.include_padding:
            self.top_symbols = top_symbols
            self.bottom_symbols = bottom_symbols

    def force_board_from_reelstrips(self, reelstrip_id: str, force_stop_positions: Dict[int, int]) -> None:
        """Creates a gameboard from specified stopping positions."""
        top_symbols: List[Any] = []
        bottom_symbols: List[Any] = []
        if self.config.include_padding:
            top_symbols = []
            bottom_symbols = []
        self.refresh_special_syms()
        self.reelstrip_id = reelstrip_id
        self.reelstrip = self.config.reels[self.reelstrip_id]
        anticipation = [0] * self.config.num_reels
        board = [[]] * self.config.num_reels
        for i in range(self.config.num_reels):
            board[i] = [0] * self.config.num_rows[i]

        reel_positions = [None] * self.config.num_reels
        for r, s in force_stop_positions.items():
            reel_positions[r] = s - random.randint(0, self.config.num_rows[r] - 1)
        for r, _ in enumerate(reel_positions):
            if reel_positions[r] is None:
                reel_positions[r] = random.randrange(0, len(self.reelstrip[r]))

        padding_positions = [0] * self.config.num_reels
        first_scatter_reel = -1
        for reel in range(self.config.num_reels):
            reel_pos = reel_positions[reel]
            if self.config.include_padding:
                top_symbols.append(
                    self.create_symbol(self.reelstrip[reel][(reel_pos - 1) % len(self.reelstrip[reel])])
                )
                bottom_symbols.append(
                    self.create_symbol(
                        self.reelstrip[reel][(reel_pos + len(board[reel])) % len(self.reelstrip[reel])]
                    )
                )
            for row in range(self.config.num_rows[reel]):
                sym_id = self.reelstrip[reel][(reel_pos + row) % len(self.reelstrip[reel])]
                sym = self.create_symbol(sym_id)
                board[reel][row] = sym

                if sym.special:
                    for special_symbol in self.special_syms_on_board:
                        for s in self.config.special_symbols[special_symbol]:
                            if board[reel][row].name == s:
                                self.special_syms_on_board[special_symbol] += [{"reel": reel, "row": row}]
                                if (
                                    board[reel][row].check_attribute("scatter")
                                    and len(self.special_syms_on_board[special_symbol])
                                    >= self.config.anticipation_triggers[self.gametype]
                                    and first_scatter_reel == -1
                                ):
                                    first_scatter_reel = reel + 1
                padding_positions[reel] = (reel_positions[reel] + len(board[reel]) + 1) % len(self.reelstrip[reel])

        if first_scatter_reel > -1 and first_scatter_reel <= self.config.num_reels:
            count = 1
            for reel in range(first_scatter_reel, self.config.num_reels):
                anticipation[reel] = count
                count += 1

        self.board = board
        self.reel_positions = reel_positions
        self.padding_position = padding_positions
        self.anticipation = anticipation
        if self.config.include_padding:
            self.top_symbols = top_symbols
            self.bottom_symbols = bottom_symbols

    def create_symbol(self, name: str) -> Any:
        """Create a new symbol and assign relevant attributes."""
        if name not in self.symbol_storage.symbols:
            raise ValueError(f"Symbol '{name}' is not registered.")
        symObject = self.symbol_storage.create_symbol_state(name)
        if name in getattr(self, "special_symbol_functions", {}):
            for func in self.special_symbol_functions[name]:
                try:
                    func(symObject)
                except Exception:
                    # Keep symbol creation resilient; ignore handler errors
                    pass

        return symObject

    def refresh_special_syms(self) -> None:
        """Reset recorded speical symbols on board."""
        self.special_syms_on_board = {}
        for s in self.config.special_symbols:
            self.special_syms_on_board[s] = []

    def get_special_symbols_on_board(self) -> None:
        """Scans board for any active special symbols."""
        self.refresh_special_syms()
        for reel, _ in enumerate(self.board):
            for row, _ in enumerate(self.board[reel]):
                sym = self.board[reel][row]
                if getattr(sym, "special", False):
                    for specialType in list(self.special_syms_on_board.keys()):
                        if sym.check_attribute(specialType):
                            self.special_syms_on_board[specialType].append({"reel": reel, "row": row})

    def transpose_board_string(self, board_string: List[List[str]]) -> List[List[str]]:
        """Transpose symbol names in the format displayed to the player during the game."""
        return [list(row) for row in zip(*board_string)]

    def print_board(self, board: List[List[Any]]) -> List[List[str]]:
        "Prints transposed symbol names to the terminal."
        string_board = []
        max_sum_length = max(len(sym.name) for row in board for sym in row) + 1
        board_string = [[sym.name.ljust(max_sum_length) for sym in reel] for reel in board]
        transpose_board = self.transpose_board_string(board_string)
        print("\n")
        for row in transpose_board:
            string_board.append("".join(row))
            print("".join(row))
        print("\n")
        return string_board

    def board_string(self, board: List[List[Any]]):
        """Prints symbol names only from gamestate.board."""
        board_str = [] * self.config.num_reels
        for reel in range(len(board)):
            board_str.append([x.name for x in board[reel]])
        return board_str

    def draw_board(self, emit_event: bool = True, trigger_symbol: str = "scatter") -> None:
        """Draw a board. Optionally force a number of trigger symbols in base game."""
        if (
            self.get_current_distribution_conditions()["force_freegame"]
            and self.gametype == self.config.basegame_type
        ):
            num_scatters = int(get_random_outcome(self.get_current_distribution_conditions()["scatter_triggers"]))
            self.force_special_board(trigger_symbol, num_scatters)
        elif (
            not (self.get_current_distribution_conditions()["force_freegame"])
            and self.gametype == self.config.basegame_type
        ):
            self.create_board_reelstrips()
            # Avoid accidental free-spin triggers when not forcing
            try:
                min_trigger = min(self.config.freespin_triggers[self.gametype].keys())
            except Exception:
                min_trigger = float("inf")
            max_attempts = getattr(self.config, "avoid_freegame_max_attempts", 500)
            attempts = 0
            while self.count_special_symbols(trigger_symbol) >= min_trigger and attempts < max_attempts:
                self.create_board_reelstrips()
                attempts += 1
        else:
            self.create_board_reelstrips()
        if emit_event:
            reveal_event(self)

    def force_special_board(self, force_criteria: str, num_force_syms: int) -> None:
        """
        Force a board to have a specified number of symbols.
        Set a specific type of special symbol on a given number of reels.
        """
        max_attempts = getattr(self.config, "force_board_max_attempts", 2000)
        attempts = 0
        while True:
            if attempts >= max_attempts:
                # Give up to avoid infinite loops in pathological configs
                break
            self._force_special_board(force_criteria, num_force_syms)
            if (
                force_criteria in self.config.special_symbols
                and self.count_special_symbols(force_criteria) == num_force_syms
            ):
                break
            elif (
                force_criteria not in self.config.special_symbols
                and self.count_symbols_on_board(force_criteria) == num_force_syms
            ):
                break
            attempts += 1

    def _force_special_board(self, force_criteria: str, num_force_syms: int) -> None:
        """
        Helper function for forcing special (or name specific) symbols
        """
        reelstrip_id = str(get_random_outcome(
            self.get_current_distribution_conditions()["reel_weights"][self.gametype]
        ))
        reelstops = self.get_syms_on_reel(reelstrip_id, force_criteria)

        sym_prob = []
        for x in range(self.config.num_reels):
            sym_prob.append(len(reelstops[x]) / len(self.config.reels[reelstrip_id][x]))
        force_stop_positions: Dict[int, int] = {}
        while len(force_stop_positions) != num_force_syms:
            possible_reels = [i for i in range(self.config.num_reels) if sym_prob[i] > 0]
            possible_probs = [p for p in sym_prob if p > 0]
            if not possible_reels:
                break  # No more reels can host the symbol
            chosen_reel = random.choices(possible_reels, possible_probs)[0]
            chosen_stop = random.choice(reelstops[chosen_reel])
            sym_prob[chosen_reel] = 0
            force_stop_positions[int(chosen_reel)] = int(chosen_stop)

        force_stop_positions = dict(sorted(force_stop_positions.items(), key=lambda x: x[0]))
        self.force_board_from_reelstrips(reelstrip_id, force_stop_positions)

    def get_syms_on_reel(self, reel_id: str, target_symbol: str) -> List[List[int]]:
        """Return reelstop positions for a specific symbol name."""
        reel = self.config.reels[reel_id]
        reelstop_positions: List[List[int]] = [[] for _ in range(self.config.num_reels)]
        for r in range(self.config.num_reels):
            for s in range(len(reel[r])):
                if (
                    target_symbol in self.config.special_symbols
                    and reel[r][s] in self.config.special_symbols[target_symbol]
                ):
                    reelstop_positions[r].append(s)
                elif reel[r][s] == target_symbol:
                    reelstop_positions[r].append(s)

        return reelstop_positions

    def count_special_symbols(self, special_sym_criteria: str) -> int:
        "Returns integer number of active symbols of any 'special' kind."
        return len(self.special_syms_on_board.get(special_sym_criteria, []))

    def count_symbols_on_board(self, symbol_name: str) -> int:
        """Count number of sumbols on the board matching the target name."""
        symbol_count = 0
        for idx, _ in enumerate(self.board):
            for idy, _ in enumerate(self.board[idx]):
                if self.board[idx][idy].name.upper() == symbol_name.upper():
                    symbol_count += 1
        return symbol_count

    def assign_special_sym_function(self):
        """
        Load or initialize special symbol callbacks.
        If config exposes `symbol_behaviors` as a dict[str, Callable|list[Callable]],
        normalize and store them so `create_symbol` can apply them.
        """
        if not hasattr(self, "special_symbol_functions") or self.special_symbol_functions is None:
            self.special_symbol_functions = {}

        behaviors = getattr(self.config, "symbol_behaviors", None)
        if isinstance(behaviors, dict):
            normalized: Dict[str, List[Any]] = {}
            for name, funcs in behaviors.items():
                if funcs is None:
                    continue
                if isinstance(funcs, list):
                    normalized[name] = [f for f in funcs if callable(f)]
                elif callable(funcs):
                    normalized[name] = [funcs]
            for k, v in normalized.items():
                if k in self.special_symbol_functions:
                    existing = set(id(f) for f in self.special_symbol_functions[k])
                    self.special_symbol_functions[k].extend([f for f in v if id(f) not in existing])
                else:
                    self.special_symbol_functions[k] = v

        for special_type, names in getattr(self.config, "special_symbols", {}).items():
            for sym_name in names:
                self.special_symbol_functions.setdefault(sym_name, [])

    def run_spin(self, sim) -> None:
        """
        Execute a single base game spin.
        Stores a lightweight summary on `self.last_spin_result`.
        If `sim` exposes a callback `on_spin_complete(state, result)`, it is invoked.
        """
        self.assign_special_sym_function()

        original_type = getattr(self, "gametype", None)
        base_type = getattr(self.config, "basegame_type", original_type)
        self.gametype = base_type

        self.draw_board(emit_event=True)

        result = {
            "gametype": self.gametype,
            "reelstrip_id": getattr(self, "reelstrip_id", None),
            "reel_positions": getattr(self, "reel_positions", None),
            "padding_position": getattr(self, "padding_position", None),
            "anticipation": getattr(self, "anticipation", None),
            "special_syms": getattr(self, "special_syms_on_board", {}),
            "board_names": self.board_string(getattr(self, "board", [])),
        }

        # Preserve result without returning it to satisfy base signature
        self.last_spin_result = result

        cb = getattr(sim, "on_spin_complete", None)
        if callable(cb):
            try:
                cb(self, result)
            except Exception:
                pass

        if original_type is not None:
            self.gametype = original_type

        return None

    def run_freespin(self):
        """
        Execute a single free game spin using a configured free game type if present.
        Returns a lightweight summary similar to run_spin.
        """
        self.assign_special_sym_function()

        original_type = getattr(self, "gametype", None)
        candidate_attrs = ["freegame_type", "freespin_type", "freespins_type", "bonus_type"]
        free_type = None
        for attr in candidate_attrs:
            if hasattr(self.config, attr):
                free_type = getattr(self.config, attr)
                break
        if free_type is None:
            free_type = original_type

        self.gametype = free_type

        self.draw_board(emit_event=True)

        result = {
            "gametype": self.gametype,
            "reelstrip_id": getattr(self, "reelstrip_id", None),
            "reel_positions": getattr(self, "reel_positions", None),
            "padding_position": getattr(self, "padding_position", None),
            "anticipation": getattr(self, "anticipation", None),
            "special_syms": getattr(self, "special_syms_on_board", {}),
            "board_names": self.board_string(getattr(self, "board", [])),
        }
        # Store the result and restore gametype; return None for compatibility with base class
        self.last_spin_result = result

        if original_type is not None:
            self.gametype = original_type

        return None
