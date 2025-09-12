"""Handles the state and output for a single simulation round"""

from game_override import GameStateOverride


class GameState(GameStateOverride):
    """Run one spin per mode; cluster mode supports tumbling + evolution + bonus triggers."""

    def run_spin(self, sim):
        self.reset_seed(sim)
        self.repeat = True
        while self.repeat:
            self.reset_book()
            self.draw_board()

            if self.betmode == "ways":
                self.evaluate_ways_board()
                self.win_manager.update_gametype_wins(self.gametype)

            elif self.betmode == "scatter":
                self.evaluate_scatter_board()
                while self.win_data["totalWin"] > 0 and not self.wincap_triggered:
                    self.tumble_game_board()
                    self.evaluate_scatter_board()
                self.win_manager.update_gametype_wins(self.gametype)

            elif self.betmode == "cluster":
                self.evaluate_cluster_board()
                if self.win_data["totalWin"] > 0 and self.has_egg_adjacent_to_wins():
                    self.perform_evolution_chain(max_steps=3)

                while self.win_data["totalWin"] > 0 and not self.wincap_triggered:
                    self.tumble_game_board()
                    self.evaluate_cluster_board()
                    if self.win_data["totalWin"] > 0 and self.has_egg_adjacent_to_wins():
                        self.perform_evolution_chain(max_steps=3)

                if self.check_bonus_triggers():
                    self.run_bonus_from_base()

                self.win_manager.update_gametype_wins(self.gametype)

            self.evaluate_finalwin()
            self.check_repeat()

        self.imprint_wins()

    def run_freespin(self):
        self.reset_fs_spin()
        self.end_freespin()
