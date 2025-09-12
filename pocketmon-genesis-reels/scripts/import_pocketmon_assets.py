#!/usr/bin/env python3
"""
PocketMon Asset Import and Organization Script

This script helps import PocketMon sprites from the Windows source directory
and organizes them into the proper game asset structure.

Usage:
1. First, manually copy files from C:/Users/kevin/Desktop/PocketMon/sprites_out/gen1
   to /tmp/pocketmon_import/ (or use WSL to access the Windows path)
2. Run this script to process and organize the assets
"""

import os
import re
import shutil
from pathlib import Path
import json
from typing import Dict, List, Tuple

class PocketMonAssetImporter:
    def __init__(self, source_dir: str, target_base_dir: str):
        self.source_dir = Path(source_dir)
        self.target_base_dir = Path(target_base_dir)
        
        # Define tier classifications based on PocketMon numbers
        self.tier_classifications = {
            'tier1': range(1, 31),      # Basic PocketMon (1-30)
            'tier2': range(31, 61),     # Uncommon (31-60) 
            'tier3': range(61, 91),     # Rare (61-90)
            'tier4': range(91, 121),    # Epic (91-120)
            'tier5': range(121, 151),   # Legendary precursors (121-150)
            'legendaries': [150, 151]   # Mewtwo, Mew
        }
        
        # PocketMon name mappings (Gen 1 - first 151)
        self.pocketmon_names = {
            1: "Bulbasaur", 2: "Ivysaur", 3: "Venusaur", 4: "Charmander", 5: "Charmeleon",
            6: "Charizard", 7: "Squirtle", 8: "Wartortle", 9: "Blastoise", 10: "Caterpie",
            11: "Metapod", 12: "Butterfree", 13: "Weedle", 14: "Kakuna", 15: "Beedrill",
            16: "Pidgey", 17: "Pidgeotto", 18: "Pidgeot", 19: "Rattata", 20: "Raticate",
            21: "Spearow", 22: "Fearow", 23: "Ekans", 24: "Arbok", 25: "Pikachu",
            26: "Raichu", 27: "Sandshrew", 28: "Sandslash", 29: "Nidoran♀", 30: "Nidorina",
            31: "Nidoqueen", 32: "Nidoran♂", 33: "Nidorino", 34: "Nidoking", 35: "Clefairy",
            36: "Clefable", 37: "Vulpix", 38: "Ninetales", 39: "Jigglypuff", 40: "Wigglytuff",
            41: "Zubat", 42: "Golbat", 43: "Oddish", 44: "Gloom", 45: "Vileplume",
            46: "Paras", 47: "Parasect", 48: "Venonat", 49: "Venomoth", 50: "Diglett",
            51: "Dugtrio", 52: "Meowth", 53: "Persian", 54: "Psyduck", 55: "Golduck",
            56: "Mankey", 57: "Primeape", 58: "Growlithe", 59: "Arcanine", 60: "Poliwag",
            61: "Poliwhirl", 62: "Poliwrath", 63: "Abra", 64: "Kadabra", 65: "Alakazam",
            66: "Machop", 67: "Machoke", 68: "Machamp", 69: "Bellsprout", 70: "Weepinbell",
            71: "Victreebel", 72: "Tentacool", 73: "Tentacruel", 74: "Geodude", 75: "Graveler",
            76: "Golem", 77: "Ponyta", 78: "Rapidash", 79: "Slowpoke", 80: "Slowbro",
            81: "Magnemite", 82: "Magneton", 83: "Farfetchd", 84: "Doduo", 85: "Dodrio",
            86: "Seel", 87: "Dewgong", 88: "Grimer", 89: "Muk", 90: "Shellder",
            91: "Cloyster", 92: "Gastly", 93: "Haunter", 94: "Gengar", 95: "Onix",
            96: "Drowzee", 97: "Hypno", 98: "Krabby", 99: "Kingler", 100: "Voltorb",
            101: "Electrode", 102: "Exeggcute", 103: "Exeggutor", 104: "Cubone", 105: "Marowak",
            106: "Hitmonlee", 107: "Hitmonchan", 108: "Lickitung", 109: "Koffing", 110: "Weezing",
            111: "Rhyhorn", 112: "Rhydon", 113: "Chansey", 114: "Tangela", 115: "Kangaskhan",
            116: "Horsea", 117: "Seadra", 118: "Goldeen", 119: "Seaking", 120: "Staryu",
            121: "Starmie", 122: "MrMime", 123: "Scyther", 124: "Jynx", 125: "Electabuzz",
            126: "Magmar", 127: "Pinsir", 128: "Tauros", 129: "Magikarp", 130: "Gyarados",
            131: "Lapras", 132: "Ditto", 133: "Eevee", 134: "Vaporeon", 135: "Jolteon",
            136: "Flareon", 137: "Porygon", 138: "Omanyte", 139: "Omastar", 140: "Kabuto",
            141: "Kabutops", 142: "Aerodactyl", 143: "Snorlax", 144: "Articuno", 145: "Zapdos",
            146: "Moltres", 147: "Dratini", 148: "Dragonair", 149: "Dragonite", 150: "Mewtwo",
            151: "Mew"
        }

    def clean_filename(self, filename: str) -> Tuple[str, int]:
        """
        Extract PocketMon name and number from filename, removing numerical prefixes
        
        Args:
            filename: Original filename (e.g., "001_Bulbasaur.png" or "025_Pikachu_shiny.png")
            
        Returns:
            Tuple of (clean_name, pocketmon_number)
        """
        # Remove file extension
        name_without_ext = os.path.splitext(filename)[0]
        
        # Extract number prefix
        number_match = re.match(r'(\d+)_?(.+)', name_without_ext)
        if number_match:
            number = int(number_match.group(1))
            remaining_name = number_match.group(2)
        else:
            # Fallback: try to find number anywhere in filename
            numbers = re.findall(r'\d+', name_without_ext)
            if numbers:
                number = int(numbers[0])
                remaining_name = re.sub(r'\d+_?', '', name_without_ext)
            else:
                print(f"Warning: Could not extract number from {filename}")
                return name_without_ext, 0
        
        # Clean the name - remove extra underscores, numbers
        clean_name = re.sub(r'^_+|_+$', '', remaining_name)  # Remove leading/trailing underscores
        clean_name = re.sub(r'_+', '_', clean_name)  # Replace multiple underscores with single
        
        # If we have the PocketMon name mapping, use the canonical name
        if number in self.pocketmon_names:
            canonical_name = self.pocketmon_names[number]
            # Check if it's a variant (shiny, etc.)
            if 'shiny' in clean_name.lower():
                canonical_name += "_shiny"
            elif 'female' in clean_name.lower():
                canonical_name += "_female" 
            elif 'male' in clean_name.lower():
                canonical_name += "_male"
            
            clean_name = canonical_name
        
        return clean_name, number

    def get_tier_for_number(self, number: int) -> str:
        """Determine which tier a PocketMon belongs to based on its number"""
        for tier, number_range in self.tier_classifications.items():
            if isinstance(number_range, range):
                if number in number_range:
                    return tier
            elif isinstance(number_range, list):
                if number in number_range:
                    return tier
        
        # Default to tier1 if not found
        return 'tier1'

    def create_asset_structure(self):
        """Create the complete asset directory structure"""
        base_dirs = [
            'assets/sprites/pocketmon/tier1',
            'assets/sprites/pocketmon/tier2', 
            'assets/sprites/pocketmon/tier3',
            'assets/sprites/pocketmon/tier4',
            'assets/sprites/pocketmon/tier5',
            'assets/sprites/pocketmon/legendaries',
            'assets/sprites/symbols',
            'assets/sprites/ui',
            'assets/animations/evolution_sequences',
            'assets/animations/particle_effects',
            'assets/audio/sfx/pocketmon_cries'
        ]
        
        for dir_path in base_dirs:
            full_path = self.target_base_dir / dir_path
            full_path.mkdir(parents=True, exist_ok=True)
            print(f"Created directory: {full_path}")

    def process_sprites(self):
        """Process and organize all sprite files"""
        if not self.source_dir.exists():
            print(f"Error: Source directory {self.source_dir} does not exist")
            print("Please copy files from C:\\Users\\kevin\\Desktop\\PocketMon\\sprites_out\\gen1")
            print("to the source directory first")
            return
            
        processed_files = []
        errors = []
        
        # Process all image files in source directory
        for file_path in self.source_dir.glob('*.png'):
            try:
                clean_name, number = self.clean_filename(file_path.name)
                
                if number == 0:
                    errors.append(f"Could not process: {file_path.name}")
                    continue
                
                # Determine target tier
                tier = self.get_tier_for_number(number)
                
                # Create target path
                target_dir = self.target_base_dir / 'assets' / 'sprites' / 'pocketmon' / tier
                target_file = target_dir / f"{clean_name}.png"
                
                # Copy file
                shutil.copy2(file_path, target_file)
                processed_files.append({
                    'original': file_path.name,
                    'new_name': f"{clean_name}.png",
                    'tier': tier,
                    'number': number
                })
                
                print(f"Processed: {file_path.name} -> {tier}/{clean_name}.png")
                
            except Exception as e:
                errors.append(f"Error processing {file_path.name}: {str(e)}")
        
        # Generate summary report
        self.generate_report(processed_files, errors)

    def generate_symbol_definitions(self, processed_files: List[Dict]):
        """Generate symbol definitions for the game config"""
        symbols_by_tier = {}
        
        for file_info in processed_files:
            tier = file_info['tier']
            if tier not in symbols_by_tier:
                symbols_by_tier[tier] = []
            
            symbol_def = {
                'name': file_info['new_name'].replace('.png', ''),
                'number': file_info['number'],
                'tier': tier,
                'file_path': f"assets/sprites/pocketmon/{tier}/{file_info['new_name']}"
            }
            symbols_by_tier[tier].append(symbol_def)
        
        # Write symbols configuration
        symbols_config = {
            'pocketmon_symbols': symbols_by_tier,
            'total_count': len(processed_files)
        }
        
        config_file = self.target_base_dir / 'assets' / 'pocketmon_symbols_config.json'
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(symbols_config, f, indent=2, ensure_ascii=False)
        
        print(f"Generated symbols configuration: {config_file}")

    def generate_report(self, processed_files: List[Dict], errors: List[str]):
        """Generate a detailed processing report"""
        report_file = self.target_base_dir / 'assets' / 'import_report.txt'
        
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write("PocketMon Asset Import Report\n")
            f.write("=" * 50 + "\n\n")
            
            f.write(f"Successfully processed: {len(processed_files)} files\n")
            f.write(f"Errors encountered: {len(errors)} files\n\n")
            
            # Group by tier
            by_tier = {}
            for file_info in processed_files:
                tier = file_info['tier']
                if tier not in by_tier:
                    by_tier[tier] = []
                by_tier[tier].append(file_info)
            
            f.write("Files by Tier:\n")
            f.write("-" * 20 + "\n")
            for tier in sorted(by_tier.keys()):
                f.write(f"{tier}: {len(by_tier[tier])} files\n")
                for file_info in sorted(by_tier[tier], key=lambda x: x['number']):
                    f.write(f"  #{file_info['number']:03d}: {file_info['new_name']}\n")
                f.write("\n")
            
            if errors:
                f.write("Errors:\n")
                f.write("-" * 10 + "\n")
                for error in errors:
                    f.write(f"  {error}\n")
        
        print(f"Generated import report: {report_file}")
        
        # Also generate symbols config
        self.generate_symbol_definitions(processed_files)

def main():
    """Main execution function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Import and organize PocketMon assets')
    parser.add_argument('--source', 
                       default='/tmp/pocketmon_import',
                       help='Source directory containing PocketMon sprites')
    parser.add_argument('--target',
                       default='/workspaces/math-sdk/pocketmon-genesis-reels',
                       help='Target project directory')
    
    args = parser.parse_args()
    
    print("PocketMon Asset Importer")
    print("=" * 50)
    print(f"Source: {args.source}")
    print(f"Target: {args.target}")
    print()
    
    importer = PocketMonAssetImporter(args.source, args.target)
    
    # Create directory structure
    print("Creating asset directory structure...")
    importer.create_asset_structure()
    
    # Process sprites
    print("\nProcessing sprite files...")
    importer.process_sprites()
    
    print("\nAsset import complete!")
    print("Check the import_report.txt file for details.")

if __name__ == "__main__":
    main()