"""Run script for 'fifty_fifty' 7x7 hybrid game (ways, scatter, cluster + bonuses)."""

from gamestate import GameState
from game_config import GameConfig
from src.state.run_sims import create_books
from src.write_data.write_configs import generate_configs
from utils.game_analytics.run_analysis import create_stat_sheet
from utils.rgs_verification import execute_all_tests

if __name__ == "__main__":

    num_threads = 6
    rust_threads = 12
    batching_size = 2000
    compression = True
    profiling = False

    num_sim_args = {"ways": int(5e3), "scatter": int(5e3), "cluster": int(1e4)}

    run_conditions = {
        "run_sims": True,
        "run_optimization": False,
        "run_analysis": True,
        "run_format_checks": True,
    }
    target_modes = list(num_sim_args.keys())

    config = GameConfig()
    gamestate = GameState(config)

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

    if run_conditions["run_analysis"]:
        custom_keys = [{"symbol": "PB"}, {"symbol": "TR"}, {"symbol": "EG"}]
        create_stat_sheet(gamestate, custom_keys=custom_keys)

    if run_conditions["run_format_checks"]:
        execute_all_tests(config)
