from src.state.state_conditions import Conditions
from src.calculations.tumble import Tumble
from src.events.events import (
    win_info_event,
    freespin_end_event,
    tumble_board_event,
    update_tumble_win_event,
    wincap_event,
    fs_trigger_event,
    update_freespin_event,
    final_win_event,
    update_global_mult_event,
)


class Executables(Conditions, Tumble):
    """
    The purpose of this Class is to group together common actions which are likely to be reused between games.
    These can be overridden in the GameExecutables or GameCalculations if game-specific alterations are required.
    Generally Executables functions do not return values.
    """

    def tumble_game_board(self):
        "Remove winning symbols from active board and replace."
        self.tumble_board()
        tumble_board_event(self)

    def emit_tumble_win_events(self) -> None:
        """Transmit win and new board information upon tumble."""
        if self.win_data["totalWin"] > 0:
            win_info_event(self)
            update_tumble_win_event(self)
            self.evaluate_wincap()

    def evaluate_wincap(self) -> bool:
        """Indicate spin functions should stop once wincap is reached."""
        if self.win_manager.running_bet_win >= self.config.wincap and not (self.wincap_triggered):
            self.wincap_triggered = True
            wincap_event(self)
            return True
        return False

    def check_fs_condition(self, scatter_key: str = "scatter") -> bool:
        """Check if there are enough active scatters to trigger fs."""
        if self.count_special_symbols(scatter_key) >= min(
            self.config.freespin_triggers[self.gametype].keys()
        ) and not (self.repeat):
            return True
        return False

    def check_freespin_entry(self, scatter_key: str = "scatter") -> bool:
        """Ensure that betmode criteria is expecting freespin trigger."""
        if self.get_current_distribution_conditions()["force_freegame"] and len(
            self.special_syms_on_board[scatter_key]
        ) >= min(self.config.freespin_triggers[self.gametype].keys()):
            return True
        self.repeat = True
        return False

    def run_freespin_from_base(self, scatter_key: str = "scatter") -> None:
        """Trigger the freespin function and update total fs amount."""
        self.record(
            {
                "kind": self.count_special_symbols(scatter_key),
                "symbol": scatter_key,
                "gametype": self.gametype,
            }
        )
        self.update_freespin_amount()
        self.run_freespin()

    def update_freespin_amount(self, scatter_key: str = "scatter") -> None:
        """Set initial number of spins for a freegame and transmit event."""
        self.tot_fs = self.config.freespin_triggers[self.gametype][self.count_special_symbols(scatter_key)]
        if self.gametype == self.config.basegame_type:
            basegame_trigger, freegame_trigger = True, False
        else:
            basegame_trigger, freegame_trigger = False, True
        fs_trigger_event(self, basegame_trigger=basegame_trigger, freegame_trigger=freegame_trigger)

    def update_fs_retrigger_amt(self, scatter_key: str = "scatter") -> None:
        """Update total freespin amount on retrigger."""
        self.tot_fs += self.config.freespin_triggers[self.gametype][self.count_special_symbols(scatter_key)]
        fs_trigger_event(self, freegame_trigger=True, basegame_trigger=False)

    def update_freespin(self) -> None:
        """Called before a new reveal during freegame."""
        update_freespin_event(self)
        self.fs += 1
        self.win_manager.reset_spin_win()
        self.win_data = {}

    def end_freespin(self) -> None:
        """Transmit total amount awarded during freegame."""
        freespin_end_event(self)

    def evaluate_finalwin(self) -> None:
        """Check base and freespin sums, set payout multiplier."""
        self.update_final_win()
        final_win_event(self)

    def update_global_mult(self) -> None:
        """Increment multiplier value and emit corresponding event."""
        self.global_multiplier += 1
        update_global_mult_event(self)
