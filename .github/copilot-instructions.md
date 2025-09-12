# AI guidance — PocketMon Genesis

Scope
- HTML5 + PixiJS grid game: 7x7 cluster pays, tumbles, per-cell multipliers, and three features (Poké Hunt, Free Spins, Battle Arena).
- Keep game math deterministic, separate from rendering; 60fps target.

Architecture (what matters)
- Engine (pure): 7x7 grid, 4-way clusters (no diagonals), tumble = remove wins → drop → refill. Cell multipliers double per hit on same cell (x1→x2→x4→… up to x8,192). Win = base symbol value × product of involved cell multipliers.
- Evolution (Egg): If Egg adjacent to a win, evolve 4x Tier1 → Tier2, then (if 4+) Tier2 → Tier3 after tumbles. Evolved symbols inherit cell multipliers. Each step adds +1 global evolution multiplier (max +3 per chain).
- Random event: Team Rocket (≈1/200 non-winning spins) locks 3–5 symbols; rescuing via adjacent wins converts them to Wild x2.
- Features (own state + RNG stream):
  - Poké Hunt: 3x1 reel per throw; weights 50/30/15/5% for 10x/25x/50x/100x; Catch Combo up to x5; occasional Sneak Peek shows one symbol.
  - Free Spins: 10/12/15/20 spins for 4/5/6/7 scatters; cell multipliers persist and keep doubling; retrigger (3+) = +5 spins and +1 to all multipliers.
  - Battle Arena: Boss HP 500x/750x/1000x; reel: Attack 60%=5x dmg, Power 25%=20x, Special 10%=x3 next 2, Potion 5%=+2 turns; KO wins jackpot; else pay total damage; optional 2x gamble.

Data contracts (stabilize these)
- spin(bet) → { grid: 7x7 symbols, events: [wins,tumbles,raid,evolution,...], multiplierMap: 7x7 ints, uiHints }.
- triggerBonus(type) → initial bonus payload; subsequent steps are deterministic from a seed.
- Symbol: { id, tier:1–5, kind:'standard'|'wild'|'scatter'|'egg'|'trainer' }.
- RNG: independent streams per subsystem (base, hunt, arena, freespins). Never tie animation timing to RNG stepping.

State, events, and flow
- Finite states: Base ↔ (Hunt | FreeSpins | Arena); serialize/restore mid-feature.
- Engine emits typed events: 'win', 'tumbleStart/End', 'cellMultiplierUp', 'evolutionStep', 'raidStart/Resolve', 'featureEnter/Step/End'. UI subscribes; math remains side-effect free.

Conventions & anchors
- Connectivity: 4-way; no diagonals.
- Paytable anchors: Tier3 12-cluster ≈ 30x; Tier5 top ≈ 2,000x.
- Caps: Hunt ≤ 500x (100x × x5); Arena jackpots 500x/750x/1000x (+ optional 2x gamble).

Project layout (expected)
- src/js/engine/: cluster, tumble, multipliers, evolution, RNG
- src/js/features/: hunt/, freespins/, arena/
- src/js/ui/: frame, controls, HUD, paytable
- assets/: symbols/, animations/, sounds/, backgrounds/
- config.json: bet levels, symbol/feature weights (no hardcoding)

Dev workflow (confirm and keep consistent)
- Build/run: if using Vite, npm run dev | npm run build. If absent, bootstrap with Vite and keep config in config.json.
- Tests: snapshot tests for cluster detection, tumble order, multiplier doubling/cap, evolution chaining, feature weight distributions.

Agent-ready backlog (start here)
1) Engine: implement 4-way cluster detection and tumble with multiplier doubling + cap.
2) Evolution: Egg-adjacent scan → evolve chain with inheritance + global evo multiplier.
3) RNG: split streams (base/hunt/arena/freespins) and seed pluggably.
4) Features: implement Hunt → FreeSpins → Arena math/state in isolation; then wire UI.
5) UI: Pokedex frame + HUD; feature UIs (throws/HP/combo counters).

Open confirmations needed
- package.json tooling (Vite/Webpack/Parcel) and npm scripts.
- Current directory structure (engine/features/ui) and any existing modules.
- Backend provably-fair seed ingress/egress shape.
