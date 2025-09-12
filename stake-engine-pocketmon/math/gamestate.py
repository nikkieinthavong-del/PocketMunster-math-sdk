"""PocketMon Genesis Reels game state and simulation logic"""

from game_override import GameStateOverride


class GameState(GameStateOverride):
    """Handle all PocketMon game-logic and event updates for a given simulation number."""

    def run_spin(self, sim):
        """Execute a single base game spin simulation"""
        self.reset_seed(sim)
        self.repeat = True
        
        while self.repeat:
            self.reset_book()
            
            # Draw the game board (5x3 PocketMon symbols)
            self.pocketmon_board = self.executables.draw_board(
                self.reels[self.config.basegame_type], 
                self.config.num_reels, 
                self.config.num_rows
            )
            
            # Check for Ditto wild substitutions
            self.executables.apply_wild_substitutions(self.pocketmon_board, "ditto")
            
            # Evaluate ways wins with PocketMon symbols
            self.executables.ways_wins(
                self.pocketmon_board, 
                self.config.paytable, 
                self.config.num_reels,
                self.config.num_rows
            )
            
            # Check for scatter triggers (Pokeballs)
            scatter_count = self.executables.count_scatters(self.pocketmon_board, "pokeball")
            if scatter_count >= 3:
                self.trigger_pocketmon_freespins(scatter_count)
            
            # Check for Master Ball multipliers
            self.executables.apply_master_ball_multipliers(self.pocketmon_board)
            
            self.evaluate_finalwin()

        self.imprint_wins()

    def run_freespin(self):
        """Execute PocketMon free spin feature"""
        self.reset_fs_spin()
        
        while self.fs < self.tot_fs:
            # Use enhanced free spin reels with higher value PocketMon
            self.pocketmon_freespin_board = self.executables.draw_board(
                self.reels[self.config.freegame_type],
                self.config.num_reels,
                self.config.num_rows
            )
            
            # Apply enhanced Ditto wilds in free spins
            self.executables.apply_enhanced_wild_substitutions(
                self.pocketmon_freespin_board, "ditto"
            )
            
            # Evaluate wins with potential retriggers
            self.executables.ways_wins(
                self.pocketmon_freespin_board,
                self.config.paytable,
                self.config.num_reels,
                self.config.num_rows
            )
            
            # Check for retrigger
            retrigger_count = self.executables.count_scatters(
                self.pocketmon_freespin_board, "pokeball"
            )
            if retrigger_count >= 3:
                self.add_pocketmon_retrigger_spins(retrigger_count)
            
            self.update_freespin()

        self.end_freespin()
    
    def trigger_pocketmon_freespins(self, scatter_count):
        """Trigger PocketMon themed free spins based on Pokeball count"""
        if scatter_count == 3:
            self.tot_fs = 10  # 10 free spins for 3 Pokeballs
        elif scatter_count == 4:
            self.tot_fs = 15  # 15 free spins for 4 Pokeballs  
        elif scatter_count >= 5:
            self.tot_fs = 20  # 20 free spins for 5+ Pokeballs
            
    def add_pocketmon_retrigger_spins(self, retrigger_count):
        """Add additional free spins when retriggered"""
        if retrigger_count == 3:
            self.tot_fs += 5   # +5 spins for retrigger
        elif retrigger_count == 4:
            self.tot_fs += 10  # +10 spins for retrigger
        elif retrigger_count >= 5:
            self.tot_fs += 15  # +15 spins for retrigger
