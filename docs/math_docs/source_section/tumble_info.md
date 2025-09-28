## Tumbling boards

The `Tumble` class inherits `Board` and handles removing winning symbols from `self.board` and filling vacant positions with symbols which appear directly above winning positions using the properties `reel_positions` and `reelstrip_id`. Examples of applications surrounding tumbling (cascading) events can be found in the `0_0_cluster` and `0_0_scatter` sample games.

The win evaluation functions for the cluster and scatter win-types assign the property `explode = True` to winning symbol objects. A new board is select by scanning the current `self.board` object reel-by-reel and counting the number of symbols which satisfy `sym.check_attribute("explode")`. This same number of symbols is then appended, counting backwards from the initial `self.reel_positions` values. If padding symbols are used, the symbol stored in `top_symbols` will be used to fill the first vacated position.
