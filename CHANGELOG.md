# Changelog

## Unreleased

### Added

- `flume bug` prints a paste-ready bug-report template with the version line; release and update steps in docs/release.md; specs in design/specs/releases.md (fl-jc84).

### Internal

- Behaviour spec for the web UI: board, task detail, roadmap (design/specs/ui.md, fl-8g3q).
- Behaviour specs for the task file format, `flume check`, the CLI and the daemon API (design/specs/, fl-47b8).
- Scaffold the TypeScript on Node project: flume bin (help, version), vitest, biome, strict tsconfig, `npm run check` / `just check` (fl-4r5q).
- Record the stack decision: TypeScript on Node, Go as the alternative (docs/design/stack.md).
