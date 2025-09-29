Add/expand tests across the engine to align TS with Python behavior and improve coverage:

- spin determinism/contract, grid, multipliers, cluster, evolution, morphing
- tumble basics and cascade path
- ways: left-to-right, maxWays capping, and right-to-left path
- rtpOptimizer helpers: adjustPaytables, classifyVolatility, calculateHitFrequency

Additional:
- Add Windows Dev Containers troubleshooting to CONTRIBUTING
- No runtime/engine changes in this PR; tests-only
- CI and local checks: format, markdownlint, typecheck, build, tests+coverage, quick sims all pass

Coverage (v8) snapshot:
- All files: 59.66% stmts/lines, 84.18% branches, 67.27% functions
- ways.ts: 60.45% stmts, 85.36% branches (RTL path now covered)

How to verify locally:
1) npm ci
2) npm run ci:local
