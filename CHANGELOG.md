# Changelog

## Unreleased

### Added

- `flume roadmap show|check` on `flume/roadmap.md` (Markdown headings plus lists of task wiki links; a Done section holds finished work), `GET /api/roadmap`, and `flume check` runs the roadmap check too; specs in design/specs/roadmap.md (fl-s52x).
- `flume task new|show|list|update|note|close|reopen`: the task CLI, a thin client of the daemon; human output by default, `--json` for agents, bare IDs, `--help` per command, and a clear error naming `flume serve` when no daemon answers. The API task object gains `file` (the stored text) for `show` (fl-yt5q).
- Daemon (src/daemon/): localhost HTTP API for tasks (create, show, list, update, note, close, reopen, check, stop), one git commit per change in the task root, and `flume serve`, `flume status`, `flume stop`; the address is recorded in the repo's shared git folder so any worktree finds it, FLUME_URL overrides (fl-brmx).
- Task-file core library (src/core/: IDs, slugs, front matter round-trip, links, folders) and `flume check`, which prints one line per problem and exits 1 (fl-w89j).
- `flume bug` prints a paste-ready bug-report template with the version line; release and update steps in docs/release.md; specs in design/specs/releases.md (fl-jc84).

### Internal

- Behaviour spec for the web UI: board, task detail, roadmap (design/specs/ui.md, fl-8g3q).
- Behaviour specs for the task file format, `flume check`, the CLI and the daemon API (design/specs/, fl-47b8).
- Scaffold the TypeScript on Node project: flume bin (help, version), vitest, biome, strict tsconfig, `npm run check` / `just check` (fl-4r5q).
- Record the stack decision: TypeScript on Node, Go as the alternative (docs/design/stack.md).
