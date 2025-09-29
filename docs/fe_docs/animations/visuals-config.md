# Visuals configuration and presets

This game’s visuals are fully gated by config flags to keep tests deterministic
and allow performance tuning on low-end devices. All flags live under
`config.engine.visuals` and are read by `GameController.isVisualEnabled()`.

## Flags

- enableReelSpin: Toggle the basic reel spin animation played at spin start.
- enableClusterCelebrate: Show celebratory particles on cluster wins.
- enableMegaWinCelebration: Big cinematic for mega wins.
- enableEvolutionAnimation: Evolve sequences for species upgrades.
- enableMorphingFX: Light FX when symbols morph.
- enableCascadeFX: Cascade/tumble trail particles per cascade step.
- enableScatterPulse: Light pulse when scatters land.
- enableFsEntrance: Entrance animation on Free Spins trigger.
- enableScatterAnticipation: Near-miss anticipation when exactly two scatters land.

If a flag is missing, the default behavior is enabled.

## Particle scaling

Visual particle counts and durations scale globally via
`config.engine.visuals.particleDensity` in range [0.25, 1.25]. The
`AnimationEngine` uses helper functions to scale counts and durations
consistently.

Recommended presets:

- Low: particleDensity = 0.5 — Battery saver, minimal particles.
- Medium: particleDensity = 0.8 — Balanced default.
- High: particleDensity = 1.0 — Rich effects on most desktops.
- Ultra: particleDensity = 1.15 — Showcase mode; may impact FPS on laptops.

## Example

```json
{
  "engine": {
    "visuals": {
      "enableReelSpin": true,
      "enableClusterCelebrate": true,
      "enableMegaWinCelebration": true,
      "enableEvolutionAnimation": true,
      "enableMorphingFX": true,
      "enableCascadeFX": true,
      "enableScatterPulse": true,
      "enableFsEntrance": true,
      "enableScatterAnticipation": true,
      "particleDensity": 0.8
    }
  }
}
```
