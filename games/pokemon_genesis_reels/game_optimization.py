"""PocketMon Genesis Reels optimization setup for RTP and feature tuning."""

from base_classes import OptimizationBase
from game_calculations import PokemonMathEngine


class OptimizationSetup(OptimizationBase):
    """Optimization setup for PocketMon Genesis Reels."""
    
    def __init__(self, config):
        super().__init__(config)
        self.math_engine = PokemonMathEngine(config)
        self.optimization_targets = {
            'rtp': 96.52,
            'volatility_index': 8.5,  # High volatility target
            'hit_frequency': 0.35,    # 35% hit frequency
            'max_win_probability': 0.0002,  # 0.02% chance for max win
            'feature_frequencies': {
                'evolutionary_frenzy': 0.08,
                'catch_em_all': 0.02,
                'battle_arena': 0.005
            }
        }
    
    def get_optimization_parameters(self):
        """Define parameters that can be optimized."""
        return {
            'symbol_frequencies': {
                'description': 'Frequency of each Pokemon tier on reels',
                'parameters': {
                    'tier_1_frequency': {'min': 0.10, 'max': 0.25, 'current': 0.15},
                    'tier_2_frequency': {'min': 0.08, 'max': 0.20, 'current': 0.12},
                    'tier_3_frequency': {'min': 0.06, 'max': 0.15, 'current': 0.09},
                    'tier_4_frequency': {'min': 0.04, 'max': 0.12, 'current': 0.06},
                    'tier_5_frequency': {'min': 0.02, 'max': 0.08, 'current': 0.04},
                    'tier_6_frequency': {'min': 0.005, 'max': 0.03, 'current': 0.01}
                }
            },
            
            'evolution_multipliers': {
                'description': 'Multipliers for Pokemon evolutions',
                'parameters': {
                    'stage_1_multiplier': {'min': 1.5, 'max': 4.0, 'current': 2.5},
                    'stage_2_multiplier': {'min': 2.5, 'max': 6.0, 'current': 4.0}
                }
            },
            
            'cascade_multipliers': {
                'description': 'Multipliers for cascade levels',
                'parameters': {
                    'cascade_2': {'min': 1.5, 'max': 3.0, 'current': 2.0},
                    'cascade_3': {'min': 2.0, 'max': 4.0, 'current': 3.0},
                    'cascade_4': {'min': 3.0, 'max': 6.0, 'current': 5.0},
                    'cascade_5': {'min': 4.0, 'max': 10.0, 'current': 8.0},
                    'cascade_6': {'min': 6.0, 'max': 15.0, 'current': 12.0},
                    'cascade_max': {'min': 8.0, 'max': 20.0, 'current': 15.0}
                }
            },
            
            'special_symbol_frequencies': {
                'description': 'Frequencies of special symbols',
                'parameters': {
                    'wild_frequency': {'min': 0.01, 'max': 0.05, 'current': 0.02},
                    'scatter_frequency': {'min': 0.005, 'max': 0.025, 'current': 0.015},
                    'evolution_stone_frequency': {'min': 0.02, 'max': 0.08, 'current': 0.04}
                }
            },
            
            'bonus_parameters': {
                'description': 'Bonus feature parameters',
                'parameters': {
                    'battle_arena_trigger_chance': {'min': 0.05, 'max': 0.25, 'current': 0.1},
                    'auto_evolution_chance_fs': {'min': 0.2, 'max': 0.5, 'current': 0.3},
                    'catch_em_all_multiplier': {'min': 5.0, 'max': 30.0, 'current': 15.0}
                }
            }
        }
    
    def evaluate_configuration(self, parameters):
        """Evaluate a configuration and return fitness scores."""
        # Apply parameters to temporary config
        temp_config = self.apply_parameters_to_config(parameters)
        
        # Calculate metrics
        metrics = self.calculate_configuration_metrics(temp_config)
        
        # Calculate fitness score
        fitness_score = self.calculate_fitness_score(metrics)
        
        return {
            'fitness_score': fitness_score,
            'metrics': metrics,
            'rtp_variance': abs(metrics['rtp'] - self.optimization_targets['rtp']),
            'volatility_variance': abs(metrics['volatility'] - self.optimization_targets['volatility_index']),
            'hit_frequency_variance': abs(metrics['hit_frequency'] - self.optimization_targets['hit_frequency'])
        }
    
    def apply_parameters_to_config(self, parameters):
        """Apply optimization parameters to create a modified config."""
        import copy
        temp_config = copy.deepcopy(self.config)
        
        # Update evolution multipliers
        if 'stage_1_multiplier' in parameters:
            temp_config.evolution_multipliers['stage_1'] = parameters['stage_1_multiplier']
        if 'stage_2_multiplier' in parameters:
            temp_config.evolution_multipliers['stage_2'] = parameters['stage_2_multiplier']
        
        # Update cascade multipliers
        cascade_updates = {
            'cascade_2': 1,
            'cascade_3': 2,
            'cascade_4': 3,
            'cascade_5': 4,
            'cascade_6': 5,
            'cascade_max': 6
        }
        
        for param, index in cascade_updates.items():
            if param in parameters and index < len(temp_config.cascade_multipliers):
                temp_config.cascade_multipliers[index] = parameters[param]
        
        # Update battle arena trigger chance
        if 'battle_arena_trigger_chance' in parameters:
            temp_config.battle_arena_trigger_chance = parameters['battle_arena_trigger_chance']
        
        return temp_config
    
    def calculate_configuration_metrics(self, config):
        """Calculate key metrics for a configuration."""
        math_engine = PokemonMathEngine(config)
        
        # Calculate theoretical values
        expected_win = math_engine.calculate_expected_win_per_spin()
        rtp = expected_win * 100
        
        # Estimate volatility (simplified)
        volatility = self.estimate_volatility(config)
        
        # Calculate feature probabilities
        feature_rates = math_engine.calculate_feature_trigger_rates()
        
        # Estimate hit frequency
        hit_frequency = self.estimate_hit_frequency(config)
        
        # Calculate max exposure
        max_exposure = math_engine.calculate_max_exposure()
        
        return {
            'rtp': rtp,
            'expected_win_per_spin': expected_win,
            'volatility': volatility,
            'hit_frequency': hit_frequency,
            'feature_rates': feature_rates,
            'max_exposure': max_exposure['actual_max'],
            'theoretical_max': max_exposure['theoretical_max']
        }
    
    def estimate_volatility(self, config):
        """Estimate volatility index based on configuration."""
        # Simplified volatility estimation based on:
        # - Payout variance
        # - Evolution multiplier variance  
        # - Cascade multiplier variance
        # - Feature frequency variance
        
        base_volatility = 2.0
        
        # Evolution multiplier impact
        evolution_impact = (config.evolution_multipliers['stage_2'] - 1) * 0.5
        
        # Cascade multiplier impact
        max_cascade = max(config.cascade_multipliers) if config.cascade_multipliers else 1
        cascade_impact = (max_cascade - 1) * 0.3
        
        # Feature rarity impact (rarer features = higher volatility)
        feature_impact = 0
        if hasattr(config, 'battle_arena_trigger_chance'):
            feature_impact += (0.2 - config.battle_arena_trigger_chance) * 10
        
        total_volatility = base_volatility + evolution_impact + cascade_impact + feature_impact
        
        return max(total_volatility, 1.0)
    
    def estimate_hit_frequency(self, config):
        """Estimate hit frequency based on symbol frequencies and cluster requirements."""
        # Simplified estimation
        # Higher tier frequencies = more hits
        
        base_hit_freq = 0.25  # 25% base
        
        # Tier 1-3 Pokemon contribute most to hit frequency
        tier_contribution = 0
        for pokemon, data in config.pokemon_data.items():
            tier = data.get('tier', 1)
            if tier <= 3:
                frequency = self.math_engine.get_symbol_frequency(tier)
                tier_contribution += frequency * 0.1
        
        # Wild symbol contribution
        wild_contribution = 0.02  # Wilds increase hit frequency
        
        estimated_hit_freq = min(base_hit_freq + tier_contribution + wild_contribution, 0.6)
        
        return estimated_hit_freq
    
    def calculate_fitness_score(self, metrics):
        """Calculate fitness score based on how close metrics are to targets."""
        fitness = 0.0
        
        # RTP fitness (most important)
        rtp_variance = abs(metrics['rtp'] - self.optimization_targets['rtp'])
        rtp_fitness = max(0, 100 - rtp_variance * 10)  # Heavy penalty for RTP variance
        fitness += rtp_fitness * 0.4
        
        # Volatility fitness
        volatility_variance = abs(metrics['volatility'] - self.optimization_targets['volatility_index'])
        volatility_fitness = max(0, 100 - volatility_variance * 5)
        fitness += volatility_fitness * 0.2
        
        # Hit frequency fitness
        hit_freq_variance = abs(metrics['hit_frequency'] - self.optimization_targets['hit_frequency'])
        hit_freq_fitness = max(0, 100 - hit_freq_variance * 100)
        fitness += hit_freq_fitness * 0.2
        
        # Feature frequency fitness
        feature_fitness = 0
        target_features = self.optimization_targets['feature_frequencies']
        
        for feature, target_rate in target_features.items():
            actual_rate = metrics['feature_rates'].get(feature, 0)
            variance = abs(actual_rate - target_rate)
            feature_fitness += max(0, 10 - variance * 1000)  # Scale for small probabilities
        
        fitness += feature_fitness * 0.1
        
        # Max win constraint (must not exceed win cap)
        if metrics['max_exposure'] > self.config.wincap:
            fitness *= 0.5  # Heavy penalty for exceeding win cap
        
        # Bonus: reward configurations that achieve multiple targets
        targets_met = 0
        if rtp_variance < 0.1:
            targets_met += 1
        if volatility_variance < 0.5:
            targets_met += 1
        if hit_freq_variance < 0.05:
            targets_met += 1
        
        bonus = targets_met * 5
        fitness += bonus * 0.1
        
        return max(fitness, 0)
    
    def generate_optimization_report(self, best_parameters, best_metrics):
        """Generate optimization report."""
        report = {
            'optimization_summary': {
                'target_rtp': self.optimization_targets['rtp'],
                'achieved_rtp': best_metrics['rtp'],
                'rtp_variance': abs(best_metrics['rtp'] - self.optimization_targets['rtp']),
                'target_volatility': self.optimization_targets['volatility_index'],
                'achieved_volatility': best_metrics['volatility'],
                'fitness_score': best_metrics.get('fitness_score', 0)
            },
            
            'optimized_parameters': best_parameters,
            
            'performance_metrics': best_metrics,
            
            'recommendations': self.generate_optimization_recommendations(best_parameters, best_metrics)
        }
        
        return report
    
    def generate_optimization_recommendations(self, parameters, metrics):
        """Generate recommendations based on optimization results."""
        recommendations = []
        
        # RTP recommendations
        rtp_variance = abs(metrics['rtp'] - self.optimization_targets['rtp'])
        if rtp_variance > 0.2:
            if metrics['rtp'] < self.optimization_targets['rtp']:
                recommendations.append("Increase payout multipliers or symbol frequencies to raise RTP")
            else:
                recommendations.append("Decrease payout multipliers or reduce high-paying symbol frequencies")
        
        # Volatility recommendations
        volatility_variance = abs(metrics['volatility'] - self.optimization_targets['volatility_index'])
        if volatility_variance > 1.0:
            if metrics['volatility'] < self.optimization_targets['volatility_index']:
                recommendations.append("Increase evolution multipliers or cascade multipliers to raise volatility")
            else:
                recommendations.append("Reduce multiplier variance to lower volatility")
        
        # Hit frequency recommendations
        hit_freq_variance = abs(metrics['hit_frequency'] - self.optimization_targets['hit_frequency'])
        if hit_freq_variance > 0.1:
            if metrics['hit_frequency'] < self.optimization_targets['hit_frequency']:
                recommendations.append("Increase common Pokemon frequencies or add more wilds")
            else:
                recommendations.append("Reduce symbol frequencies or increase minimum cluster size")
        
        # Feature balance recommendations
        feature_rates = metrics.get('feature_rates', {})
        for feature, target_rate in self.optimization_targets['feature_frequencies'].items():
            actual_rate = feature_rates.get(feature, 0)
            if abs(actual_rate - target_rate) > target_rate * 0.2:  # 20% variance threshold
                if actual_rate < target_rate:
                    recommendations.append(f"Increase trigger probability for {feature} feature")
                else:
                    recommendations.append(f"Decrease trigger probability for {feature} feature")
        
        if not recommendations:
            recommendations.append("Configuration is well-balanced and meets optimization targets")
        
        return recommendations
    
    def run_optimization_cycle(self, num_iterations=1000):
        """Run a complete optimization cycle."""
        print(f"Starting optimization cycle with {num_iterations} iterations...")
        
        best_score = 0
        best_parameters = {}
        best_metrics = {}
        
        optimization_params = self.get_optimization_parameters()
        
        for iteration in range(num_iterations):
            # Generate random parameter set
            random_params = self.generate_random_parameters(optimization_params)
            
            # Evaluate configuration
            evaluation = self.evaluate_configuration(random_params)
            
            # Check if this is the best so far
            if evaluation['fitness_score'] > best_score:
                best_score = evaluation['fitness_score']
                best_parameters = random_params.copy()
                best_metrics = evaluation['metrics'].copy()
                best_metrics['fitness_score'] = best_score
            
            # Progress reporting
            if iteration % 100 == 0 and iteration > 0:
                print(f"Iteration {iteration}/{num_iterations} - Best score: {best_score:.2f}")
        
        # Generate final report
        optimization_report = self.generate_optimization_report(best_parameters, best_metrics)
        
        print(f"Optimization complete. Best fitness score: {best_score:.2f}")
        print(f"Best RTP: {best_metrics.get('rtp', 0):.4f}%")
        
        return optimization_report
    
    def generate_random_parameters(self, param_structure):
        """Generate random parameters within defined bounds."""
        import random
        
        random_params = {}
        
        for category, category_data in param_structure.items():
            for param_name, param_info in category_data['parameters'].items():
                min_val = param_info['min']
                max_val = param_info['max']
                random_val = random.uniform(min_val, max_val)
                random_params[param_name] = random_val
        
        return random_params