---
id: fl-brmx
title: "Daemon: localhost server, sole writer of task files"
kind: feature
created: 2026-11-17
created_by: external:orchestrator
repos: [flume]
changes: []
specs: []
blocked_by: [fl-w89j]
related: []
parent: fl-danq
---

## The ask

The Flume daemon: a localhost HTTP server that is the only writer of task files and commits them on the main checkout. Child of fl-danq; behaviour in docs/specs/api.md (fl-47b8). Uses the core library from the task-file task.

The human's reason for this design (brief): "Main is moving not because of any code changes, but because of a whole bunch of documentation changes." Agents in any worktree write tasks through the daemon, which commits them on the main checkout, so task edits never ride along in feature branches.

Build in `src/daemon/`:

- HTTP on 127.0.0.1, port chosen at start; write a port file (where: follow the spec; a dot-dir in the main checkout is the default) so the CLI finds it; an env var override for the URL.
- Endpoints for tasks: create (mints the ID), show, list (filters: state, kind, parent), update fields, add a note (appends to the body), close, reopen. Each write updates the file and makes one git commit on the main checkout with a clear message. Serialize writes (one at a time).
- `flume serve` (foreground), `flume status`, `flume stop`.
- Run from any worktree of the repo: the daemon resolves the main checkout (git worktree list / common dir).

Out of scope: the CLI task commands (next task; a small client helper is fine), auth beyond localhost, multi-project, the roadmap.

Verify: `npm run check` green; integration tests start the daemon on a temp git repo, create/update/close a task over HTTP, and assert the file and the commit; a second worktree reaches the same daemon.

Model: Sonnet. Touches: src/daemon/*, src/cli/ (serve/status/stop), test/*.
