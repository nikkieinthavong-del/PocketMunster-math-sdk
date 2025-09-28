# Sample Games

There are 4 example games included to showcase different win-types and mechanics. All games have a basegame mode (all 1x bet cost) and 1 freegame mode.
The expanding wilds game additionally has a _superspin_ mode to showcase how prize-values are handled.

Each game-type has a _readme.txt_ file with a brief description of game-rules (copied below).

## Lines Games

This is an example of a simple lines-game-win

Wilds have multipliers in the freeGame and have the effect of multiplying a given line win the addition multiplier values attached to Wild symbols,
only when the multiplier value is > 1.

#### Basegame:

Scatter Symbols appear on all reels, a minimum of 3 Scatters are needed to trigger the Freegame

#### FreeGame:

A seperate reelset is used for the freegame
Wilds have larger multipliers in the freegame (minimum of 2x) and appear on all reels
2 Scatters are needed to trigger extra spins, appearing only on reels 2,3,4

Notes:
Wilds only pay on 5-Kind. If the paytable is chosen such that 3/4 Kind Wilds pay, the line
calculation will assign the highest base-win symbols as winning. For example if there is a 3-Kind
Wild is on the same line as a 5-Kind L4, the 3-Kind wild will be chosen, regardless of the multiplier
on the final Wild since the base payout 3W > 5L4

## Ways Game

Standard ways game with 5-reels and 3-rows.

- 9 paying symbols (H1-H5, L1-L4)
- 1 wild type of Wild symbol
- 1 type of Scatter symbol
- Multipliers on Wilds (in freegame only)
- Wilds do not appear on 1st reel

#### Basegame

Minimum of 3 Scatter symbols are needed to enter the freegame. Maximum of 1 Scatter per reel.

#### Freegame rules

Wild symbols have multipliers ranging from 1x to 5x. Multiplier values compound multiplicatively (unlike lines games where multiplier values add)

## Cluster-based win game

Clusters of 5 or more like-symbols are removed from the board, and symbols above on the reelstrip
fall to fill their place.

#### Basegame:

Standard tumbling game with Scatter and Wild symbols.
Minimum of 4 Scatter symbols are required for freeSpin triggers

#### Freegame:

Same basegame rule, except grid positions have multipliers. Grid positions start in a 'deactivated' state. Once one win occurs,
the position is 'activated' starting with a 1x multiplier - for every winning cluster, the multiplier value at that position is doubled (up to 512x)
There is a global multiplier, which increases by +1 for every freespin and does not reset on each spin
A minimum of 3 scatters are required for re-triggers

#### Notes:

Because of the separation between basegame and freegame types - there is an additional freespin entry check to check of the criteria requires a forced
freespin condition. Otherwise, occurrences of Scatter symbols tumbling onto the board during basegame criteria may appear.

## Scatter-Pays Game

#### Summary:

- A 6-reel, 5-row pay-anywhere tumbling (cascading) game.
- 8 paying total (4 high, 4 low)
- 2 special symbols (wild, scatter)

Symbols payouts are grouped by cluster-sizes (8-8), (9-10), (11,13), (14,36)

#### Basegame:

Minimum of 3 Scatter symbols needed for freegame trigger.
2 freegame spins are awarded for each Scatter.

#### Freegame rules

Every tumble increments the global multiplier by +1, which is persistent throughout the freegame
The global multiplier is applied to the tumble win as they are removed from the board
After all tumbles have completed: multiply the cumulative tumble win by multipliers on board
(multipliers on board do not increment the global mult)
If there is a multiplier symbol on the board, this is added to the global multiplier before the final evaluation

#### Notes

Due to the potential for symbols to tumble into the active board area, there is no upper limit on the number of freegame that can be awarded.
The total number of freegame is 2 \* (number of Scatters on board). To account for this the usual 'updateTotalFreeSpinAmount' function is overridden
in the game_executables.py file.

#### Event descriptions

"winInfo" Summarizes winning combinations. Includes multipliers, symbol positions, payInfo [passed for every tumble event]
"tumbleBanner" includes values from the cumulative tumble, with global mult applied
"setWin" this the result for the entire spin (from on Reveal to the next). Applied after board has stopped tumbling
"seTotalWin" the cumulative win for a round. In the base-game this will be equal to the setWin, but in the bonus it will incrementally increase

## Expanding Wilds Lines + Superspin mode

- 5-reel, 5-rows
- 15 paylines
- 9 paying symbols
- 1 type of Wild
- 1 type of scatter

Superspin mode, costing 25x. This mode is independent, with no freegame entry.

- 1 _dead_ symbol (1)
- 1 _prize_ symbol

#### basegame

Standard lines games rules with Wilds paying on 3, 4 and 5-kind

#### freegame

1 Wild can initially appear on each reel. Symbol then expands out to fill all active rows. Expanded symbol is sticky and persistent for all remaining freegame spins.
On each new reveal a random multiplier ranging from 2x - 50x is assigned.
No retriggers in freegame.

#### superspin

This is a _hold em'_ style game.
The player can purchase a spin for 25x, and starts with 3 _lives_
Each time a prize symbol lands on the board, the 3 available spins reset.
Prizes are sticky and evaluated once the player has no new spins remaining.

This game has a purchase-only 'super-spin' mode. This mode can only be activated through a buy menu and cannot be accessed using Scatters like bonus-games
