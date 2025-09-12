"""Main file for generating PocketMon Genesis Reels simulation results."""

from gamestate import GameState
from game_config import GameConfig
from game_optimization import OptimizationSetup
from optimization_program.run_script import OptimizationExecution
from utils.game_analytics.run_analysis import create_stat_sheet
from utils.rgs_verification import execute_all_tests
from src.state.run_sims import create_books
from src.write_data.write_configs import generate_configs

if __name__ == "__main__":

    # PocketMon Genesis Reels simulation parameters
    num_threads = 10
    rust_threads = 20
    batching_size = 100000  # Larger batch for PocketMon complexity
    compression = True      # Enable compression for production
    profiling = False

    # Simulation counts for each mode
    num_sim_args = {
        "base": int(1e6),      # 1 million base game simulations
        "freespin": int(5e5),  # 500k free spin simulations
    }

    run_conditions = {
        "run_sims": False,
        "run_optimization": False,
        "run_analysis": False,
        "upload_data": True,
    }
    target_modes = ["base"]

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
        # Analyze PocketMon scatter behavior and win distributions
        custom_keys = [{"symbol": "pokeball"}]  # Analyze Pokeball scatters
        create_stat_sheet(config.game_id, custom_keys=custom_keys)

    if run_conditions["upload_data"]:
        upload_items = {
            "books": True,
            "lookup_tables": True, 
            "force_files": True,
            "config_files": True,
        }
        from uploads.aws_upload import upload_to_aws
        upload_to_aws(
            gamestate,
            target_modes,
            upload_items,
        )
