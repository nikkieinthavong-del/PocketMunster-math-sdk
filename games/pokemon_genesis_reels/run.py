"""Main execution script for PocketMon Genesis Reels game."""

from gamestate import GameState
from game_config import GameConfig
from game_optimization import OptimizationSetup
from game_executables import (
    PokemonSimulationEngine, 
    generate_par_sheet, 
    validate_rtp_compliance
)
from game_calculations import generate_mathematical_report
import time
import json
import os


def main():
    """Main execution function for PocketMon Genesis Reels."""
    
    print("=" * 60)
    print("🎮 POCKETMON GENESIS REELS - Comprehensive Slot Game 🎮")
    print("=" * 60)
    print("Featuring all 151 Generation I PocketMon with evolution mechanics,")
    print("7x7 cluster-pay system, cascading reels, and multiple bonus features!")
    print("=" * 60)
    
    # Configuration settings
    num_threads = 10
    rust_threads = 20
    batching_size = 50000
    compression = False  # Disabled for debugging
    profiling = False
    
    # Simulation parameters
    num_sim_args = {
        "base": int(5e4),     # 50K base game simulations
        "bonus": int(2e4),    # 20K bonus simulations
        "rtp_validation": int(1e6),  # 1M spins for RTP validation
        "performance": int(1e4),     # 10K for performance testing
    }
    
    # Execution conditions
    run_conditions = {
        "run_mathematical_analysis": True,
        "run_simulations": True,
        "run_rtp_validation": True,
        "run_optimization": True,
        "run_performance_benchmark": True,
        "run_par_sheet_generation": True,
        "run_format_checks": False,  # Skip for now due to dependency issues
    }
    
    target_modes = ["base", "bonus"]
    
    # Initialize game configuration and state
    print("🔧 Initializing game configuration...")
    config = GameConfig()
    gamestate = GameState(config)
    
    # Initialize optimization setup
    if run_conditions["run_optimization"]:
        print("🎯 Initializing optimization setup...")
        optimization_setup = OptimizationSetup(config)
    
    # Initialize simulation engine
    simulation_engine = PokemonSimulationEngine(config, GameState)
    
    print(f"✅ Game initialized: {config.working_name}")
    print(f"📊 Grid: {config.num_reels}x{max(config.num_rows)}")
    print(f"🎯 Target RTP: {config.rtp * 100:.2f}%")
    print(f"💰 Max Win: {config.wincap:,}x bet")
    print(f"🔢 Total Pokemon: {len(config.pokemon_data)}")
    print()
    
    # 1. Mathematical Analysis
    if run_conditions["run_mathematical_analysis"]:
        print("📐 Running mathematical analysis...")
        start_time = time.time()
        
        mathematical_report = generate_mathematical_report(config)
        
        analysis_time = time.time() - start_time
        print(f"✅ Mathematical analysis completed in {analysis_time:.2f} seconds")
        
        # Display key insights
        print("\n📊 Key Mathematical Insights:")
        print(f"   • Expected win per spin: {mathematical_report['expected_values']['win_per_spin']:.6f}")
        print(f"   • Evolution contribution: {mathematical_report['expected_values']['evolution_contribution']:.4f}")
        print(f"   • Cascade contribution: {mathematical_report['expected_values']['cascade_contribution']:.4f}")
        print(f"   • Bonus contribution: {mathematical_report['expected_values']['bonus_contribution']:.4f}")
        print(f"   • Theoretical max win: {mathematical_report['max_exposure']['theoretical_max']:.2f}x")
        print()
        
        # Save mathematical report
        save_report(mathematical_report, "mathematical_analysis_report.json")
    
    # 2. Base Simulations
    if run_conditions["run_simulations"]:
        print("🎲 Running base simulations...")
        start_time = time.time()
        
        # Run smaller simulation for initial testing
        base_results = simulation_engine.run_monte_carlo_simulation(num_sim_args["base"])
        
        simulation_time = time.time() - start_time
        print(f"✅ Base simulation completed in {simulation_time:.2f} seconds")
        print(f"   • Achieved RTP: {base_results['rtp']:.4f}%")
        print(f"   • Hit frequency: {base_results['hit_frequency']:.2f}%")
        print(f"   • Max win observed: {base_results['max_win']:.2f}x")
        print()
        
        save_report(base_results, "base_simulation_results.json")
    
    # 3. RTP Validation
    if run_conditions["run_rtp_validation"]:
        print("🎯 Running comprehensive RTP validation...")
        start_time = time.time()
        
        rtp_results = simulation_engine.run_monte_carlo_simulation(num_sim_args["rtp_validation"])
        
        validation_time = time.time() - start_time
        print(f"✅ RTP validation completed in {validation_time:.2f} seconds")
        
        # Validate RTP compliance
        compliance_result = validate_rtp_compliance(rtp_results, config.rtp * 100, 0.1)
        
        if compliance_result['compliant']:
            print("🎉 RTP VALIDATION PASSED! ✅")
        else:
            print("⚠️  RTP VALIDATION FAILED! ❌")
            print("   Optimization may be required.")
        
        print()
        save_report(rtp_results, "rtp_validation_results.json")
        save_report(compliance_result, "rtp_compliance_report.json")
    
    # 4. Performance Benchmark
    if run_conditions["run_performance_benchmark"]:
        print("⚡ Running performance benchmark...")
        start_time = time.time()
        
        benchmark_results = simulation_engine.run_performance_benchmark(num_sim_args["performance"])
        
        benchmark_time = time.time() - start_time
        print(f"✅ Performance benchmark completed in {benchmark_time:.2f} seconds")
        print()
        
        save_report(benchmark_results, "performance_benchmark_results.json")
    
    # 5. Optimization
    if run_conditions["run_optimization"]:
        print("🔧 Running optimization...")
        start_time = time.time()
        
        optimization_report = optimization_setup.run_optimization_cycle(num_iterations=500)
        
        optimization_time = time.time() - start_time
        print(f"✅ Optimization completed in {optimization_time:.2f} seconds")
        print()
        
        # Display optimization results
        print("🎯 Optimization Results:")
        summary = optimization_report['optimization_summary']
        print(f"   • Target RTP: {summary['target_rtp']:.2f}%")
        print(f"   • Achieved RTP: {summary['achieved_rtp']:.4f}%")
        print(f"   • RTP Variance: ±{summary['rtp_variance']:.4f}%")
        print(f"   • Fitness Score: {summary['fitness_score']:.2f}")
        print()
        
        # Display recommendations
        print("💡 Optimization Recommendations:")
        for i, rec in enumerate(optimization_report['recommendations'], 1):
            print(f"   {i}. {rec}")
        print()
        
        save_report(optimization_report, "optimization_report.json")
    
    # 6. PAR Sheet Generation
    if run_conditions["run_par_sheet_generation"]:
        print("📋 Generating PAR sheet...")
        start_time = time.time()
        
        # Use RTP validation results if available, otherwise use base results
        simulation_results = rtp_results if 'rtp_results' in locals() else base_results if 'base_results' in locals() else {}
        
        par_sheet = generate_par_sheet(config, simulation_results)
        
        par_time = time.time() - start_time
        print(f"✅ PAR sheet generated in {par_time:.2f} seconds")
        print()
        
        save_report(par_sheet, "par_sheet.json")
    
    # 7. Generate comprehensive summary report
    print("📊 Generating comprehensive game report...")
    
    game_report = {
        'game_info': {
            'name': config.working_name,
            'game_id': config.game_id,
            'version': '1.0.0',
            'generation_date': time.strftime('%Y-%m-%d %H:%M:%S'),
            'total_pokemon': len(config.pokemon_data),
            'grid_size': f"{config.num_reels}x{max(config.num_rows)}",
            'target_rtp': config.rtp * 100,
            'max_win': config.wincap
        },
        
        'mathematical_analysis': mathematical_report if 'mathematical_report' in locals() else {},
        'simulation_results': base_results if 'base_results' in locals() else {},
        'rtp_validation': rtp_results if 'rtp_results' in locals() else {},
        'performance_metrics': benchmark_results if 'benchmark_results' in locals() else {},
        'optimization_results': optimization_report if 'optimization_report' in locals() else {},
        'par_sheet': par_sheet if 'par_sheet' in locals() else {},
        
        'feature_summary': {
            'evolution_system': {
                'total_evolutions': len([p for p, d in config.pokemon_data.items() if d.get('evolves_to')]),
                'evolution_multipliers': config.evolution_multipliers,
                'evolution_stones': config.special_symbols.get('evolution_stones', [])
            },
            'cascade_system': {
                'multiplier_progression': config.cascade_multipliers,
                'max_multiplier': max(config.cascade_multipliers) if config.cascade_multipliers else 1
            },
            'bonus_features': [
                'Evolutionary Frenzy (Free Spins)',
                'Catch \'Em All Bonus',
                'Battle Arena Challenge',
                'Persistent Pokédex System'
            ]
        },
        
        'pokemon_breakdown': {
            tier: [name for name, data in config.pokemon_data.items() if data.get('tier') == tier]
            for tier in range(1, 7)
        }
    }
    
    save_report(game_report, "comprehensive_game_report.json")
    
    # Final summary
    print("=" * 60)
    print("🎉 POCKETMON GENESIS REELS IMPLEMENTATION COMPLETE! 🎉")
    print("=" * 60)
    
    if 'compliance_result' in locals():
        if compliance_result['compliant']:
            print("✅ RTP Validation: PASSED")
        else:
            print("❌ RTP Validation: FAILED - Requires optimization")
    
    if 'base_results' in locals():
        print(f"📊 Final RTP: {base_results['rtp']:.4f}%")
        print(f"🎯 Hit Frequency: {base_results['hit_frequency']:.2f}%")
        print(f"💰 Max Win Observed: {base_results['max_win']:.2f}x")
    
    if 'benchmark_results' in locals():
        print(f"⚡ Performance: {benchmark_results['spins_per_second']:,.0f} spins/second")
    
    print("📁 All reports saved to game directory")
    print("=" * 60)
    
    # Display Pokédex sample
    print("\n🔍 Sample Pokédex (First 10 Pokemon by Tier):")
    for tier in range(1, 4):  # Show first 3 tiers
        tier_pokemon = [name for name, data in config.pokemon_data.items() if data.get('tier') == tier][:5]
        if tier_pokemon:
            tier_names = ["Common", "Uncommon", "Rare", "Ultra Rare", "Epic", "Legendary"]
            print(f"   Tier {tier} ({tier_names[tier-1]}): {', '.join(tier_pokemon)}")
    
    print("\n🎮 Game features successfully implemented:")
    print("   ✅ 7x7 cluster-pay system")
    print("   ✅ Evolution mechanics with adjacency detection")
    print("   ✅ Cascading reels with progressive multipliers")
    print("   ✅ Multiple bonus features")
    print("   ✅ Comprehensive mathematical validation")
    print("   ✅ Performance optimization")
    print("   ✅ RTP compliance testing")


def save_report(data, filename):
    """Save report data to JSON file."""
    try:
        # Create data directory if it doesn't exist
        data_dir = "data"
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)
        
        filepath = os.path.join(data_dir, filename)
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        
        print(f"💾 Report saved: {filepath}")
    
    except Exception as e:
        print(f"❌ Error saving report {filename}: {str(e)}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⚠️  Execution interrupted by user")
    except Exception as e:
        print(f"\n❌ Error during execution: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        print("\n🏁 Execution finished.")