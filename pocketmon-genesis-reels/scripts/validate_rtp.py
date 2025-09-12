import numpy as np
import json
from math_engine.src.simulation.core_engine import SimulationEngine
from math_engine.src.config.game_config import PocketMonGenesisReelsConfig

def validate_rtp(target_rtp: float = 0.9652, tolerance: float = 0.001):
    print("Starting RTP validation...")
    
    config = PocketMonGenesisReelsConfig()
    engine = SimulationEngine(config)
    
    results = engine.run_monte_carlo_simulation(1000000, 1.0)
    actual_rtp = results['rtp']
    
    print(f"Target RTP: {target_rtp:.4%}")
    print(f"Actual RTP: {actual_rtp:.4%}")
    print(f"Difference: {abs(actual_rtp - target_rtp):.4%}")
    
    if abs(actual_rtp - target_rtp) <= tolerance:
        print("✅ RTP validation PASSED")
        return True
    else:
        print("❌ RTP validation FAILED")
        return False

def validate_volatility():
    pass

if __name__ == "__main__":
    rtp_valid = validate_rtp()
    
    if rtp_valid:
        print("All validations passed! 🎉")
        exit(0)
    else:
        print("Validations failed! ❌")
        exit(1)