"""Base classes for PocketMon Genesis Reels (simplified for standalone operation)."""

import os
import csv
import random


class ConfigBase:
    """Base configuration class."""
    
    def __init__(self):
        self.basegame_type = "basegame"
        self.freegame_type = "freegame"
        self.gametype = self.basegame_type
        
    def construct_paths(self):
        """Construct file paths for game assets."""
        self.game_path = os.path.dirname(os.path.abspath(__file__))
        self.reels_path = os.path.join(self.game_path, "reels")
        self.data_path = os.path.join(self.game_path, "data")
        
        # Create directories if they don't exist
        os.makedirs(self.reels_path, exist_ok=True)
        os.makedirs(self.data_path, exist_ok=True)
    
    def read_reels_csv(self, filepath):
        """Read reel configuration from CSV file."""
        reel_data = []
        try:
            with open(filepath, 'r', newline='') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    symbol = row.get('Symbol', '').strip()
                    if symbol:
                        reel_data.append(symbol)
        except FileNotFoundError:
            print(f"Warning: Reel file not found: {filepath}")
        except Exception as e:
            print(f"Error reading reel file {filepath}: {e}")
        
        return reel_data
    
    def convert_range_table(self, pay_group):
        """Convert range-based paytable to standard format."""
        return pay_group


class GameStateBase:
    """Base game state class."""
    
    def __init__(self, config):
        self.config = config
        self.gametype = config.basegame_type
        self.bet_amount = 1.0
        self.fs = 0  # Current free spin
        self.tot_fs = 0  # Total free spins
        self.wincap_triggered = False
        self.repeat = False
        
        # Win tracking
        self.win_data = {
            "totalWin": 0,
            "baseWin": 0,
            "bonusWin": 0,
            "clusterWins": []
        }
        
        # Win manager mock
        self.win_manager = WinManagerMock()
    
    def reset_seed(self, seed):
        """Reset random seed for simulation."""
        random.seed(seed)
    
    def run_freespin_from_base(self):
        """Transition to free spin mode."""
        self.gametype = self.config.freegame_type
        self.run_freespin()
        self.gametype = self.config.basegame_type
    
    def reset_fs_spin(self):
        """Reset free spin counters."""
        self.fs = 0
    
    def update_freespin(self):
        """Update free spin counter."""
        self.fs += 1
    
    def update_freespin_state(self):
        """Update free spin state after each spin."""
        pass
    
    def add_freespin(self):
        """Check if additional free spins should be added."""
        return False
    
    def evaluate_finalwin(self):
        """Evaluate final win amounts."""
        if self.win_data["totalWin"] >= self.config.wincap:
            self.wincap_triggered = True
            self.win_data["totalWin"] = self.config.wincap
    
    def check_repeat(self):
        """Check if spin should repeat."""
        self.repeat = False
    
    def imprint_wins(self):
        """Imprint final wins."""
        pass


class WinManagerMock:
    """Mock win manager for tracking wins."""
    
    def update_gametype_wins(self, gametype):
        """Update wins for game type."""
        pass


class BetMode:
    """Bet mode configuration."""
    
    def __init__(self, name, cost, rtp, max_win, auto_close_disabled=False, 
                 is_feature=True, is_buybonus=False, distributions=None):
        self.name = name
        self.cost = cost
        self.rtp = rtp
        self.max_win = max_win
        self.auto_close_disabled = auto_close_disabled
        self.is_feature = is_feature
        self.is_buybonus = is_buybonus
        self.distributions = distributions or []


class Distribution:
    """Distribution configuration for bet modes."""
    
    def __init__(self, criteria, quota, win_criteria=None, conditions=None):
        self.criteria = criteria
        self.quota = quota
        self.win_criteria = win_criteria
        self.conditions = conditions or {}


class OptimizationBase:
    """Base optimization class."""
    
    def __init__(self, config):
        self.config = config