"""PocketMon Genesis Reels core game state and simulation logic."""

from game_override import GameStateOverride
from game_events import (
    update_grid_mult_event, 
    evolution_event,
    cascade_event,
    bonus_trigger_event
)
import random
import copy


class GameState(GameStateOverride):
    """Core function handling PocketMon Genesis Reels simulation results."""

    def __init__(self, config):
        super().__init__(config)
        self.cascade_level = 0
        self.current_multiplier = 1
        self.evolved_symbols = {}  # Track evolved symbols and their positions
        self.pokédex_caught = set()  # Persistent Pokédex tracking
        self.battle_arena_active = False
        self.catch_em_all_active = False
        
    def run_spin(self, sim):
        """Execute a single spin of the game."""
        self.reset_seed(sim)
        self.repeat = True
        
        while self.repeat:
            # Reset simulation variables and draw a new 7x7 board
            self.reset_book()
            self.cascade_level = 0
            self.current_multiplier = 1
            self.evolved_symbols = {}
            
            self.draw_board()
            
            # Check for evolution opportunities before cluster evaluation
            self.check_and_apply_evolutions()
            
            # Get initial clusters and wins
            self.get_clusters_update_wins()
            self.emit_tumble_win_events()
            
            # Cascading system - continue until no more wins
            while self.win_data["totalWin"] > 0 and not self.wincap_triggered:
                self.cascade_level += 1
                self.update_cascade_multiplier()
                
                # Remove winning symbols and apply gravity
                self.tumble_game_board()
                
                # Check for new evolutions after cascade
                self.check_and_apply_evolutions()
                
                # Evaluate new clusters
                self.get_clusters_update_wins()
                self.emit_tumble_win_events()
            
            self.set_end_tumble_event()
            self.win_manager.update_gametype_wins(self.gametype)
            
            # Check for bonus triggers
            self.check_bonus_triggers()
            
            # Check for free spins (Evolution Frenzy)
            if self.check_fs_condition() and self.check_freespin_entry():
                self.run_freespin_from_base()
            
            self.evaluate_finalwin()
            self.check_repeat()
        
        self.imprint_wins()
    
    def run_freespin(self):
        """Execute free spin rounds (Evolutionary Frenzy bonus)."""
        self.reset_fs_spin()
        
        while self.fs < self.tot_fs:
            self.update_freespin()
            self.cascade_level = 0
            self.current_multiplier = 1
            self.evolved_symbols = {}
            
            self.draw_board()
            update_grid_mult_event(self)
            
            # In Evolutionary Frenzy, apply automatic evolutions
            self.apply_automatic_evolutions()
            
            self.get_clusters_update_wins()
            self.emit_tumble_win_events()
            self.update_grid_mults()
            
            # Cascading with enhanced multipliers in free spins
            while self.win_data["totalWin"] > 0 and not self.wincap_triggered:
                self.cascade_level += 1
                self.update_cascade_multiplier()
                
                self.tumble_game_board()
                self.apply_automatic_evolutions()  # More evolution chances
                self.get_clusters_update_wins()
                self.emit_tumble_win_events()
                self.update_grid_mults()
            
            # Check for additional free spins
            if self.check_fs_condition() and self.add_freespin():
                pass  # Additional spins added
            
            self.update_freespin_state()
    
    def check_and_apply_evolutions(self):
        """Check for evolution stone adjacency and apply evolutions."""
        if not hasattr(self, 'board') or not self.board:
            return
            
        evolutions_applied = []
        
        # Get all winning clusters first
        clusters = self.get_current_clusters()
        
        for cluster in clusters:
            if not cluster:
                continue
                
            # Get the symbol type of this cluster
            cluster_symbol = self.get_cluster_symbol(cluster)
            if not cluster_symbol or cluster_symbol in self.config.special_symbols.get("evolution_stones", []):
                continue
            
            # Check for adjacent evolution stones
            adjacent_stones = self.find_adjacent_evolution_stones(cluster)
            
            for stone_type in adjacent_stones:
                if self.config.can_evolve_with_stone(cluster_symbol, stone_type):
                    evolved_form = self.get_evolved_form(cluster_symbol)
                    if evolved_form:
                        # Apply evolution to the entire cluster
                        evolution_multiplier = self.get_evolution_multiplier(cluster_symbol, evolved_form)
                        evolutions_applied.append({
                            'cluster': cluster,
                            'from': cluster_symbol,
                            'to': evolved_form,
                            'multiplier': evolution_multiplier,
                            'stone': stone_type
                        })
                        
                        # Update board with evolved symbols
                        for pos in cluster:
                            self.board[pos[0]][pos[1]] = evolved_form
                            self.evolved_symbols[pos] = {
                                'original': cluster_symbol,
                                'evolved': evolved_form,
                                'multiplier': evolution_multiplier
                            }
                        
                        # Add to Pokédex
                        self.pokédex_caught.add(evolved_form)
                        break  # Only one evolution per cluster per cascade
        
        # Emit evolution events
        if evolutions_applied:
            evolution_event(self, evolutions_applied)
    
    def apply_automatic_evolutions(self):
        """Apply automatic evolutions during Evolutionary Frenzy free spins."""
        if not hasattr(self, 'board') or not self.board:
            return
        
        evolution_chance = 0.3  # 30% chance per symbol to auto-evolve in free spins
        
        for row in range(len(self.board)):
            for col in range(len(self.board[row])):
                symbol = self.board[row][col]
                
                if (symbol in self.config.pokemon_data and 
                    random.random() < evolution_chance):
                    
                    evolved_form = self.get_evolved_form(symbol)
                    if evolved_form:
                        evolution_multiplier = self.get_evolution_multiplier(symbol, evolved_form)
                        
                        self.board[row][col] = evolved_form
                        self.evolved_symbols[(row, col)] = {
                            'original': symbol,
                            'evolved': evolved_form,
                            'multiplier': evolution_multiplier
                        }
                        self.pokédex_caught.add(evolved_form)
    
    def get_current_clusters(self):
        """Get all current winning clusters using connected components algorithm."""
        if not hasattr(self, 'board') or not self.board:
            return []
            
        visited = set()
        clusters = []
        
        for row in range(len(self.board)):
            for col in range(len(self.board[row])):
                if (row, col) not in visited:
                    cluster = self.find_cluster(row, col, visited)
                    if len(cluster) >= 5:  # Minimum cluster size
                        clusters.append(cluster)
        
        return clusters
    
    def find_cluster(self, start_row, start_col, visited):
        """Find connected cluster using depth-first search."""
        if not self.board or start_row < 0 or start_row >= len(self.board):
            return []
        if start_col < 0 or start_col >= len(self.board[start_row]):
            return []
        if (start_row, start_col) in visited:
            return []
            
        symbol = self.board[start_row][start_col]
        if not symbol or symbol in self.config.special_symbols.get("evolution_stones", []):
            return []
        
        cluster = []
        stack = [(start_row, start_col)]
        
        while stack:
            row, col = stack.pop()
            
            if ((row, col) in visited or 
                row < 0 or row >= len(self.board) or
                col < 0 or col >= len(self.board[row])):
                continue
                
            current_symbol = self.board[row][col]
            
            # Check if symbols match (including wild substitution)
            if not self.symbols_match(symbol, current_symbol):
                continue
            
            visited.add((row, col))
            cluster.append((row, col))
            
            # Add adjacent positions (4-way connectivity)
            directions = [(0, 1), (0, -1), (1, 0), (-1, 0)]
            for dr, dc in directions:
                new_row, new_col = row + dr, col + dc
                if (new_row, new_col) not in visited:
                    stack.append((new_row, new_col))
        
        return cluster
    
    def symbols_match(self, symbol1, symbol2):
        """Check if two symbols match for cluster formation (including wilds)."""
        if symbol1 == symbol2:
            return True
        
        # Professor Oak (wild) substitutes for any Pokemon
        wild_symbols = self.config.special_symbols.get("wild", [])
        if symbol1 in wild_symbols or symbol2 in wild_symbols:
            # Make sure at least one is a Pokemon (not evolution stone or scatter)
            if (symbol1 in self.config.pokemon_data or 
                symbol2 in self.config.pokemon_data):
                return True
        
        return False
    
    def find_adjacent_evolution_stones(self, cluster):
        """Find evolution stones adjacent to a cluster."""
        adjacent_stones = set()
        evolution_stones = self.config.special_symbols.get("evolution_stones", [])
        
        # Check all positions adjacent to cluster positions
        for row, col in cluster:
            directions = [(0, 1), (0, -1), (1, 0), (-1, 0), 
                         (1, 1), (1, -1), (-1, 1), (-1, -1)]  # 8-way adjacency
            
            for dr, dc in directions:
                adj_row, adj_col = row + dr, col + dc
                
                if (0 <= adj_row < len(self.board) and 
                    0 <= adj_col < len(self.board[adj_row])):
                    
                    adjacent_symbol = self.board[adj_row][adj_col]
                    if adjacent_symbol in evolution_stones:
                        adjacent_stones.add(adjacent_symbol)
        
        return list(adjacent_stones)
    
    def get_evolved_form(self, pokemon_name):
        """Get the evolved form of a Pokemon."""
        if pokemon_name not in self.config.pokemon_data:
            return None
        
        return self.config.pokemon_data[pokemon_name].get("evolves_to")
    
    def get_evolution_multiplier(self, original, evolved):
        """Get the evolution multiplier based on evolution stage."""
        if (original not in self.config.pokemon_data or 
            evolved not in self.config.pokemon_data):
            return 1.0
        
        original_stage = self.config.pokemon_data[original].get("evolution_stage", 0)
        evolved_stage = self.config.pokemon_data[evolved].get("evolution_stage", 0)
        
        if evolved_stage > original_stage:
            if evolved_stage == 1:
                return self.config.evolution_multipliers["stage_1"]
            elif evolved_stage == 2:
                return self.config.evolution_multipliers["stage_2"]
        
        return 1.0
    
    def update_cascade_multiplier(self):
        """Update the cascade multiplier based on cascade level."""
        if self.cascade_level < len(self.config.cascade_multipliers):
            self.current_multiplier = self.config.cascade_multipliers[self.cascade_level]
        else:
            self.current_multiplier = self.config.cascade_multipliers[-1]  # Cap at maximum
        
        cascade_event(self, self.cascade_level, self.current_multiplier)
    
    def check_bonus_triggers(self):
        """Check for bonus feature triggers."""
        # Count Master Balls for Catch 'Em All bonus
        master_ball_count = self.count_symbol_on_board("Master_Ball")
        if master_ball_count >= 3:
            self.trigger_catch_em_all_bonus(master_ball_count)
        
        # Check for Battle Arena trigger after legendary wins
        if self.has_legendary_cluster_win() and random.random() < self.config.battle_arena_trigger_chance:
            self.trigger_battle_arena_bonus()
    
    def count_symbol_on_board(self, symbol):
        """Count occurrences of a symbol on the board."""
        if not hasattr(self, 'board') or not self.board:
            return 0
        
        count = 0
        for row in self.board:
            for cell in row:
                if cell == symbol:
                    count += 1
        return count
    
    def has_legendary_cluster_win(self):
        """Check if there was a winning cluster containing legendary Pokemon."""
        clusters = self.get_current_clusters()
        
        for cluster in clusters:
            cluster_symbol = self.get_cluster_symbol(cluster)
            if (cluster_symbol in self.config.pokemon_data and
                self.config.pokemon_data[cluster_symbol].get("tier") == 6):
                return True
        
        return False
    
    def get_cluster_symbol(self, cluster):
        """Get the symbol type for a cluster."""
        if not cluster or not hasattr(self, 'board'):
            return None
        
        row, col = cluster[0]
        return self.board[row][col]
    
    def trigger_catch_em_all_bonus(self, master_ball_count):
        """Trigger the Catch 'Em All bonus game."""
        self.catch_em_all_active = True
        bonus_multiplier = master_ball_count * 2  # More Master Balls = better bonus
        
        # Simplified bonus - in full implementation would have interactive mechanics
        bonus_win = self.bet_amount * bonus_multiplier * random.uniform(5, 25)
        self.win_data["bonusWin"] += bonus_win
        
        bonus_trigger_event(self, "catch_em_all", {
            "master_balls": master_ball_count,
            "bonus_win": bonus_win,
            "multiplier": bonus_multiplier
        })
        
        self.catch_em_all_active = False
    
    def trigger_battle_arena_bonus(self):
        """Trigger the Battle Arena bonus game."""
        self.battle_arena_active = True
        
        # Simplified battle system - in full implementation would be turn-based
        gym_leaders = ["Brock", "Misty", "Lt_Surge", "Erika", "Koga", "Sabrina", "Blaine", "Giovanni"]
        opponent = random.choice(gym_leaders)
        
        # Battle outcome based on Pokédex completion
        completion_rate = len(self.pokédex_caught) / 151
        win_chance = 0.3 + (completion_rate * 0.4)  # 30-70% based on Pokédex
        
        if random.random() < win_chance:
            battle_win = self.bet_amount * random.uniform(10, 50)
            self.win_data["bonusWin"] += battle_win
            result = "victory"
        else:
            battle_win = self.bet_amount * random.uniform(2, 10)
            self.win_data["bonusWin"] += battle_win
            result = "defeat"
        
        bonus_trigger_event(self, "battle_arena", {
            "opponent": opponent,
            "result": result,
            "battle_win": battle_win,
            "pokédex_completion": completion_rate
        })
        
        self.battle_arena_active = False
    
    def get_pokédex_stats(self):
        """Get current Pokédex statistics."""
        total_pokemon = len(self.config.pokemon_data)
        caught_pokemon = len(self.pokédex_caught)
        completion_rate = caught_pokemon / total_pokemon if total_pokemon > 0 else 0
        
        return {
            "total": total_pokemon,
            "caught": caught_pokemon,
            "completion_rate": completion_rate,
            "caught_list": list(self.pokédex_caught)
        }