import numpy as np
from numba import jit, njit, prange
import time
from typing import Dict, List, Tuple
import json

@njit(parallel=True)
def generate_board(reel_strips: List, rng_states) -> np.ndarray:
    """Generate a 7x7 game board using parallel random number generation"""
    board = np.empty((7, 7), dtype=np.int32)
    
    for i in prange(7):  # Parallel across reels
        reel = reel_strips[i]
        total_weight = reel.total_weight
        cumulative_weights = reel.cumulative_weights
        
        for j in range(7):  # Each position in the reel
            # Generate random number using the RNG state for this thread
            rand_val = xoroshiro128p_uniform_float64(rng_states, i * 7 + j) * total_weight
            
            # Find the symbol index using binary search
            idx = np.searchsorted(cumulative_weights, rand_val)
            board[j, i] = idx
    
    return board

@njit
def find_clusters(board: np.ndarray, symbol_mapping: Dict) -> List[Dict]:
    """Find all winning clusters using connected components algorithm"""
    clusters = []
    visited = np.zeros_like(board, dtype=np.bool_)
    rows, cols = board.shape
    
    for i in range(rows):
        for j in range(cols):
            if not visited[i, j]:
                current_symbol = board[i, j]
                if symbol_mapping[current_symbol]["is_wild"]:
                    continue  # Skip wilds for cluster detection
                
                cluster = []
                stack = [(i, j)]
                
                while stack:
                    x, y = stack.pop()
                    if (0 <= x < rows and 0 <= y < cols and not visited[x, y] 
                        and board[x, y] == current_symbol):
                        visited[x, y] = True
                        cluster.append((x, y))
                        
                        # Check all 4 directions
                        stack.append((x+1, y))
                        stack.append((x-1, y))
                        stack.append((x, y+1))
                        stack.append((x, y-1))
                
                if len(cluster) >= 5:  # Minimum cluster size
                    clusters.append({
                        "symbol": current_symbol,
                        "positions": cluster,
                        "size": len(cluster)
                    })
    
    return clusters

@njit
def calculate_cluster_payout(cluster: Dict, paytable: Dict, base_values: Dict) -> float:
    """Calculate payout for a cluster with non-linear scaling"""
    symbol = cluster["symbol"]
    size = cluster["size"]
    
    if symbol not in paytable:
        return 0.0
    
    # Get base payout from paytable
    base_payout = 0.0
    for min_size, payout in paytable[symbol].items():
        if size >= min_size:
            base_payout = payout
        else:
            break
    
    # Apply non-linear scaling for large clusters
    if size > 10:
        base_payout += (size - 10) * 1.5
    
    return base_payout

class SimulationEngine:
    def __init__(self, config: PocketMonGenesisReelsConfig):
        self.config = config
        self.rng_states = self._init_rng_states()
        
    def _init_rng_states(self):
        """Initialize parallel RNG states for each thread"""
        # Implementation of xoroshiro128+ RNG
        pass
    
    def run_monte_carlo_simulation(self, num_simulations: int, bet_amount: float):
        """Run massive Monte Carlo simulation to generate game data"""
        results = {
            "total_payout": 0.0,
            "total_bet": num_simulations * bet_amount,
            "win_distribution": np.zeros(10000),  # Track win sizes
            "feature_triggers": {
                "free_spins": 0,
                "evolution": 0,
                "bonus": 0
            }
        }
        
        for i in range(num_simulations):
            if i % 100000 == 0:
                print(f"Completed {i}/{num_simulations} simulations")
            
            outcome = self.simulate_spin(bet_amount)
            results["total_payout"] += outcome["total_win"]
            
            # Track win distribution
            win_size = min(int(outcome["total_win"] / bet_amount), 9999)
            results["win_distribution"][win_size] += 1
            
            # Track feature triggers
            for event in outcome["events"]:
                if event["type"] == "free_spins_triggered":
                    results["feature_triggers"]["free_spins"] += 1
                elif event["type"] == "evolution":
                    results["feature_triggers"]["evolution"] += 1
        
        # Calculate RTP
        results["rtp"] = results["total_payout"] / results["total_bet"]
        
        return results
    
    def simulate_spin(self, bet_amount: float) -> Dict:
        """Simulate a single spin with all game mechanics"""
        # Generate board
        board = generate_board(self.config.reel_strips, self.rng_states)
        
        # Find winning clusters
        clusters = find_clusters(board, self.config.symbols)
        
        # Process evolutions
        evolved_board, evolution_events = self.process_evolutions(board, clusters)
        
        # Process cascading reels
        final_board, cascade_events, total_win = self.process_cascades(
            evolved_board, clusters, bet_amount
        )
        
        # Check for bonus triggers
        bonus_events = self.check_bonus_triggers(final_board)
        
        return {
            "board": final_board,
            "total_win": total_win,
            "events": evolution_events + cascade_events + bonus_events
        }