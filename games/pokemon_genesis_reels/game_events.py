"""PocketMon Genesis Reels game events for tracking evolutions, cascades, and bonuses."""


def update_grid_mult_event(game_state):
    """Event for updating grid multipliers."""
    if hasattr(game_state, 'event_data'):
        game_state.event_data.append({
            "type": "grid_multiplier_update",
            "multiplier": getattr(game_state, 'current_multiplier', 1),
            "cascade_level": getattr(game_state, 'cascade_level', 0)
        })


def evolution_event(game_state, evolutions_applied):
    """Event for Pokemon evolutions."""
    if hasattr(game_state, 'event_data'):
        game_state.event_data.append({
            "type": "pokemon_evolution",
            "evolutions": evolutions_applied,
            "timestamp": game_state.get_current_timestamp() if hasattr(game_state, 'get_current_timestamp') else None
        })
    
    # Log evolution statistics
    for evolution in evolutions_applied:
        print(f"Evolution: {evolution['from']} -> {evolution['to']} "
              f"(x{evolution['multiplier']}) using {evolution['stone']}")


def cascade_event(game_state, cascade_level, multiplier):
    """Event for cascade tumbles."""
    if hasattr(game_state, 'event_data'):
        game_state.event_data.append({
            "type": "cascade_tumble",
            "cascade_level": cascade_level,
            "multiplier": multiplier,
            "board_state": get_board_snapshot(game_state)
        })


def bonus_trigger_event(game_state, bonus_type, bonus_data):
    """Event for bonus feature triggers."""
    if hasattr(game_state, 'event_data'):
        game_state.event_data.append({
            "type": "bonus_triggered",
            "bonus_type": bonus_type,
            "data": bonus_data,
            "pokédex_stats": game_state.get_pokédex_stats() if hasattr(game_state, 'get_pokédex_stats') else {}
        })
    
    # Log bonus triggers
    if bonus_type == "catch_em_all":
        print(f"Catch 'Em All Bonus triggered with {bonus_data.get('master_balls', 0)} Master Balls!")
        print(f"Bonus win: {bonus_data.get('bonus_win', 0)}")
    elif bonus_type == "battle_arena":
        print(f"Battle Arena vs {bonus_data.get('opponent', 'Unknown')} - "
              f"Result: {bonus_data.get('result', 'Unknown')}")
        print(f"Battle win: {bonus_data.get('battle_win', 0)}")


def pokédex_update_event(game_state, caught_pokemon):
    """Event for Pokédex updates."""
    if hasattr(game_state, 'event_data'):
        game_state.event_data.append({
            "type": "pokédex_update",
            "caught_pokemon": caught_pokemon,
            "total_caught": len(getattr(game_state, 'pokédex_caught', set())),
            "completion_rate": len(getattr(game_state, 'pokédex_caught', set())) / 151
        })


def cluster_win_event(game_state, cluster_data):
    """Event for cluster wins."""
    if hasattr(game_state, 'event_data'):
        game_state.event_data.append({
            "type": "cluster_win",
            "clusters": cluster_data,
            "total_win": game_state.win_data.get("totalWin", 0) if hasattr(game_state, 'win_data') else 0
        })


def free_spin_trigger_event(game_state, stone_count, free_spins_awarded):
    """Event for Evolutionary Frenzy free spin triggers."""
    if hasattr(game_state, 'event_data'):
        game_state.event_data.append({
            "type": "evolutionary_frenzy_trigger",
            "evolution_stones": stone_count,
            "free_spins": free_spins_awarded,
            "board_state": get_board_snapshot(game_state)
        })
    
    print(f"Evolutionary Frenzy triggered! {stone_count} Evolution Stones found!")
    print(f"Awarded {free_spins_awarded} free spins with automatic evolutions!")


def wincap_event(game_state, total_win):
    """Event for win cap reached."""
    if hasattr(game_state, 'event_data'):
        game_state.event_data.append({
            "type": "wincap_reached",
            "total_win": total_win,
            "win_cap": game_state.config.wincap if hasattr(game_state, 'config') else 0
        })
    
    print(f"MASSIVE WIN! Win cap reached: {total_win}")


def get_board_snapshot(game_state):
    """Get a snapshot of the current board state."""
    if not hasattr(game_state, 'board') or not game_state.board:
        return []
    
    return [[cell for cell in row] for row in game_state.board]


def rtp_validation_event(simulation_results):
    """Event for RTP validation results."""
    print("=== RTP Validation Results ===")
    print(f"Target RTP: 96.52%")
    print(f"Achieved RTP: {simulation_results.get('rtp', 0):.4f}%")
    print(f"Total Spins: {simulation_results.get('total_spins', 0):,}")
    print(f"Total Win: {simulation_results.get('total_win', 0):,.2f}")
    print(f"Total Bet: {simulation_results.get('total_bet', 0):,.2f}")
    print(f"Hit Frequency: {simulation_results.get('hit_frequency', 0):.4f}%")
    print(f"Volatility Index: {simulation_results.get('volatility', 'Unknown')}")
    print("==============================")


def mathematical_analysis_event(analysis_results):
    """Event for mathematical analysis completion."""
    print("=== Mathematical Analysis Complete ===")
    
    feature_frequencies = analysis_results.get('feature_frequencies', {})
    print("Feature Trigger Frequencies:")
    for feature, frequency in feature_frequencies.items():
        print(f"  {feature}: {frequency:.6f} ({1/frequency:.0f}:1)" if frequency > 0 else f"  {feature}: 0.000000 (Never)")
    
    max_win_probability = analysis_results.get('max_win_probability', 0)
    print(f"Max Win (50,000x) Probability: {max_win_probability:.10f} ({1/max_win_probability:.0f}:1)" if max_win_probability > 0 else "Max Win Probability: Never observed")
    
    pokédex_stats = analysis_results.get('pokédex_stats', {})
    if pokédex_stats:
        print(f"Average Pokédex Completion: {pokédex_stats.get('average_completion', 0):.2f}%")
        print(f"Max Pokédex Completion: {pokédex_stats.get('max_completion', 0):.2f}%")
    
    print("=====================================")


def performance_benchmark_event(benchmark_results):
    """Event for performance benchmark results."""
    print("=== Performance Benchmark ===")
    print(f"Spins per second: {benchmark_results.get('spins_per_second', 0):,.0f}")
    print(f"Memory usage: {benchmark_results.get('memory_usage_mb', 0):.1f} MB")
    print(f"Cluster detection time: {benchmark_results.get('cluster_time_ms', 0):.2f} ms")
    print(f"Evolution processing time: {benchmark_results.get('evolution_time_ms', 0):.2f} ms")
    print("=============================")