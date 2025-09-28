All valid bet-modes are defined in the array `self.bet_modes = [ ...]`
The `BetMode` class is an important configuration for when setting up game the behavior of a game.This class is used to set maximum win amounts, RTP, bet cost, and distribution conditions. Additional noteworthy tags are:

1. `auto_close_disabled`
   - When this flag is `False` (default) the RGS endpoint API `/endround` is called automatically to close out the bet for efficiency. When the bet is closed however, the player cannot resume their bet. It may be desirable in bonus modes for example, to set this flag to `True` so that the player can resume interrupted play even if the payout is `0`. This means that the front-end will have to manually close out the bet in this instance.
2. `is_feature`
   - When this flag is true, it tells the frontend to preserve the current bet-mode without the need for player interaction. So if the player changes to `alt_mode` where this mode has `is_feature = True`, every time the spin/bet button is pressed, it will call the last selected bet-mode. Unlike in bonus games, where the player needs to confirm the bet-mode choice after each round completion.
3. `is_buybonus`
   - This is a flag used for the frontend framework to determine if the mode has been purchased directly (and hence may require a change in assets).

For example, the BetMode class for a bonus/buy feature is taken from the sample **_lines_** game:

```python
    BetMode(
        name="bonus",
        cost=100.0,
        rtp=self.rtp,
        max_win=self.wincap,
        auto_close_disabled=False,
        is_feature=False,
        is_buybonus=True,
        distributions=[
            Distribution(
                criteria="wincap",
                quota=0.001,
                win_criteria=self.wincap,
                conditions={
                    "reel_weights": {
                        self.basegame_type: {"BR0": 1},
                        self.freegame_type: {"FR0": 1, "WCAP": 5},
                    },
                    "mult_values": {
                        self.basegame_type: {1: 1},
                        self.freegame_type: {2: 10, 3: 20, 4: 50, 5: 60, 10: 100, 20: 90, 50: 50},
                    },
                    "scatter_triggers": {4: 1, 5: 2},
                    "force_wincap": True,
                    "force_freegame": True,
                },
            ),
            Distribution(
                criteria="freegame",
                quota=0.999,
                conditions={
                    "reel_weights": {
                        self.basegame_type: {"BR0": 1},
                        self.freegame_type: {"FR0": 1},
                    },
                    "scatter_triggers": {3: 20, 4: 10, 5: 2},
                    "mult_values": {
                        self.basegame_type: {1: 1},
                        self.freegame_type: {2: 100, 3: 80, 4: 50, 5: 20, 10: 10, 20: 5, 50: 1},
                    },
                    "force_wincap": False,
                    "force_freegame": True,
                },
            ),
        ],
    ),
```
