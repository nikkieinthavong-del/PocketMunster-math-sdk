# Config class object

The game-specific configuration `GameConfig` inherits the `Config` super class. This contains all game specifications, many of which will be set manually for each new game within `GameConfig`. `Config` allows for setting custom `win_levels`, which are returned during win-events and can indicate the type of animation which needs to be played. Additionally the class sets up several path destinations used for writing files and functions to read in and verify reelstrips stored in the `.csv` format.
