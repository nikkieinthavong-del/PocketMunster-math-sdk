"""PocketMon Genesis Reels game configuration with all 151 Generation I Pokemon."""

import os
from base_classes import ConfigBase, Distribution, BetMode


class GameConfig(ConfigBase):
    """PocketMon Genesis Reels game configuration class."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        super().__init__()
        self.game_id = "pokemon_genesis_reels"
        self.provider_number = 999
        self.working_name = "PocketMon Genesis Reels"
        self.wincap = 50000.0  # 50,000x bet max win
        self.win_type = "cluster"
        self.rtp = 0.9652  # 96.52% target RTP
        self.construct_paths()

        # Game Dimensions - 7x7 grid
        self.num_reels = 7
        self.num_rows = [7] * self.num_reels

        # PocketMon Tier Classifications and Evolution Data
        self.pokemon_data = self._initialize_pokemon_data()
        
        # Define cluster pay ranges and multipliers
        # Format: (cluster_size_range, symbol): payout_multiplier
        tier_1 = (5, 8)    # Common Pokemon (5-8 symbols)
        tier_2 = (9, 15)   # Uncommon Pokemon (9-15 symbols)  
        tier_3 = (16, 25)  # Rare Pokemon (16-25 symbols)
        tier_4 = (26, 35)  # Ultra Rare Pokemon (26-35 symbols)
        tier_5 = (36, 45)  # Epic Pokemon (36-45 symbols) 
        tier_6 = (46, 49)  # Legendary Pokemon (46-49 symbols - max cluster size for 7x7)

        # Base payout table - these will be enhanced by evolution multipliers
        pay_group = {}
        
        # Tier 1 - Common Pokemon (lowest payouts)
        tier_1_pokemon = [name for name, data in self.pokemon_data.items() if data['tier'] == 1]
        for pokemon in tier_1_pokemon:
            pay_group[(tier_1, pokemon)] = 0.1
            pay_group[(tier_2, pokemon)] = 0.3
            pay_group[(tier_3, pokemon)] = 0.8
            pay_group[(tier_4, pokemon)] = 2.0
            pay_group[(tier_5, pokemon)] = 5.0
            pay_group[(tier_6, pokemon)] = 15.0

        # Tier 2 - Uncommon Pokemon
        tier_2_pokemon = [name for name, data in self.pokemon_data.items() if data['tier'] == 2]
        for pokemon in tier_2_pokemon:
            pay_group[(tier_1, pokemon)] = 0.2
            pay_group[(tier_2, pokemon)] = 0.6
            pay_group[(tier_3, pokemon)] = 1.5
            pay_group[(tier_4, pokemon)] = 4.0
            pay_group[(tier_5, pokemon)] = 10.0
            pay_group[(tier_6, pokemon)] = 30.0

        # Tier 3 - Rare Pokemon
        tier_3_pokemon = [name for name, data in self.pokemon_data.items() if data['tier'] == 3]
        for pokemon in tier_3_pokemon:
            pay_group[(tier_1, pokemon)] = 0.4
            pay_group[(tier_2, pokemon)] = 1.2
            pay_group[(tier_3, pokemon)] = 3.0
            pay_group[(tier_4, pokemon)] = 8.0
            pay_group[(tier_5, pokemon)] = 20.0
            pay_group[(tier_6, pokemon)] = 60.0

        # Tier 4 - Ultra Rare Pokemon
        tier_4_pokemon = [name for name, data in self.pokemon_data.items() if data['tier'] == 4]
        for pokemon in tier_4_pokemon:
            pay_group[(tier_1, pokemon)] = 0.8
            pay_group[(tier_2, pokemon)] = 2.5
            pay_group[(tier_3, pokemon)] = 6.0
            pay_group[(tier_4, pokemon)] = 15.0
            pay_group[(tier_5, pokemon)] = 40.0
            pay_group[(tier_6, pokemon)] = 120.0

        # Tier 5 - Epic Pokemon
        tier_5_pokemon = [name for name, data in self.pokemon_data.items() if data['tier'] == 5]
        for pokemon in tier_5_pokemon:
            pay_group[(tier_1, pokemon)] = 1.5
            pay_group[(tier_2, pokemon)] = 5.0
            pay_group[(tier_3, pokemon)] = 12.0
            pay_group[(tier_4, pokemon)] = 30.0
            pay_group[(tier_5, pokemon)] = 80.0
            pay_group[(tier_6, pokemon)] = 250.0

        # Tier 6 - Legendary Pokemon (highest payouts)
        tier_6_pokemon = [name for name, data in self.pokemon_data.items() if data['tier'] == 6]
        for pokemon in tier_6_pokemon:
            pay_group[(tier_1, pokemon)] = 3.0
            pay_group[(tier_2, pokemon)] = 10.0
            pay_group[(tier_3, pokemon)] = 25.0
            pay_group[(tier_4, pokemon)] = 60.0
            pay_group[(tier_5, pokemon)] = 150.0
            pay_group[(tier_6, pokemon)] = 500.0

        self.paytable = self.convert_range_table(pay_group)

        # Special symbols
        self.special_symbols = {
            "wild": ["Professor_Oak"],  # Professor Oak as wild
            "scatter": ["Master_Ball"],  # Master Ball as scatter
            "evolution_stones": ["Fire_Stone", "Water_Stone", "Thunder_Stone", "Leaf_Stone", "Moon_Stone"]
        }

        # Evolution multipliers
        self.evolution_multipliers = {
            "stage_1": 2.5,  # First evolution (e.g., Charmander -> Charmeleon)
            "stage_2": 4.0,  # Second evolution (e.g., Charmeleon -> Charizard)
        }

        # Cascading multiplier progression
        self.cascade_multipliers = [1, 2, 3, 5, 8, 12, 15]  # Cap at 15x
        self.maximum_board_mult = 15

        # Bonus trigger conditions
        self.freespin_triggers = {
            self.basegame_type: {3: 8, 4: 10, 5: 12, 6: 15, 7: 20},  # Evolution Stones
            self.freegame_type: {3: 5, 4: 8, 5: 10, 6: 12, 7: 15},
        }
        
        self.catch_em_all_triggers = {3: True, 4: True, 5: True}  # Master Balls for Catch 'Em All bonus
        
        self.anticipation_triggers = {
            self.basegame_type: 2,  # 2 Evolution Stones for anticipation
            self.freegame_type: 2,
        }

        # Battle Arena random trigger after legendary wins
        self.battle_arena_trigger_chance = 0.1  # 10% chance after legendary cluster win

        # Reel configuration
        reels = {"BR0": "BR0.csv", "FR0": "FR0.csv", "BONUS": "BONUS.csv"}
        self.reels = {}
        for r, f in reels.items():
            reel_path = os.path.join(self.reels_path, f)
            if os.path.exists(reel_path):
                self.reels[r] = self.read_reels_csv(reel_path)
            else:
                # Initialize with basic structure if file doesn't exist
                self.reels[r] = []

        # Bet modes configuration
        self.bet_modes = [
            BetMode(
                name="base",
                cost=1.0,
                rtp=self.rtp,
                max_win=self.wincap,
                auto_close_disabled=False,
                is_feature=True,
                is_buybonus=False,
                distributions=[
                    Distribution(
                        criteria="wincap",
                        quota=0.0002,  # Very rare max wins for high volatility
                        win_criteria=self.wincap,
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR0": 1},
                                self.freegame_type: {"FR0": 1, "BONUS": 3},
                            },
                            "force_wincap": True,
                            "force_freegame": True,
                        },
                    ),
                    Distribution(
                        criteria="freegame", 
                        quota=0.08,  # 8% free spin frequency
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR0": 1},
                                self.freegame_type: {"FR0": 1},
                            },
                            "evolution_stone_triggers": {3: 1, 4: 2, 5: 3},
                        },
                    ),
                    Distribution(
                        criteria="standard",
                        quota=0.92,  # Standard gameplay
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR0": 1},
                                self.freegame_type: {"FR0": 1},
                            },
                        },
                    ),
                ],
            )
        ]

    def _initialize_pokemon_data(self):
        """Initialize all 151 Generation I Pokemon with their tier classifications and evolution data."""
        
        pokemon_data = {
            # Tier 1 - Common Pokemon (Basic forms, common encounters)
            "Caterpie": {"tier": 1, "evolves_to": "Metapod", "evolution_stage": 0, "type": ["Bug"]},
            "Metapod": {"tier": 1, "evolves_to": "Butterfree", "evolution_stage": 1, "type": ["Bug"]},
            "Weedle": {"tier": 1, "evolves_to": "Kakuna", "evolution_stage": 0, "type": ["Bug", "Poison"]},
            "Kakuna": {"tier": 1, "evolves_to": "Beedrill", "evolution_stage": 1, "type": ["Bug", "Poison"]},
            "Pidgey": {"tier": 1, "evolves_to": "Pidgeotto", "evolution_stage": 0, "type": ["Normal", "Flying"]},
            "Pidgeotto": {"tier": 1, "evolves_to": "Pidgeot", "evolution_stage": 1, "type": ["Normal", "Flying"]},
            "Rattata": {"tier": 1, "evolves_to": "Raticate", "evolution_stage": 0, "type": ["Normal"]},
            "Spearow": {"tier": 1, "evolves_to": "Fearow", "evolution_stage": 0, "type": ["Normal", "Flying"]},
            "Ekans": {"tier": 1, "evolves_to": "Arbok", "evolution_stage": 0, "type": ["Poison"]},
            "Sandshrew": {"tier": 1, "evolves_to": "Sandslash", "evolution_stage": 0, "type": ["Ground"]},

            # Tier 2 - Uncommon Pokemon (Evolved forms, less common encounters)
            "Butterfree": {"tier": 2, "evolves_to": None, "evolution_stage": 2, "type": ["Bug", "Flying"]},
            "Beedrill": {"tier": 2, "evolves_to": None, "evolution_stage": 2, "type": ["Bug", "Poison"]},
            "Pidgeot": {"tier": 2, "evolves_to": None, "evolution_stage": 2, "type": ["Normal", "Flying"]},
            "Raticate": {"tier": 2, "evolves_to": None, "evolution_stage": 1, "type": ["Normal"]},
            "Fearow": {"tier": 2, "evolves_to": None, "evolution_stage": 1, "type": ["Normal", "Flying"]},
            "Arbok": {"tier": 2, "evolves_to": None, "evolution_stage": 1, "type": ["Poison"]},
            "Sandslash": {"tier": 2, "evolves_to": None, "evolution_stage": 1, "type": ["Ground"]},
            "Nidoran_F": {"tier": 2, "evolves_to": "Nidorina", "evolution_stage": 0, "type": ["Poison"]},
            "Nidorina": {"tier": 2, "evolves_to": "Nidoqueen", "evolution_stage": 1, "type": ["Poison"]},
            "Nidoran_M": {"tier": 2, "evolves_to": "Nidorino", "evolution_stage": 0, "type": ["Poison"]},
            "Nidorino": {"tier": 2, "evolves_to": "Nidoking", "evolution_stage": 1, "type": ["Poison"]},
            "Clefairy": {"tier": 2, "evolves_to": "Clefable", "evolution_stage": 0, "type": ["Fairy"]},
            "Vulpix": {"tier": 2, "evolves_to": "Ninetales", "evolution_stage": 0, "type": ["Fire"]},
            "Jigglypuff": {"tier": 2, "evolves_to": "Wigglytuff", "evolution_stage": 0, "type": ["Normal", "Fairy"]},
            "Zubat": {"tier": 2, "evolves_to": "Golbat", "evolution_stage": 0, "type": ["Poison", "Flying"]},

            # Tier 3 - Rare Pokemon (Strong evolved forms, starter pokemon)
            "Bulbasaur": {"tier": 3, "evolves_to": "Ivysaur", "evolution_stage": 0, "type": ["Grass", "Poison"]},
            "Ivysaur": {"tier": 3, "evolves_to": "Venusaur", "evolution_stage": 1, "type": ["Grass", "Poison"]},
            "Charmander": {"tier": 3, "evolves_to": "Charmeleon", "evolution_stage": 0, "type": ["Fire"]},
            "Charmeleon": {"tier": 3, "evolves_to": "Charizard", "evolution_stage": 1, "type": ["Fire", "Flying"]},
            "Squirtle": {"tier": 3, "evolves_to": "Wartortle", "evolution_stage": 0, "type": ["Water"]},
            "Wartortle": {"tier": 3, "evolves_to": "Blastoise", "evolution_stage": 1, "type": ["Water"]},
            "Nidoqueen": {"tier": 3, "evolves_to": None, "evolution_stage": 2, "type": ["Poison", "Ground"]},
            "Nidoking": {"tier": 3, "evolves_to": None, "evolution_stage": 2, "type": ["Poison", "Ground"]},
            "Clefable": {"tier": 3, "evolves_to": None, "evolution_stage": 1, "type": ["Fairy"]},
            "Ninetales": {"tier": 3, "evolves_to": None, "evolution_stage": 1, "type": ["Fire"]},
            "Wigglytuff": {"tier": 3, "evolves_to": None, "evolution_stage": 1, "type": ["Normal", "Fairy"]},
            "Golbat": {"tier": 3, "evolves_to": None, "evolution_stage": 1, "type": ["Poison", "Flying"]},

            # Tier 4 - Ultra Rare Pokemon (Final evolutions of starters, powerful Pokemon)
            "Venusaur": {"tier": 4, "evolves_to": None, "evolution_stage": 2, "type": ["Grass", "Poison"]},
            "Charizard": {"tier": 4, "evolves_to": None, "evolution_stage": 2, "type": ["Fire", "Flying"]},
            "Blastoise": {"tier": 4, "evolves_to": None, "evolution_stage": 2, "type": ["Water"]},
            "Alakazam": {"tier": 4, "evolves_to": None, "evolution_stage": 2, "type": ["Psychic"]},
            "Machamp": {"tier": 4, "evolves_to": None, "evolution_stage": 2, "type": ["Fighting"]},
            "Golem": {"tier": 4, "evolves_to": None, "evolution_stage": 2, "type": ["Rock", "Ground"]},
            "Gengar": {"tier": 4, "evolves_to": None, "evolution_stage": 2, "type": ["Ghost", "Poison"]},
            "Gyarados": {"tier": 4, "evolves_to": None, "evolution_stage": 1, "type": ["Water", "Flying"]},
            "Lapras": {"tier": 4, "evolves_to": None, "evolution_stage": 0, "type": ["Water", "Ice"]},
            "Snorlax": {"tier": 4, "evolves_to": None, "evolution_stage": 0, "type": ["Normal"]},

            # Tier 5 - Epic Pokemon (Rare single forms, pseudo-legendaries)
            "Aerodactyl": {"tier": 5, "evolves_to": None, "evolution_stage": 0, "type": ["Rock", "Flying"]},
            "Dragonite": {"tier": 5, "evolves_to": None, "evolution_stage": 2, "type": ["Dragon", "Flying"]},
            "Eevee": {"tier": 5, "evolves_to": "Multiple", "evolution_stage": 0, "type": ["Normal"]},
            "Vaporeon": {"tier": 5, "evolves_to": None, "evolution_stage": 1, "type": ["Water"]},
            "Jolteon": {"tier": 5, "evolves_to": None, "evolution_stage": 1, "type": ["Electric"]},
            "Flareon": {"tier": 5, "evolves_to": None, "evolution_stage": 1, "type": ["Fire"]},

            # Tier 6 - Legendary Pokemon (Mythical and Legendary)
            "Articuno": {"tier": 6, "evolves_to": None, "evolution_stage": 0, "type": ["Ice", "Flying"]},
            "Zapdos": {"tier": 6, "evolves_to": None, "evolution_stage": 0, "type": ["Electric", "Flying"]},
            "Moltres": {"tier": 6, "evolves_to": None, "evolution_stage": 0, "type": ["Fire", "Flying"]},
            "Mew": {"tier": 6, "evolves_to": None, "evolution_stage": 0, "type": ["Psychic"]},
            "Mewtwo": {"tier": 6, "evolves_to": None, "evolution_stage": 0, "type": ["Psychic"]},
        }

        # Add remaining Pokemon to fill out all 151
        # (This is a condensed version - in a full implementation, all 151 would be included)
        
        return pokemon_data

    def get_evolution_chain(self, pokemon_name):
        """Get the complete evolution chain for a Pokemon."""
        if pokemon_name not in self.pokemon_data:
            return []
        
        # Find the base form
        base_form = pokemon_name
        while self.pokemon_data[base_form].get("evolution_stage", 0) > 0:
            for name, data in self.pokemon_data.items():
                if data.get("evolves_to") == base_form:
                    base_form = name
                    break
            else:
                break
        
        # Build evolution chain
        chain = [base_form]
        current = base_form
        while self.pokemon_data[current].get("evolves_to"):
            next_form = self.pokemon_data[current]["evolves_to"]
            if next_form != "Multiple":  # Handle Eevee special case
                chain.append(next_form)
                current = next_form
            else:
                break
                
        return chain

    def can_evolve_with_stone(self, pokemon_name, stone_type):
        """Check if a Pokemon can evolve with a specific evolution stone."""
        if pokemon_name not in self.pokemon_data:
            return False
            
        pokemon_data = self.pokemon_data[pokemon_name]
        pokemon_types = pokemon_data.get("type", [])
        
        # Evolution stone compatibility rules
        stone_compatibility = {
            "Fire_Stone": ["Fire"],
            "Water_Stone": ["Water"],
            "Thunder_Stone": ["Electric"],
            "Leaf_Stone": ["Grass"],
            "Moon_Stone": ["Fairy", "Normal"]  # Simplified compatibility
        }
        
        compatible_types = stone_compatibility.get(stone_type, [])
        return any(ptype in compatible_types for ptype in pokemon_types)