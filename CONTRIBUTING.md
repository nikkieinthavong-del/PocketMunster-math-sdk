# Contributing

Thanks for taking the time to contribute!

## Getting started

- Prereqs: Node 20.x, npm 10.x, Python 3.12 (for math-side work)
- Install deps:
  - Node: `npm ci`
  - Python: see `README.md` (Makefile targets available)
- Recommended VS Code extensions: Prettier and markdownlint

## Useful scripts

- Type check: `npm run typecheck`
- Build demo runtime: `npm run build:demo`
- Tests: `npm test` (or `npm run test:watch`)
- Quick sim: `npm run simulate -- --spins=200`
- Bonus sim: `npm run simulate:bonus -- --spins=20000`
- Calibrate RTP: `npm run calibrate:total` (or `:big`, `:1m`)

## Formatting and linting

- Prettier is the source of truth. Run `npm run format` to format the repo.
- CI runs a scoped `format:check` and `lint:md` against README to keep noise low.
- Pre-commit: Husky + lint-staged formats staged files and runs markdownlint on README.

## Pull requests

- Branch from `main`; use a descriptive name: `feat/...`, `fix/...`, or `chore/...`.
- Keep commits focused and include a clear message.
- Ensure the following run locally before pushing:
  - `npm run typecheck`
  - `npm test`
  - A quick sim (`npm run simulate -- --spins=200`)
- Open a PR and confirm CI is green.

## Style and EOLs

- `.editorconfig` enforces 2-space indent (4 for Python) and LF line endings.
- `.gitattributes` normalizes LF for text and marks binary assets.

## Docs

- MkDocs lives in `docs/`. Large lint/format sweeps should be separated into their own PR to reduce noise.

## Questions

Open a discussion or PR comment and we’ll help unblock you.
