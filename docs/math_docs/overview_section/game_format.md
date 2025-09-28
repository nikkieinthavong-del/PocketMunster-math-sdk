# Standard Game Setup Requirements

Without diving into specific functions, this section is intended to walkthrough how a new slot game would generally be setup. In practice it is recommended to start with one of the sample games which closest resemble the game being made, or otherwise starting from the [template](../sample_section/sample_games.md).

## Configuration file

Game parameters should all be set in the `GameConfig` `__init__()` function. This is where to set the name name, RTP, board dimensions, payouts, reels and various special symbol actions. All required fields are listed in the `Config` class and should be filed out explicitly for each new game.
Next the `BetMode` classes are defined. Generally there would be at a minimum a (default) `base` game and a `freegame`, which is usually purchased.

```python
class GameConfig(Config):
    def __init__(self):
        super().__init__()
        self.game_id = ""
        self.provider_number = 0
        self.working_name = ""
        self.wincap = 0
        self.win_type = "lines"
        self.rtp = 0

        self.num_reels = 0
        self.num_rows = [0] * self.num_reels
        self.paytable = {
            (kind, symbol): payout,
        }

        self.include_padding = True
        self.special_symbols = {"property": ["sym_name"],...}

        self.freespin_triggers = {
        }
        self.reels = {}
        self.bet_modes = []
```

Each `BetMode` should likewise be set explicitly, defining the cost, rtp maximum win amounts and various gametype flags. We would like to define different win criteria within each betmode. In the sample games we define distinct criteria for any game-aspects where we would like to control either the hit-rate and/or RTP allocation. In this example we would like to control the basegame hit-rate, max-win hit-rate and freegame hit-rate. Therefore we need to specify unique `Distribution` criteria for each of these special conditions. Further information about purpose of Distribution conditions can be found [here](../gamestate_section/repeat_info.md) and [here](../gamestate_section/configuration_section/betmode_dist.md)

```python
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
                criteria="winCap",
                quota=0.001,
                win_criteria=self.wincap,
                conditions={
                    "reel_weights": {
                        self.basegame_type: {"BR0": 1},
                        self.freegame_type: {"FR0": 1},
                    },
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
                },
            ),
            Distribution(
                criteria="basegame",
                quota=0.5,
                conditions={
                    "reel_weights": {self.basegame_type: {"BR0": 1}},
                },
            ),
        ],
    )
```

## Gamestate file

When any simulation is run, the entry point will be the `run_spin()` function, which lives in the `GameState` class. `GameExecutables` and `GameCalculations` are child classes of `GameState` and also deal with game specific logic.

The generic structure would follow the format:

```python
def run_spin(self, sim):
    self.reset_seed(sim) #seed the RNG with the simulation number
    self.repeat = True
    while self.repeat:
        self.reset_book() #reset local variables
        self.draw_board() #rraw board from reelstrips

        #evaluate win_data
        #update win_manager
        #emit relevant events

        self.win_manager.update_gametype_wins(self.gametype) #update cumulative basegame wins
        if self.check_fs_condition(): #check scatter conditions
            self.run_freespin_from_base() #run freegame

        self.evaluate_finalwin()
        self.check_repeat() #Verify betmode distribution conditions are satisfied

    self.imprint_wins() #save simulation result
```

For reproducibility the RNG is seeded with the simulation number. Betmode distribution criteria are preassigned to each simulation number, requiring the `self.repeat` condition to be initially set until the spin has completed and it can be checked that any criteria-specific conditions or win amounts are satisfied. Note that `self.repeat = False` is set in the `self.reset_book()` function. This function will reset all relevant `GameState` properties to default values.

Generally the first steps will be to use the reelstrips provided in the configuration file to draw a board from randomly chosen reelstop positions. Wins are evaluated from one of the provided win-types for the active board, and the wallet manager is updated. After this game-logic is completed the relevant events (such as `reveal` and `winInfo`) are emitted. All sample games follow these three steps:

1. Calculate current state of the board
2. Update wallet manager
3. Emit events

To keep track of which gametype wins are allocated, the wallet manger is again invoked once all basegame actions are complete. If the game have a freegame mode and the triggering conditions are satisfied the `run_freespin()` function is invoked. This mode will have a similar structure:

```python
def run_freespin(self):
    self.reset_fs_spin() #reset freegame variables
    while self.fs < self.tot_fs: #account for multiple freegame spins
        self.update_freespin() #update spin number and emit event
        self.draw_board() #draw a new board using freegame reelstrips

        #evaluate win_data
        #update win_manager
        #emit relevant events

        if self.check_fs_condition(): #check retrigger conditions
            self.update_fs_retrigger_amt()

        self.win_manager.update_gametype_wins(self.gametype) #update cumulative freegame win amounts

    self.end_freespin() #emit event to indicate end of freegame

```

While it is possible to perform all game actions within these functions, for clarity functions from `GameExecutables` and `GameCalculations` are typically invoked and should be created on a game-by-game basis depending on requirements.

## Runfile

Finally to produce simulations, the `run.py` file is used to create simulation outputs and config files containing game and simulation details.

```python
if __name__ == "__main__":

    num_threads = 1
    rust_threaeds = 20
    batching_size = 50000
    compression = False
    profiling = False

    num_sim_args = {
        "base": int(10),
        "bonus": int(10),
    }

    config = GameConfig()
    gamestate = GameState(config)

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

```

The `create_books` function handles the allocation of win criteria to simulation numbers, output file format and multi-threading parameters.

## Outputs

Simulation outputs are placed in the `game/library/` folder. `books/books_compressed` is the primary data-file containing all events and payout multipliers. `lookup_tables` hold the summary simulation-payout values in `.csv` format which is consumed by the optimization algorithm. Additionally for game analysis, lookup table mapping of which simulations belong to which win criteria and which gametype wins arise from are produced. `force/` file outputs contain all information used by the `.record()` function, which is again useful for analyzing the frequency and average win amounts for specific events. The optimization algorithm also uses the recorded `force` data to identify which simulations correspond to specific win criteria. Finally `config/` files contain information required by the frontend such as symbol and betmode information, backend information such as file hash values and a configuration file for the optimization algorithm.

The optimization algorithm consumes the lookup table and outputs a copy of the file, but with modified weights. To assist with setting optimization parameters, there are two other files with the prefix `lookUpTableIdToCriteria` and `lookUpTableSegmented`. These files are used to identify which bet-mode sub-type that specific simulation number belongs to (such as max-wins, 0-wins, freegame entry etc..), and what gametype (usually basegame or freegame) contributes to the final payout multiplier.
