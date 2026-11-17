---
id: fl-4r5q
title: Scaffold the TypeScript project and check command
kind: chore
created: 2026-11-17
created_by: external:orchestrator
repos: [flume]
changes: []
specs: []
blocked_by: []
related: []
---

## The ask

Set up Flume's TypeScript on Node project so every later task has a build, tests and one check command. Child of fl-danq (epic: tasks first). Stack: fl-28pa (TypeScript on Node).

The human, 2026-11-16: "let's see how much can get built while I sleep" (relayed by the flume advisor; the epic was readied on it).

What to build:

- `package.json`, `tsconfig.json` (strict), Node LTS, ESM. Test runner: vitest. Lint/format: keep it small (eslint or biome, one tool).
- Layout: `src/cli/` (the `flume` CLI entry), `src/core/` (task files, IDs, no I/O to the network), `src/daemon/` (empty placeholder is fine), `test/`.
- A `flume` bin with `flume --help` and `flume version` (prints the package version and the git commit; fl-jc84 builds on this).
- One check command: `npm run check` = typecheck + lint + tests. Add a `justfile` only if trivial (`just check` -> `npm run check`).
- Set bridle's commands in `.bridle/config.toml`: `[commands] check`, `[integration] check` (the same command) and `[worktrees] setup = "npm ci"`. Commit `package-lock.json`.
- README: one short "Develop" section (install, check, run).

Out of scope: any task-file logic (next tasks), the daemon, the UI.

Verify: `npm ci && npm run check` passes on a fresh clone; `node` runs `flume version` and prints a version and commit.

Model: Sonnet (sets the conventions every later task follows). Touches: package.json, package-lock.json, tsconfig.json, lint config, src/cli/*, test/*, justfile, README.md, .bridle/config.toml.
