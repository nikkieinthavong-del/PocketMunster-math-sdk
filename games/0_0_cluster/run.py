"""Main file for generating results for sample ways-pay game."""

from gamestate import GameState
from game_config import GameConfig
from game_optimization import OptimizationSetup
from optimization_program.run_script import OptimizationExecution
from utils.game_analytics.run_analysis import create_stat_sheet
from utils.rgs_verification import execute_all_tests
from src.state.run_sims import create_books
from src.write_data.write_configs import generate_configs

# Import frontend integration
try:
    from src.write_data.write_frontend_integration import write_frontend_integration
    FRONTEND_INTEGRATION_AVAILABLE = True
except ImportError:
    FRONTEND_INTEGRATION_AVAILABLE = False
    print("Warning: Frontend integration module not available")

if __name__ == "__main__":

    num_threads = 10
    rust_threads = 20
    batching_size = 50000
    compression = True
    profiling = False

    num_sim_args = {
        "base": int(1e4),
        "bonus": int(1e4),
    }

    run_conditions = {
        "run_sims": True,
        "run_optimization": True,
        "run_analysis": True,
        "run_format_checks": True,
        "generate_frontend_integration": True,  # New option for frontend integration
    }
    target_modes = ["base", "bonus"]

    config = GameConfig()
    gamestate = GameState(config)
    if run_conditions["run_optimization"] or run_conditions["run_analysis"]:
        optimization_setup_class = OptimizationSetup(config)

    if run_conditions["run_sims"]:
        create_books(
            gamestate,
            config,
            num_sim_args,
            batching_size,
            num_threads,
            compression,
            profiling,
        )

    generate_configs(gamestate)

    if run_conditions["run_optimization"]:
        OptimizationExecution().run_all_modes(config, target_modes, rust_threads)
        generate_configs(gamestate)

    if run_conditions["run_analysis"]:
        custom_keys = [{"symbol": "scatter"}]
        create_stat_sheet(gamestate, custom_keys=custom_keys)

    if run_conditions["run_format_checks"]:
        execute_all_tests(config)
    
    # Generate frontend integration files
    if run_conditions["generate_frontend_integration"] and FRONTEND_INTEGRATION_AVAILABLE:
        try:
            import os
            game_path = os.path.dirname(os.path.abspath(__file__))
            write_frontend_integration(game_path, config)
            print("Frontend integration files generated successfully")
        except Exception as e:
            print(f"Warning: Failed to generate frontend integration files: {e}")
