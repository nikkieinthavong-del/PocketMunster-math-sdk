from game_calculations import GameCalculations
from src.calculations.ways import Ways
from src.calculations.scatter import Scatter
from src.calculations.cluster import Cluster


class GameExecutables(GameCalculations):

    def evaluate_ways_board(self):
        self.win_data = Ways.get_ways_data(self.config, self.board, global_multiplier=self.global_multiplier)
        Ways.record_ways_wins(self)
        self.win_manager.update_spinwin(self.win_data["totalWin"])
        Ways.emit_wayswin_events(self)

    def evaluate_scatter_board(self):
        self.win_data = Scatter.get_scatterpay_wins(self.config, self.board, global_multiplier=self.global_multiplier)
        Scatter.record_scatter_wins(self)
        self.win_manager.tumble_win = self.win_data["totalWin"]
        self.win_manager.update_spinwin(self.win_data["totalWin"])
        self.emit_tumble_win_events()

    def evaluate_cluster_board(self):
        self.win_data = Cluster.get_cluster_data(self.config, self.board, global_multiplier=self.global_multiplier)
        Cluster.record_cluster_wins(self)
        self.win_manager.tumble_win = self.win_data["totalWin"]
        self.win_manager.update_spinwin(self.win_data["totalWin"])
        self.emit_tumble_win_events()
