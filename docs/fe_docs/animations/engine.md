# Animation Engine

## Overview

- Purpose and contract with game controller
- Inputs: events, board state, timings
- Outputs: frame updates, DOM/canvas mutations, callbacks

## Lifecycle

- init() and resources
- mount(canvas) and resize
- play(sequence) and queue
- pause/resume/skip
- destroy()

## Timing & Easing

- Tick loop (requestAnimationFrame)
- Global time vs local timelines
- Easing presets

## Performance

- Batching draw calls
- Asset atlases & preloading
- Avoiding layout thrash
