"""Write frontend integration files for math engine."""

import json
import os
from pathlib import Path
from typing import Dict, Any, List


class FrontendIntegrationWriter:
    """Handles writing frontend integration files from math engine."""
    
    def __init__(self, game_path: str, output_path: str = None):
        self.game_path = Path(game_path)
        self.output_path = Path(output_path) if output_path else self.game_path / "frontend_integration"
        self.output_path.mkdir(exist_ok=True)
    
    def write_game_config_json(self, config: Any) -> None:
        """Write game configuration to JSON format for frontend consumption."""
        config_data = {
            "gameId": config.game_id,
            "providerNumber": config.provider_number,
            "workingName": config.working_name,
            "winCap": config.wincap,
            "winType": config.win_type,
            "rtp": config.rtp,
            "numReels": config.num_reels,
            "numRows": getattr(config, 'num_rows', None),
            "paylines": getattr(config, 'paylines', None),
            "ways": getattr(config, 'ways', None),
            "betSizes": getattr(config, 'bet_sizes', [0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0]),
            "symbols": self._extract_symbol_info(config),
            "features": self._extract_feature_info(config)
        }
        
        output_file = self.output_path / "game_config.json"
        with open(output_file, 'w') as f:
            json.dump(config_data, f, indent=2)
        
        print(f"Frontend game config written to: {output_file}")
    
    def write_api_endpoints(self, game_id: str) -> None:
        """Write API endpoint definitions for frontend integration."""
        endpoints = {
            "baseUrl": "/api",
            "endpoints": {
                "config": f"/games/{game_id}/config",
                "spin": f"/games/{game_id}/spin", 
                "analytics": f"/games/{game_id}/analytics",
                "history": f"/games/{game_id}/history",
                "verification": f"/games/{game_id}/verify"
            },
            "websocket": {
                "url": "/ws",
                "events": {
                    "spin_complete": "spin_complete",
                    "feature_triggered": "feature_triggered",
                    "game_state_update": "game_state_update",
                    "analytics_update": "analytics_update"
                }
            }
        }
        
        output_file = self.output_path / "api_endpoints.json"
        with open(output_file, 'w') as f:
            json.dump(endpoints, f, indent=2)
        
        print(f"API endpoints written to: {output_file}")
    
    def write_symbol_mapping(self, config: Any) -> None:
        """Write symbol mapping for frontend display."""
        symbol_mapping = {
            "symbols": {},
            "displayNames": {},
            "payouts": {}
        }
        
        # Extract symbol information if available
        if hasattr(config, 'symbol_map'):
            for symbol_id, symbol_info in config.symbol_map.items():
                symbol_mapping["symbols"][symbol_id] = {
                    "id": symbol_id,
                    "name": symbol_info.get("name", f"Symbol {symbol_id}"),
                    "displayChar": symbol_info.get("display", str(symbol_id)),
                    "isWild": symbol_info.get("is_wild", False),
                    "isScatter": symbol_info.get("is_scatter", False)
                }
        
        output_file = self.output_path / "symbol_mapping.json" 
        with open(output_file, 'w') as f:
            json.dump(symbol_mapping, f, indent=2)
        
        print(f"Symbol mapping written to: {output_file}")
    
    def write_win_calculations_interface(self, game_id: str) -> None:
        """Write interface for win calculations."""
        interface = {
            "gameId": game_id,
            "winTypes": {
                "line": "Line wins (traditional paylines)",
                "ways": "Ways to win (adjacent reels)", 
                "cluster": "Cluster pays (connected symbols)",
                "scatter": "Scatter pays (anywhere on reels)",
                "bonus": "Bonus features"
            },
            "calculationMethods": {
                "getLineWins": "Calculate wins on active paylines",
                "getWaysWins": "Calculate ways-to-win payouts",
                "getClusterWins": "Calculate cluster payouts",
                "getScatterWins": "Calculate scatter payouts",
                "getBonusFeatures": "Check for bonus triggers"
            },
            "returnFormat": {
                "wins": [
                    {
                        "winType": "string",
                        "symbols": "number[]",
                        "positions": "number[][]", 
                        "multiplier": "number",
                        "payout": "number"
                    }
                ],
                "totalWin": "number",
                "features": [
                    {
                        "featureType": "string",
                        "triggered": "boolean",
                        "data": "any"
                    }
                ]
            }
        }
        
        output_file = self.output_path / "win_calculations_interface.json"
        with open(output_file, 'w') as f:
            json.dump(interface, f, indent=2)
        
        print(f"Win calculations interface written to: {output_file}")
    
    def generate_typescript_types(self, config: Any) -> None:
        """Generate TypeScript type definitions from game config."""
        typescript_types = f'''// Auto-generated TypeScript types for {config.game_id}

export interface {config.game_id.replace('_', '').title()}GameConfig {{
  gameId: "{config.game_id}";
  providerNumber: {config.provider_number};
  workingName: "{config.working_name}";
  winCap: {config.wincap};
  winType: "{config.win_type}";
  rtp: {config.rtp};
  numReels: {config.num_reels};
  numRows?: number;
  paylines?: number;
  ways?: number;
}}

export interface {config.game_id.replace('_', '').title()}SpinRequest {{
  bet: number;
  gameState?: any;
}}

export interface {config.game_id.replace('_', '').title()}SpinResponse {{
  reels: number[][];
  wins: WinResult[];
  totalWin: number;
  nextGameState?: string;
  features?: FeatureResult[];
}}

export interface WinResult {{
  winType: "{config.win_type}";
  symbols: number[];
  positions?: number[][];
  multiplier: number;
  payout: number;
}}

export interface FeatureResult {{
  featureType: string;
  triggered: boolean;
  data?: any;
}}
'''
        
        output_file = self.output_path / f"{config.game_id}_types.ts"
        with open(output_file, 'w') as f:
            f.write(typescript_types)
        
        print(f"TypeScript types written to: {output_file}")
    
    def _extract_symbol_info(self, config: Any) -> Dict:
        """Extract symbol information from config."""
        symbols = {}
        
        # Try to get symbol information from various config attributes
        for attr in ['symbol_map', 'symbols', 'symbol_info']:
            if hasattr(config, attr):
                symbol_data = getattr(config, attr)
                if isinstance(symbol_data, dict):
                    symbols.update(symbol_data)
        
        return symbols
    
    def _extract_feature_info(self, config: Any) -> List[str]:
        """Extract available features from config."""
        features = []
        
        # Check for common feature attributes
        feature_attrs = [
            'has_wilds', 'has_scatters', 'has_bonus', 'has_freespins',
            'has_multipliers', 'has_cascades', 'has_megaways'
        ]
        
        for attr in feature_attrs:
            if hasattr(config, attr) and getattr(config, attr):
                feature_name = attr.replace('has_', '').replace('_', ' ').title()
                features.append(feature_name)
        
        return features


def write_frontend_integration(game_path: str, config: Any) -> None:
    """Main function to write all frontend integration files."""
    writer = FrontendIntegrationWriter(game_path)
    
    # Write all integration files
    writer.write_game_config_json(config)
    writer.write_api_endpoints(config.game_id)
    writer.write_symbol_mapping(config)
    writer.write_win_calculations_interface(config.game_id)
    writer.generate_typescript_types(config)
    
    print(f"Frontend integration files generated for {config.game_id}")