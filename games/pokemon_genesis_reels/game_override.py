"""PocketMon Genesis Reels game state override for base functionality."""

from base_classes import GameStateBase
import random


class GameStateOverride(GameStateBase):
    """Override base game state functionality for PocketMon Genesis Reels."""

    def __init__(self, config):
        super().__init__(config)
        # Initialize 7x7 board
        self.board_width = 7
        self.board_height = 7
        self.board = [[None for _ in range(self.board_width)] for _ in range(self.board_height)]
    
    def draw_board(self):
        """Draw a new 7x7 board based on current reel configuration."""
        reel_set = self.get_current_reel_set()
        
        for col in range(self.board_width):
            # Get the reel for this column
            reel = self.get_reel_for_column(col, reel_set)
            
            for row in range(self.board_height):
                # Random selection from the reel (simplified - full implementation would use proper weighted selection)
                if reel and len(reel) > 0:
                    symbol = random.choice(reel)
                    self.board[row][col] = symbol
                else:
                    # Fallback to basic Pokemon if reel not available
                    self.board[row][col] = self.get_random_pokemon()
    
    def get_current_reel_set(self):
        """Get the current reel set based on game state."""
        if self.gametype == self.config.freegame_type:
            return "FR0"  # Free game reels
        else:
            return "BR0"  # Base game reels
    
    def get_reel_for_column(self, col, reel_set):
        """Get the reel configuration for a specific column."""
        if reel_set in self.config.reels:
            return self.config.reels[reel_set]
        
        # Fallback: create basic reel with Pokemon distribution
        return self.create_basic_reel()
    
    def create_basic_reel(self):
        """Create a basic reel with Pokemon symbols if reels not configured."""
        basic_reel = []
        
        # Add Pokemon based on their tiers (higher tier = lower frequency)
        for pokemon, data in self.config.pokemon_data.items():
            tier = data.get("tier", 1)
            frequency = max(1, 7 - tier)  # Tier 1 = 6 copies, Tier 6 = 1 copy
            basic_reel.extend([pokemon] * frequency)
        
        # Add special symbols
        basic_reel.extend(["Professor_Oak"] * 2)  # Wild
        basic_reel.extend(["Master_Ball"] * 1)    # Scatter
        
        # Add evolution stones
        evolution_stones = self.config.special_symbols.get("evolution_stones", [])
        for stone in evolution_stones:
            basic_reel.extend([stone] * 3)
        
        return basic_reel
    
    def get_random_pokemon(self):
        """Get a random Pokemon weighted by tier."""
        pokemon_list = []
        for pokemon, data in self.config.pokemon_data.items():
            tier = data.get("tier", 1)
            weight = max(1, 7 - tier)
            pokemon_list.extend([pokemon] * weight)
        
        return random.choice(pokemon_list) if pokemon_list else "Pikachu"
    
    def get_clusters_update_wins(self):
        """Find clusters and calculate wins."""
        if not hasattr(self, 'board') or not self.board:
            return
        
        self.win_data = {
            "totalWin": 0,
            "baseWin": 0,
            "bonusWin": 0,
            "clusterWins": []
        }
        
        visited = set()
        
        for row in range(len(self.board)):
            for col in range(len(self.board[row])):
                if (row, col) not in visited:
                    cluster = self.find_winning_cluster(row, col, visited)
                    
                    if cluster and len(cluster) >= 5:  # Minimum cluster size
                        cluster_win = self.calculate_cluster_win(cluster)
                        if cluster_win > 0:
                            self.win_data["clusterWins"].append({
                                "cluster": cluster,
                                "symbol": self.board[row][col],
                                "size": len(cluster),
                                "win": cluster_win
                            })
                            self.win_data["baseWin"] += cluster_win
        
        self.win_data["totalWin"] = self.win_data["baseWin"] + self.win_data["bonusWin"]
        
        # Apply cascade multiplier
        if hasattr(self, 'current_multiplier') and self.current_multiplier > 1:
            self.win_data["baseWin"] *= self.current_multiplier
            self.win_data["totalWin"] = self.win_data["baseWin"] + self.win_data["bonusWin"]
    
    def find_winning_cluster(self, start_row, start_col, visited):
        """Find a winning cluster starting from a position."""
        if (start_row, start_col) in visited:
            return []
        
        if (start_row < 0 or start_row >= len(self.board) or
            start_col < 0 or start_col >= len(self.board[start_row])):
            return []
        
        symbol = self.board[start_row][start_col]
        if not symbol:
            return []
        
        # Skip evolution stones and scatters for cluster formation
        if (symbol in self.config.special_symbols.get("evolution_stones", []) or
            symbol in self.config.special_symbols.get("scatter", [])):
            visited.add((start_row, start_col))
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
            
            # Check if symbols match for clustering
            if not self.can_form_cluster_with(symbol, current_symbol):
                continue
            
            visited.add((row, col))
            cluster.append((row, col))
            
            # Add adjacent positions (4-way connectivity)
            directions = [(0, 1), (0, -1), (1, 0), (-1, 0)]
            for dr, dc in directions:
                new_row, new_col = row + dr, col + dc
                stack.append((new_row, new_col))
        
        return cluster
    
    def can_form_cluster_with(self, symbol1, symbol2):
        """Check if two symbols can form a cluster together."""
        if symbol1 == symbol2:
            return True
        
        # Wild (Professor Oak) can substitute for Pokemon
        wild_symbols = self.config.special_symbols.get("wild", [])
        
        if symbol1 in wild_symbols and symbol2 in self.config.pokemon_data:
            return True
        if symbol2 in wild_symbols and symbol1 in self.config.pokemon_data:
            return True
        
        return False
    
    def calculate_cluster_win(self, cluster):
        """Calculate the win amount for a cluster."""
        if not cluster:
            return 0
        
        cluster_size = len(cluster)
        row, col = cluster[0]
        symbol = self.board[row][col]
        
        # Handle wild substitution - get the actual Pokemon symbol
        if symbol in self.config.special_symbols.get("wild", []):
            # Find a non-wild symbol in the cluster
            for r, c in cluster:
                cluster_symbol = self.board[r][c]
                if cluster_symbol not in self.config.special_symbols.get("wild", []):
                    symbol = cluster_symbol
                    break
        
        if symbol not in self.config.pokemon_data:
            return 0
        
        # Get base payout from paytable
        base_payout = self.get_symbol_payout(symbol, cluster_size)
        
        # Apply evolution multiplier if symbol was evolved
        evolution_multiplier = 1.0
        for pos in cluster:
            if pos in getattr(self, 'evolved_symbols', {}):
                evolution_data = self.evolved_symbols[pos]
                evolution_multiplier = max(evolution_multiplier, evolution_data.get('multiplier', 1.0))
        
        total_win = base_payout * evolution_multiplier
        
        return total_win
    
    def get_symbol_payout(self, symbol, cluster_size):
        """Get the payout for a symbol and cluster size."""
        # Find the appropriate payout range in the paytable
        for (size_range, sym), payout in self.config.paytable.items():
            if sym == symbol:
                min_size, max_size = size_range
                if min_size <= cluster_size <= max_size:
                    return payout
        
        return 0.0
    
    def tumble_game_board(self):
        """Remove winning symbols and apply gravity."""
        if not hasattr(self, 'win_data') or not self.win_data.get("clusterWins"):
            return
        
        # Mark winning positions for removal
        positions_to_remove = set()
        for cluster_win in self.win_data["clusterWins"]:
            for pos in cluster_win["cluster"]:
                positions_to_remove.add(pos)
        
        # Remove winning symbols (set to None)
        for row, col in positions_to_remove:
            self.board[row][col] = None
        
        # Apply gravity - symbols fall down
        for col in range(self.board_width):
            # Collect non-None symbols from bottom to top
            column_symbols = []
            for row in range(self.board_height - 1, -1, -1):
                if self.board[row][col] is not None:
                    column_symbols.append(self.board[row][col])
            
            # Clear the column
            for row in range(self.board_height):
                self.board[row][col] = None
            
            # Place symbols at bottom
            for i, symbol in enumerate(column_symbols):
                if self.board_height - 1 - i >= 0:
                    self.board[self.board_height - 1 - i][col] = symbol
            
            # Fill empty spaces with new symbols
            reel = self.get_reel_for_column(col, self.get_current_reel_set())
            for row in range(self.board_height):
                if self.board[row][col] is None:
                    if reel and len(reel) > 0:
                        self.board[row][col] = random.choice(reel)
                    else:
                        self.board[row][col] = self.get_random_pokemon()
    
    def emit_tumble_win_events(self):
        """Emit events for tumble wins."""
        if hasattr(self, 'win_data') and self.win_data.get("clusterWins"):
            # Add any Pokemon from winning clusters to Pokédex
            for cluster_win in self.win_data["clusterWins"]:
                symbol = cluster_win["symbol"]
                if symbol in self.config.pokemon_data:
                    if hasattr(self, 'pokédex_caught'):
                        self.pokédex_caught.add(symbol)
    
    def check_fs_condition(self):
        """Check if free spin conditions are met (Evolution Stones)."""
        evolution_stones = self.config.special_symbols.get("evolution_stones", [])
        stone_count = 0
        
        for row in self.board:
            for symbol in row:
                if symbol in evolution_stones:
                    stone_count += 1
        
        # Check if stone count meets trigger requirements
        triggers = self.config.freespin_triggers.get(self.gametype, {})
        return stone_count in triggers
    
    def check_freespin_entry(self):
        """Determine if free spins should be awarded."""
        evolution_stones = self.config.special_symbols.get("evolution_stones", [])
        stone_count = 0
        
        for row in self.board:
            for symbol in row:
                if symbol in evolution_stones:
                    stone_count += 1
        
        triggers = self.config.freespin_triggers.get(self.gametype, {})
        if stone_count in triggers:
            self.tot_fs = triggers[stone_count]
            return True
        
        return False
    
    def set_end_tumble_event(self):
        """Set event when tumbling ends."""
        pass  # Placeholder for event system
    
    def reset_book(self):
        """Reset book keeping variables for new spin."""
        self.win_data = {
            "totalWin": 0,
            "baseWin": 0,
            "bonusWin": 0,
            "clusterWins": []
        }
    
    def update_grid_mults(self):
        """Update grid multipliers (used in free spins)."""
        # Enhanced multipliers in Evolutionary Frenzy
        if self.gametype == self.config.freegame_type:
            if hasattr(self, 'current_multiplier'):
                self.current_multiplier = min(self.current_multiplier * 1.5, 25)  # Cap at 25x in free spins