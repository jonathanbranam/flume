---
id: fl-yt5q
title: flume task CLI commands
kind: feature
created: 2026-11-17
created_by: external:orchestrator
repos: [flume]
changes: []
specs: []
blocked_by: []
related: []
---

## The ask

The `flume task` CLI commands, talking to the daemon: `flume task new|show|list|update|note|close|reopen`. Child of fl-danq; behaviour in docs/specs/cli.md (fl-47b8).

- The CLI finds the daemon by the port file or env var and touches no task files itself. A clear error, with the fix (`flume serve`), when no daemon answers.
- Output: human-readable by default, `--json` for agents. Bare IDs accepted.
- `new` takes title, kind, and optional parent/blocked_by/related and a body (flag, file or stdin). `note` appends text (flag, file or stdin).
- `--help` for every command lists its options.

Out of scope: multi-project (`-p`), the roadmap, the UI.

Verify: `npm run check` green; end-to-end tests run the CLI against a daemon on a temp repo for every command, from the main checkout and from a second worktree; every requirement in docs/specs/cli.md for these commands has a test or is noted.

Model: Sonnet (Haiku is too light for the end-to-end tests). Touches: src/cli/*, test/*.
