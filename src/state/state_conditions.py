from src.state.state import GeneralGameState


class Conditions(GeneralGameState):
    """queries current gamestate"""

    def in_criteria(self, *args):
        """check is current criteria is within a given list"""
        for arg in args:
            if self.criteria == arg:
                return True
        return False

    def in_mode(self, *args):
        """check if current bet-mode mates a given list"""
        for arg in args:
            if self.betmode == arg:
                return True
        return False

    def is_wincap(self):
        """checks if current basegame + freegame wins are >= max-win"""
        if self.win_manager.running_bet_win >= self.config.wincap:
            return True
        return False

    def is_in_gametype(self, *args):
        """check current gametype against possible list"""
        for arg in args:
            if self.gametype == arg:
                return True
        return False

    def get_wincap_triggered(self) -> bool:
        """Break out of spin progress if max-win is triggered."""
        if self.wincap_triggered:
            return True
        return False
