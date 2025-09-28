# Cluster Pays

Cluster games award wins when there are sufficiently many neighboring like-symbols. Neighbours must share the same reel or row, where diagonal connections do not count towards the cluster size. A minimum of 5 like-symbols is typical, though this can be defined in `GameConfig` class. Since it is possible for up to `num_rows * num_columns` winning symbols to occur, it is common to define a particular payout range. For example `5 kind` pays `p1` `6-7 kind` to pay `p2`, `8-10 kind` to pay `p3` and `12+` symbols pay `p4` etc... Instead of manually including all possible pay combinations in `config.paytable` there is a `convert_range_table()` function in the Config class which takes in a symbol range, name and payout amount which is used to generate all `config.paytable` entries. This pay group should be of the format:

```python
    paygroup = {
        ((min_combination[int], max_combination[int]), name[str]) : payout[float],
        ...
    }

```

Ranges defined in `min_combination` and `max_combination` are inclusive, so for example if the `5-kind` payout for symbol `H1` pays `10x`, this would be written as: `((5,5),H1): 10`.

Often (though not always) cluster pays games include a tumbling mechanic. Within the [cluster sample game](../sample_section/sample_games.md) for example, while there are still winning combinations, the board is tumbled, wins are evaluated for the new board, the wallet manager is updated and relevant events are emitted:

```python
    while self.win_data["totalWin"] > 0 and not (self.wincap_triggered):
        self.tumble_game_board()
        self.win_data = self.get_cluster_data(record_wins=True)
        self.win_manager.update_spinwin(self.win_data["totalWin"])
        self.emit_tumble_win_events()
```

Clusters are found using a Breath First Search (BFS) algorithm. Wild attributes can be set (`wild` is the default value). Wild symbols can contribute to multiple clusters, including those formed by different symbols.
