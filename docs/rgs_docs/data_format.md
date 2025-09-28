# Math verification

When uploading static math files to the RGS, Stake Engine will carry out preliminary checks to ensure ensure game-logic is of the expected format. The corresponding payout multipliers and probabilities are analyzed as a means of providing a quick summary of game statistics on the backend.

## Minimum file requirements

For a game with one game-mode, there will be 3 files required for the Math to be published successfully.

- Index file (must be called **\*index.json** and contain the mode name, cost multiplier and logic/CSV filenames)
- Lookup table (CSV file, with each line containing ID, Probability, Payout)
- Game logic (zStandard compressed JSON-lines (\_\_.jsonl.zst))

## Index file format

When selecting a directory to upload from for the Stake Engine math there must exist a JSON-encoded file called **_index.json_** with the strictly enforced form:

```json
{
    "modes": [
        {
            "name": <string>,
            "cost": <float>,
            "events": <string>"<logic_file>.jsonl.zst",
            "weights": <string>"<lookup_table>.csv"
        },
        ...
    ]
}
```

For example, for a game with 2-modes:

```json
{
  "modes": [
    {
      "name": "base",
      "cost": 1.0,
      "events": "books_base.jsonl.zst",
      "weights": "lookUpTable_base_0.csv"
    },
    {
      "name": "bonus",
      "cost": 100.0,
      "events": "books_bonus.jsonl.zst",
      "weights": "lookUpTable_bonus_0.csv"
    }
  ]
}
```

## CSV format

When calculating various statistical values on the RGS side, it is much more efficient and robust to work with unsigned integer values (since no payouts or probabilities will ever be negative). This avoids misinterpreting values due to rounding or floating-point errors. For every game-round uploded within the game-logic there must a summary CSV table containing rows of `uint64` values. We require the payoutMuliplier value in the third column to exactly match those provided in the game-logic file. There values are extracted and hashed to ensure identical `payoutMultiplier` values.

```csv
    simulation number, round probability, payout multiplier
```

For example:

```csv
1,199895486317,0
2,25668581149,20
3,126752606,140
...
```

## Game logic format

Round information returned through the **_/play_** API corresponds to a single simulation outcome returned in JSON format. For efficiency, we require this data to be stored in compressed **_.jsonl_** format. Currently zStandard (.zst) encoding must be used, though this will be expanded upon in the near future. In order to identify simulation IDs, payouts and logic we enforce the condition that every simulation contains the key fields:

```json
    "id": <int>,
    "events" <list<dict>>,
    "payoutMultiplier": <int>
```

For example, at a minimum the game round, printed to **_jsonl_** before compression will have the format:

```json
{
    "id": 1,
    "events": [{}, ...],
    "payoutMultiplier": 1150
}
```

Where the payoutMultiplier value corresponds to an 11.5x payout for a base game round (costing 1.0x). **The three JSON key fields: id, events, payoutMultipler are required for every round returned.**
