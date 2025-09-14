Place legally obtained Pokémon 3D model sprites here to use in the UI.

Folder layout:
- assets/pokemon/3d/gen1/...
- assets/pokemon/3d/gen2/...
- ...
- assets/pokemon/3d/gen8/...

Supported file types: .png, .gif, .jpg, .jpeg, .webp

File naming conventions supported:
- Using Pokédex numbers: 001.png, 025.png, 143.png
- Optional suffixes: 025-shiny.png (shiny will be ignored for matching and treated as a variant)
- Using names: pikachu.png, mr-mime.png, nidoran-f.png

How it works:
- The app auto-indexes files at build time via Vite's import.meta.glob.
- Tier → sprite selection uses generation pools by default:
  - Tier 1 → Gen 1
  - Tier 2 → Gen 2
  - Tier 3 → Gen 3
  - Tier 4 → Gen 4 + Gen 5
  - Tier 5 → Gen 6 + Gen 7 + Gen 8
- If a tier pool has no files, the UI falls back to bundled placeholder icons.

Direct symbol mapping (optional):
- You can set a symbol like `pokemon:dex:25` or `pokemon:name:pikachu` in the grid
  and use `getSpriteForSymbol()` to fetch exact sprites. The core grid currently
  uses tier-based symbols (`tier_1`..`tier_5`), so this is optional.

Notes:
- Ensure you have the rights to distribute and use any images you add.
- These assets are not included in the repository by default.
