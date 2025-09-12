"""PocketMon Genesis Reels game configuration file."""

from src.config.config import Config
from src.config.distributions import Distribution
from src.config.config import BetMode


class GameConfig(Config):
    """PocketMon Genesis Reels configuration class."""

    def __init__(self):
        super().__init__()
        self.game_id = "pocketmon_genesis_reels"
        self.provider_number = 420
        self.working_name = "PocketMon Genesis Reels"
        self.wincap = 50000
        self.win_type = "ways"
        self.rtp = 96.50
        self.construct_paths()

        # Game Dimensions - 5x3 grid typical slot format
        self.num_reels = 5
        self.num_rows = [3] * self.num_reels
        
        # Complete 151 Gen 1 PocketMon symbols organized by tier/rarity based on evolution stage
        self.paytable = {
            # Tier 5 - Legendary PocketMon (Highest payouts)
            "mewtwo": [0, 0, 50, 100, 500],      # #150 - Psychic legendary
            "articuno": [0, 0, 30, 60, 300],     # #144 - Ice/Flying legendary
            "zapdos": [0, 0, 30, 60, 300],       # #145 - Electric/Flying legendary  
            "moltres": [0, 0, 30, 60, 300],      # #146 - Fire/Flying legendary
            
            # Tier 4 - Rare/Unique PocketMon (High payouts)
            "mew": [0, 0, 25, 50, 250],          # #151 - Mythical psychic
            "snorlax": [0, 0, 20, 40, 200],      # #143 - Sleeping giant
            "lapras": [0, 0, 20, 40, 200],       # #131 - Water/Ice transport
            "aerodactyl": [0, 0, 20, 40, 200],   # #142 - Fossil flying
            "ditto": [0, 0, 18, 35, 175],        # #132 - Transform wild (special)
            "farfetchd": [0, 0, 15, 30, 150],    # #083 - Unique duck
            "onix": [0, 0, 15, 30, 150],         # #095 - Rock snake
            "hitmonlee": [0, 0, 15, 30, 150],    # #106 - Kicking fighter
            "hitmonchan": [0, 0, 15, 30, 150],   # #107 - Punching fighter
            "lickitung": [0, 0, 12, 25, 125],    # #108 - Licking normal
            "chansey": [0, 0, 12, 25, 125],      # #113 - Healing normal
            "tangela": [0, 0, 12, 25, 125],      # #114 - Vine grass
            "kangaskhan": [0, 0, 12, 25, 125],   # #115 - Parent normal
            "mr_mime": [0, 0, 12, 25, 125],      # #122 - Psychic/Fairy mime
            "scyther": [0, 0, 12, 25, 125],      # #123 - Mantis bug
            "jynx": [0, 0, 12, 25, 125],         # #124 - Ice/Psychic humanoid
            "electabuzz": [0, 0, 12, 25, 125],   # #125 - Electric humanoid
            "magmar": [0, 0, 12, 25, 125],       # #126 - Fire humanoid
            "pinsir": [0, 0, 12, 25, 125],       # #127 - Stag beetle
            "tauros": [0, 0, 12, 25, 125],       # #128 - Wild bull
            "porygon": [0, 0, 10, 20, 100],      # #137 - Digital normal
            
            # Tier 3 - Stage 2 Evolutions (Medium-High payouts)
            "venusaur": [0, 0, 10, 20, 100],     # #003 - Grass/Poison final
            "charizard": [0, 0, 10, 20, 100],    # #006 - Fire/Flying final
            "blastoise": [0, 0, 10, 20, 100],    # #009 - Water final
            "dragonite": [0, 0, 10, 20, 100],    # #149 - Dragon/Flying final
            "gyarados": [0, 0, 10, 20, 100],     # #130 - Water/Flying final (from magikarp)
            "butterfree": [0, 0, 8, 16, 80],     # #012 - Bug/Flying final
            "beedrill": [0, 0, 8, 16, 80],       # #015 - Bug/Poison final
            "pidgeot": [0, 0, 8, 16, 80],        # #018 - Normal/Flying final
            "raichu": [0, 0, 8, 16, 80],         # #026 - Electric final
            "nidoqueen": [0, 0, 8, 16, 80],      # #031 - Poison/Ground final
            "nidoking": [0, 0, 8, 16, 80],       # #034 - Poison/Ground final
            "arcanine": [0, 0, 8, 16, 80],       # #059 - Fire final
            "alakazam": [0, 0, 8, 16, 80],       # #065 - Psychic final
            "machamp": [0, 0, 8, 16, 80],        # #068 - Fighting final
            "gengar": [0, 0, 8, 16, 80],         # #094 - Ghost/Poison final
            "vaporeon": [0, 0, 8, 16, 80],       # #134 - Water eeveelution
            "jolteon": [0, 0, 8, 16, 80],        # #135 - Electric eeveelution
            "flareon": [0, 0, 8, 16, 80],        # #136 - Fire eeveelution
            "raticate": [0, 0, 6, 12, 60],       # #020 - Normal final
            "fearow": [0, 0, 6, 12, 60],         # #022 - Normal/Flying final
            "arbok": [0, 0, 6, 12, 60],          # #024 - Poison final
            "sandslash": [0, 0, 6, 12, 60],      # #028 - Ground final
            "clefable": [0, 0, 6, 12, 60],       # #036 - Fairy final
            "ninetales": [0, 0, 6, 12, 60],      # #038 - Fire final
            "wigglytuff": [0, 0, 6, 12, 60],     # #040 - Normal/Fairy final
            "vileplume": [0, 0, 6, 12, 60],      # #045 - Grass/Poison final
            "parasect": [0, 0, 6, 12, 60],       # #047 - Bug/Grass final
            "venomoth": [0, 0, 6, 12, 60],       # #049 - Bug/Poison final
            "dugtrio": [0, 0, 6, 12, 60],        # #051 - Ground final
            "persian": [0, 0, 6, 12, 60],        # #053 - Normal final
            "golduck": [0, 0, 6, 12, 60],        # #055 - Water final
            "primeape": [0, 0, 6, 12, 60],       # #057 - Fighting final
            "poliwrath": [0, 0, 6, 12, 60],      # #062 - Water/Fighting final
            "victreebel": [0, 0, 6, 12, 60],     # #071 - Grass/Poison final
            "tentacruel": [0, 0, 6, 12, 60],     # #073 - Water/Poison final
            "golem": [0, 0, 6, 12, 60],          # #076 - Rock/Ground final
            "rapidash": [0, 0, 6, 12, 60],       # #078 - Fire final
            "slowbro": [0, 0, 6, 12, 60],        # #080 - Water/Psychic final
            "dodrio": [0, 0, 6, 12, 60],         # #085 - Normal/Flying final
            "dewgong": [0, 0, 6, 12, 60],        # #087 - Water/Ice final
            "muk": [0, 0, 6, 12, 60],            # #089 - Poison final
            "cloyster": [0, 0, 6, 12, 60],       # #091 - Water/Ice final
            "hypno": [0, 0, 6, 12, 60],          # #097 - Psychic final
            "kingler": [0, 0, 6, 12, 60],        # #099 - Water final
            "electrode": [0, 0, 6, 12, 60],      # #101 - Electric final
            "exeggutor": [0, 0, 6, 12, 60],      # #103 - Grass/Psychic final
            "marowak": [0, 0, 6, 12, 60],        # #105 - Ground final
            "weezing": [0, 0, 6, 12, 60],        # #110 - Poison final
            "seaking": [0, 0, 6, 12, 60],        # #119 - Water final
            "starmie": [0, 0, 6, 12, 60],        # #121 - Water/Psychic final
            "omastar": [0, 0, 6, 12, 60],        # #139 - Rock/Water final
            "kabutops": [0, 0, 6, 12, 60],       # #141 - Rock/Water final
            
            # Tier 2 - Stage 1 Evolutions (Medium payouts)
            "ivysaur": [0, 0, 4, 8, 40],         # #002 - Grass/Poison stage 1
            "charmeleon": [0, 0, 4, 8, 40],      # #005 - Fire stage 1
            "wartortle": [0, 0, 4, 8, 40],       # #008 - Water stage 1
            "kadabra": [0, 0, 4, 8, 40],         # #064 - Psychic stage 1
            "machoke": [0, 0, 4, 8, 40],         # #067 - Fighting stage 1
            "haunter": [0, 0, 4, 8, 40],         # #093 - Ghost/Poison stage 1
            "dragonair": [0, 0, 4, 8, 40],       # #148 - Dragon stage 1
            "pidgeotto": [0, 0, 3, 6, 30],       # #017 - Normal/Flying stage 1
            "nidorina": [0, 0, 3, 6, 30],        # #030 - Poison stage 1
            "nidorino": [0, 0, 3, 6, 30],        # #033 - Poison stage 1
            "golbat": [0, 0, 3, 6, 30],          # #042 - Poison/Flying stage 1
            "gloom": [0, 0, 3, 6, 30],           # #044 - Grass/Poison stage 1
            "poliwhirl": [0, 0, 3, 6, 30],       # #061 - Water stage 1
            "weepinbell": [0, 0, 3, 6, 30],      # #070 - Grass/Poison stage 1
            "graveler": [0, 0, 3, 6, 30],        # #075 - Rock/Ground stage 1
            "magneton": [0, 0, 3, 6, 30],        # #082 - Electric/Steel stage 1
            "rhydon": [0, 0, 3, 6, 30],          # #112 - Ground/Rock stage 1
            "seadra": [0, 0, 3, 6, 30],          # #117 - Water stage 1
            "metapod": [0, 0, 2, 4, 20],         # #011 - Bug stage 1
            "kakuna": [0, 0, 2, 4, 20],          # #014 - Bug/Poison stage 1
            
            # Tier 1 - Basic PocketMon (Low payouts)
            "pikachu": [0, 0, 3, 6, 30],         # #025 - Electric basic (mascot)
            "eevee": [0, 0, 3, 6, 30],           # #133 - Normal basic (evolution special)
            "bulbasaur": [0, 0, 2, 4, 20],       # #001 - Grass/Poison starter
            "charmander": [0, 0, 2, 4, 20],      # #004 - Fire starter
            "squirtle": [0, 0, 2, 4, 20],        # #007 - Water starter
            "pidgey": [0, 0, 2, 4, 20],          # #016 - Normal/Flying common
            "clefairy": [0, 0, 2, 4, 20],        # #035 - Fairy cute
            "vulpix": [0, 0, 2, 4, 20],          # #037 - Fire fox
            "jigglypuff": [0, 0, 2, 4, 20],      # #039 - Normal/Fairy singer
            "meowth": [0, 0, 2, 4, 20],          # #052 - Normal cat
            "psyduck": [0, 0, 2, 4, 20],         # #054 - Water duck
            "growlithe": [0, 0, 2, 4, 20],       # #058 - Fire dog
            "abra": [0, 0, 2, 4, 20],            # #063 - Psychic teleport
            "ponyta": [0, 0, 2, 4, 20],          # #077 - Fire horse
            "slowpoke": [0, 0, 2, 4, 20],        # #079 - Water/Psychic slow
            "gastly": [0, 0, 2, 4, 20],          # #092 - Ghost/Poison spirit
            "cubone": [0, 0, 2, 4, 20],          # #104 - Ground lonely
            "dratini": [0, 0, 2, 4, 20],         # #147 - Dragon serpent
            "caterpie": [0, 0, 1, 2, 10],        # #010 - Bug worm
            "weedle": [0, 0, 1, 2, 10],          # #013 - Bug/Poison worm
            "rattata": [0, 0, 1, 2, 10],         # #019 - Normal rat
            "spearow": [0, 0, 1, 2, 10],         # #021 - Normal/Flying bird
            "ekans": [0, 0, 1, 2, 10],           # #023 - Poison snake
            "sandshrew": [0, 0, 1, 2, 10],       # #027 - Ground shrew
            "nidoran_f": [0, 0, 1, 2, 10],       # #029 - Poison female
            "nidoran_m": [0, 0, 1, 2, 10],       # #032 - Poison male
            "zubat": [0, 0, 1, 2, 10],           # #041 - Poison/Flying bat
            "oddish": [0, 0, 1, 2, 10],          # #043 - Grass/Poison plant
            "paras": [0, 0, 1, 2, 10],           # #046 - Bug/Grass mushroom
            "venonat": [0, 0, 1, 2, 10],         # #048 - Bug/Poison moth
            "diglett": [0, 0, 1, 2, 10],         # #050 - Ground mole
            "mankey": [0, 0, 1, 2, 10],          # #056 - Fighting pig
            "poliwag": [0, 0, 1, 2, 10],         # #060 - Water tadpole
            "machop": [0, 0, 1, 2, 10],          # #066 - Fighting humanoid
            "bellsprout": [0, 0, 1, 2, 10],      # #069 - Grass/Poison plant
            "tentacool": [0, 0, 1, 2, 10],       # #072 - Water/Poison jellyfish
            "geodude": [0, 0, 1, 2, 10],         # #074 - Rock/Ground rock
            "magnemite": [0, 0, 1, 2, 10],       # #081 - Electric/Steel magnet
            "doduo": [0, 0, 1, 2, 10],           # #084 - Normal/Flying bird
            "seel": [0, 0, 1, 2, 10],            # #086 - Water seal
            "grimer": [0, 0, 1, 2, 10],          # #088 - Poison sludge
            "shellder": [0, 0, 1, 2, 10],        # #090 - Water clam
            "drowzee": [0, 0, 1, 2, 10],         # #096 - Psychic tapir
            "krabby": [0, 0, 1, 2, 10],          # #098 - Water crab
            "voltorb": [0, 0, 1, 2, 10],         # #100 - Electric ball
            "exeggcute": [0, 0, 1, 2, 10],       # #102 - Grass/Psychic eggs
            "koffing": [0, 0, 1, 2, 10],         # #109 - Poison gas
            "rhyhorn": [0, 0, 1, 2, 10],         # #111 - Ground/Rock rhino
            "horsea": [0, 0, 1, 2, 10],          # #116 - Water seahorse
            "goldeen": [0, 0, 1, 2, 10],         # #118 - Water goldfish
            "staryu": [0, 0, 1, 2, 10],          # #120 - Water starfish
            "magikarp": [0, 0, 1, 2, 10],        # #129 - Water fish (famously weak)
            "omanyte": [0, 0, 1, 2, 10],         # #138 - Rock/Water fossil
            "kabuto": [0, 0, 1, 2, 10],          # #140 - Rock/Water fossil
            
            # Special game symbols
            "pokeball": [0, 0, 0, 0, 0],         # Scatter symbol (triggers free spins)
            "masterball": [0, 0, 0, 0, 0],       # Multiplier symbol (enhances wins)
            "machamp": [0, 0, 10, 20, 100],
            "golem": [0, 0, 10, 20, 100],
            
            # Tier 2 - First evolutions  
            "ivysaur": [0, 0, 8, 15, 80],
            "charmeleon": [0, 0, 8, 15, 80],
            "wartortle": [0, 0, 8, 15, 80],
            "pidgeotto": [0, 0, 6, 12, 60],
            
            # Tier 1 - Basic PocketMon
            "pikachu": [0, 0, 5, 10, 50],
            "bulbasaur": [0, 0, 4, 8, 40],
            "charmander": [0, 0, 4, 8, 40],
            "squirtle": [0, 0, 4, 8, 40],
            "caterpie": [0, 0, 2, 5, 25],
            "weedle": [0, 0, 2, 5, 25],
        }

        self.include_padding = True
        self.special_symbols = {
            "wild": ["ditto"],  # Ditto acts as wild (transforms into other PocketMon)
            "scatter": ["pokeball"],  # Pokeball scatter triggers bonus features
            "multiplier": ["master_ball"]  # Master Ball multiplies wins
        }

        # Freespin triggers - Pokeball scatters trigger free spins
        self.freespin_triggers = {
            self.basegame_type: {"pokeball": 3},  # 3+ Pokeballs trigger free spins
            self.freegame_type: {"pokeball": 3}   # Retrigger possible in free spins
        }
        self.anticipation_triggers = {self.basegame_type: 2, self.freegame_type: 2}
        
        # Reel configuration - Base game and Free game reels
        reels = {
            "BR0": "pocketmon_base_reels.csv",      # Base game reels
            "FR0": "pocketmon_freespin_reels.csv"   # Free spin reels (higher value symbols)
        }
        self.reels = {}
        for r, f in reels.items():
            self.reels[r] = self.read_reels_csv(str.join("/", [self.reels_path, f]))

        # Bet modes for PocketMon Genesis Reels
        self.bet_modes = [
            BetMode(
                name="base",
                cost=1.0,
                rtp=self.rtp,
                max_win=self.wincap,
                auto_close_disabled=False,
                is_feature=False,
                is_buybonus=False,
                distributions=[
                    Distribution(
                        criteria="wincap",
                        quota=0.001,
                        win_criteria=self.wincap,
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR0": 1},
                                self.freegame_type: {"FR0": 1},
                            },
                            "scatter_triggers": {},
                            "force_wincap": True,
                            "force_freegame": True,
                        },
                    ),
                    Distribution(
                        criteria="freegame",
                        quota=0.1,
                        conditions={
                            "reel_weights": {
                                self.basegame_type: {"BR0": 1},
                                self.freegame_type: {"FR0": 1},
                            },
                            "scatter_triggers": {},
                            "force_wincap": False,
                            "force_freegame": True,
                        },
                    ),
                    Distribution(
                        criteria="0",
                        quota=0.4,
                        win_criteria=0.0,
                        conditions={
                            "reel_weights": {self.basegame_type: {"BR0": 1}},
                            "force_wincap": False,
                            "force_freegame": False,
                        },
                    ),
                    Distribution(
                        criteria="basegame",
                        quota=0.5,
                        conditions={
                            "reel_weights": {self.basegame_type: {"BR0": 1}},
                            "force_wincap": False,
                            "force_freegame": False,
                        },
                    ),
                ],
            ),
        ]
