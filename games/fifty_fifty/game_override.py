from game_executables import GameExecutables
from src.calculations.statistics import get_random_outcome
from src.events.events import set_win_event, set_total_event


class GameStateOverride(GameExecutables):
    """Override/extend base state: assign W multipliers and route bonus triggers."""

    def reset_book(self):
        super().reset_book()
        self.current_bonus = None

    def assign_special_sym_function(self):
        self.special_symbol_functions = {"W": [self.assign_mult_property]}

    def assign_mult_property(self, symbol):
        mult_values = self.get_current_distribution_conditions().get("mult_values", {})
        if mult_values:
            symbol.assign_attribute({"multiplier": get_random_outcome(mult_values)})

    def check_bonus_triggers(self):
        """Detect PB/TR counts and set bonus intent."""
        pb = self.count_symbol_on_board("PB")
        tr = self.count_symbol_on_board("TR")

        if pb >= 4:
            self.current_bonus = "pokehunt"
            self.tot_fs = {4: 8, 5: 10, 6: 12}.get(pb, 15)
            return True

        if tr >= 5:
            self.current_bonus = "arena"
            self.tot_fs = 10
            return True

        return False

    def run_bonus_from_base(self):
        if self.current_bonus == "pokehunt":
            self.run_pokehunt(self.tot_fs)
        elif self.current_bonus == "arena":
            gym = get_random_outcome({"Brock": 1, "Misty": 1, "LtSurge": 1})
            self.run_battle_arena(gym=gym, turns=self.tot_fs)

        if self.win_manager.spin_win > 0:
            set_win_event(self)
        set_total_event(self)
        self.current_bonus = None
