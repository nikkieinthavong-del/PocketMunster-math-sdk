"""PocketMon Genesis Reels mathematical calculations and formulas."""

import math
from collections import defaultdict


class PokemonMathEngine:
    """Mathematical calculation engine for PocketMon Genesis Reels."""
    
    def __init__(self, config):
        self.config = config
        
    def calculate_cluster_probability(self, symbol, cluster_size, board_size=(7, 7)):
        """Calculate probability of getting a specific cluster size for a symbol."""
        if symbol not in self.config.pokemon_data:
            return 0.0
        
        # Get symbol frequency based on tier
        tier = self.config.pokemon_data[symbol]['tier']
        symbol_frequency = self.get_symbol_frequency(tier)
        
        # Total positions on board
        total_positions = board_size[0] * board_size[1]
        
        # Probability of symbol appearing at any position
        p_symbol = symbol_frequency
        
        # Calculate cluster formation probability using binomial approximation
        # This is a simplified model - actual cluster formation is more complex
        cluster_prob = self.binomial_probability(total_positions, cluster_size, p_symbol)
        
        # Adjust for connectivity requirements (clusters must be connected)
        connectivity_factor = self.get_connectivity_factor(cluster_size, board_size)
        
        return cluster_prob * connectivity_factor
    
    def get_symbol_frequency(self, tier):
        """Get symbol frequency based on tier (1=common, 6=legendary)."""
        # Frequency decreases exponentially with tier
        base_frequency = 0.15  # 15% for tier 1
        frequency = base_frequency * (0.6 ** (tier - 1))
        return max(frequency, 0.001)  # Minimum 0.1% for legendaries
    
    def get_connectivity_factor(self, cluster_size, board_size=(7, 7)):
        """Get connectivity adjustment factor for cluster formation."""
        max_possible = board_size[0] * board_size[1]
        
        if cluster_size <= 5:
            return 0.8  # Easier to form small clusters
        elif cluster_size <= 15:
            return 0.6  # Medium difficulty
        elif cluster_size <= 30:
            return 0.4  # Hard to form large clusters
        else:
            return 0.2  # Very hard to form massive clusters
    
    def binomial_probability(self, n, k, p):
        """Calculate binomial probability P(X = k) where X ~ Binomial(n, p)."""
        if k > n or k < 0:
            return 0.0
        
        # Use logarithms for large numbers to avoid overflow
        log_prob = (math.lgamma(n + 1) - math.lgamma(k + 1) - math.lgamma(n - k + 1) +
                   k * math.log(p) + (n - k) * math.log(1 - p))
        
        return math.exp(log_prob)
    
    def calculate_expected_win_per_spin(self):
        """Calculate expected win per spin across all symbols and clusters."""
        expected_win = 0.0
        
        for (cluster_range, symbol), payout in self.config.paytable.items():
            min_size, max_size = cluster_range
            
            # Calculate probability for this cluster size range
            for size in range(min_size, max_size + 1):
                prob = self.calculate_cluster_probability(symbol, size)
                expected_win += prob * payout
        
        # Add evolution multiplier expected value
        evolution_expected = self.calculate_evolution_expected_value()
        expected_win *= (1 + evolution_expected)
        
        # Add cascade multiplier expected value
        cascade_expected = self.calculate_cascade_expected_value()
        expected_win *= (1 + cascade_expected)
        
        # Add bonus features expected value
        bonus_expected = self.calculate_bonus_expected_value()
        expected_win += bonus_expected
        
        return expected_win
    
    def calculate_evolution_expected_value(self):
        """Calculate expected value contribution from evolution mechanics."""
        evolution_prob = 0.05  # Estimated 5% chance per cluster to evolve
        
        # Average evolution multiplier
        avg_multiplier = (self.config.evolution_multipliers['stage_1'] + 
                         self.config.evolution_multipliers['stage_2']) / 2
        
        # Expected value is probability * (multiplier - 1)
        return evolution_prob * (avg_multiplier - 1)
    
    def calculate_cascade_expected_value(self):
        """Calculate expected value from cascading system."""
        # Probability of getting cascades
        cascade_probs = [0.3, 0.15, 0.08, 0.04, 0.02, 0.01]  # Decreasing probability
        
        expected_cascade_mult = 1.0
        for i, prob in enumerate(cascade_probs):
            if i + 1 < len(self.config.cascade_multipliers):
                mult = self.config.cascade_multipliers[i + 1]
                expected_cascade_mult += prob * (mult - 1)
        
        return expected_cascade_mult - 1
    
    def calculate_bonus_expected_value(self):
        """Calculate expected value from bonus features."""
        expected_bonus = 0.0
        
        # Evolutionary Frenzy (free spins)
        fs_prob = 0.08  # 8% trigger rate
        fs_multiplier = 2.5  # Average multiplier during free spins
        fs_spins = 10  # Average free spins awarded
        expected_bonus += fs_prob * (fs_multiplier * fs_spins - fs_spins)
        
        # Catch 'Em All bonus
        catch_prob = 0.02  # 2% trigger rate
        catch_win = 15  # Average win multiplier
        expected_bonus += catch_prob * catch_win
        
        # Battle Arena bonus
        battle_prob = 0.005  # 0.5% trigger rate
        battle_win = 25  # Average win multiplier
        expected_bonus += battle_prob * battle_win
        
        return expected_bonus
    
    def calculate_volatility_metrics(self, win_data):
        """Calculate comprehensive volatility metrics."""
        if not win_data:
            return {}
        
        # Basic statistics
        mean_win = sum(win_data) / len(win_data)
        variance = sum((x - mean_win) ** 2 for x in win_data) / len(win_data)
        std_dev = math.sqrt(variance)
        
        # Volatility index
        volatility_index = std_dev / mean_win if mean_win > 0 else 0
        
        # Risk metrics
        win_frequency = len([x for x in win_data if x > 0]) / len(win_data)
        avg_win_when_winning = sum([x for x in win_data if x > 0]) / len([x for x in win_data if x > 0]) if any(x > 0 for x in win_data) else 0
        
        # Percentile analysis
        sorted_wins = sorted(win_data)
        n = len(sorted_wins)
        
        percentiles = {}
        for p in [50, 75, 90, 95, 99, 99.9]:
            index = int(n * p / 100)
            percentiles[f'p{p}'] = sorted_wins[min(index, n - 1)]
        
        return {
            'mean': mean_win,
            'std_dev': std_dev,
            'variance': variance,
            'volatility_index': volatility_index,
            'win_frequency': win_frequency,
            'avg_win_when_winning': avg_win_when_winning,
            'max_win': max(win_data),
            'min_win': min(win_data),
            'percentiles': percentiles
        }
    
    def calculate_feature_trigger_rates(self):
        """Calculate theoretical trigger rates for all bonus features."""
        
        # Evolution Frenzy (3+ Evolution Stones)
        stone_frequency = 0.04  # 4% frequency for evolution stones
        evo_frenzy_prob = self.calculate_scatter_probability(stone_frequency, 3, 49)
        
        # Catch 'Em All (3+ Master Balls)
        master_ball_frequency = 0.015  # 1.5% frequency for master balls
        catch_em_all_prob = self.calculate_scatter_probability(master_ball_frequency, 3, 49)
        
        # Battle Arena (random after legendary wins)
        legendary_win_prob = self.calculate_legendary_win_probability()
        battle_arena_prob = legendary_win_prob * self.config.battle_arena_trigger_chance
        
        return {
            'evolutionary_frenzy': evo_frenzy_prob,
            'catch_em_all': catch_em_all_prob,
            'battle_arena': battle_arena_prob,
            'legendary_win': legendary_win_prob
        }
    
    def calculate_scatter_probability(self, symbol_frequency, min_count, total_positions):
        """Calculate probability of getting min_count or more of a scatter symbol."""
        prob = 0.0
        
        for k in range(min_count, total_positions + 1):
            prob += self.binomial_probability(total_positions, k, symbol_frequency)
        
        return prob
    
    def calculate_legendary_win_probability(self):
        """Calculate probability of getting a winning cluster with legendary Pokemon."""
        legendary_prob = 0.0
        
        for pokemon, data in self.config.pokemon_data.items():
            if data.get('tier') == 6:  # Legendary tier
                # Probability of 5+ cluster (minimum win)
                for size in range(5, 50):  # Up to maximum board size
                    cluster_prob = self.calculate_cluster_probability(pokemon, size)
                    legendary_prob += cluster_prob
        
        return legendary_prob
    
    def analyze_symbol_contribution(self, symbol):
        """Analyze the RTP contribution of a specific symbol."""
        if symbol not in self.config.pokemon_data:
            return {}
        
        total_contribution = 0.0
        size_contributions = {}
        
        for (cluster_range, sym), payout in self.config.paytable.items():
            if sym == symbol:
                min_size, max_size = cluster_range
                
                range_contribution = 0.0
                for size in range(min_size, max_size + 1):
                    prob = self.calculate_cluster_probability(symbol, size)
                    contribution = prob * payout
                    range_contribution += contribution
                    total_contribution += contribution
                
                size_contributions[f'{min_size}-{max_size}'] = range_contribution
        
        return {
            'symbol': symbol,
            'tier': self.config.pokemon_data[symbol].get('tier'),
            'total_rtp_contribution': total_contribution * 100,  # As percentage
            'size_contributions': size_contributions,
            'frequency': self.get_symbol_frequency(self.config.pokemon_data[symbol].get('tier', 1))
        }
    
    def optimize_paytable_for_target_rtp(self, target_rtp=96.52):
        """Optimize paytable to achieve target RTP."""
        current_expected = self.calculate_expected_win_per_spin()
        target_expected = target_rtp / 100
        
        scaling_factor = target_expected / current_expected if current_expected > 0 else 1
        
        optimized_paytable = {}
        
        for key, payout in self.config.paytable.items():
            optimized_paytable[key] = payout * scaling_factor
        
        return {
            'original_expected_rtp': current_expected * 100,
            'target_rtp': target_rtp,
            'scaling_factor': scaling_factor,
            'optimized_paytable': optimized_paytable
        }
    
    def calculate_max_exposure(self):
        """Calculate theoretical maximum exposure (worst case scenario)."""
        # Maximum possible cluster (entire board of highest paying symbol)
        max_cluster_size = 49  # 7x7 board
        
        # Find highest paying legendary Pokemon
        max_payout = 0
        max_symbol = None
        
        for (cluster_range, symbol), payout in self.config.paytable.items():
            if (symbol in self.config.pokemon_data and 
                self.config.pokemon_data[symbol].get('tier') == 6):
                if payout > max_payout:
                    max_payout = payout
                    max_symbol = symbol
        
        if max_symbol is None:
            return 0
        
        # Apply maximum evolution multiplier
        max_evolution_mult = self.config.evolution_multipliers['stage_2']
        
        # Apply maximum cascade multiplier
        max_cascade_mult = max(self.config.cascade_multipliers)
        
        # Theoretical maximum win
        theoretical_max = max_payout * max_evolution_mult * max_cascade_mult
        
        # Check against win cap
        actual_max = min(theoretical_max, self.config.wincap)
        
        return {
            'theoretical_max': theoretical_max,
            'actual_max': actual_max,
            'symbol': max_symbol,
            'cluster_size': max_cluster_size,
            'evolution_multiplier': max_evolution_mult,
            'cascade_multiplier': max_cascade_mult,
            'win_cap': self.config.wincap
        }


def generate_mathematical_report(config):
    """Generate comprehensive mathematical analysis report."""
    math_engine = PokemonMathEngine(config)
    
    report = {
        'game_overview': {
            'name': config.working_name,
            'grid_size': f'{config.num_reels}x{max(config.num_rows)}',
            'total_pokemon': len(config.pokemon_data),
            'target_rtp': config.rtp * 100,
            'max_win': config.wincap
        },
        
        'expected_values': {
            'win_per_spin': math_engine.calculate_expected_win_per_spin(),
            'evolution_contribution': math_engine.calculate_evolution_expected_value(),
            'cascade_contribution': math_engine.calculate_cascade_expected_value(),
            'bonus_contribution': math_engine.calculate_bonus_expected_value()
        },
        
        'feature_probabilities': math_engine.calculate_feature_trigger_rates(),
        
        'max_exposure': math_engine.calculate_max_exposure(),
        
        'symbol_analysis': {},
        
        'optimization': math_engine.optimize_paytable_for_target_rtp()
    }
    
    # Analyze each Pokemon's contribution
    for pokemon in list(config.pokemon_data.keys())[:10]:  # Sample analysis
        report['symbol_analysis'][pokemon] = math_engine.analyze_symbol_contribution(pokemon)
    
    return report