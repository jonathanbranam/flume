---
id: fl-w89j
title: Task-file core library and flume check
kind: feature
created: 2026-11-17
created_by: external:orchestrator
repos: [flume]
changes: []
specs: []
blocked_by: [fl-4r5q, fl-47b8]
related: []
parent: fl-danq
---

## The ask

The core task-file library and `flume check`: read, write and validate Flume's task files, with no daemon yet. Child of fl-danq; design in the epic's body and in the specs (fl-47b8, `docs/specs/task-files.md`), which this implements and is checked against.

Build in `src/core/`:

- Folders `flume/tasks/open/` and `flume/tasks/resolved/` at the repo root; file names `<slug>-<id>.md`, slug from the title, capped at 50 characters (a constant, easy to change).
- IDs: 4 characters from `abcdefghjkmnpqrstuvwxyz23456789`, random, never reused (check both folders), `xxxx` reserved. A function to mint one; the daemon will call it later. Bare IDs accepted anywhere a task is named.
- Front matter (YAML): id, title, kind, created, parent, blocked_by, related, resolved. Kinds: feature, bug, chore, docs, research, epic. Parse and serialize round-trip without reordering or losing the Markdown body.
- Links to tasks are wiki links by full file stem; resolve a bare ID or a stem to a file.
- `flume check`: validates every task file (front matter fields and kinds, ID format and uniqueness, file name matches id and slug rule, open/resolved folder matches `resolved`, blocked_by/parent/related point at existing tasks, no dependency cycles). Reads files directly (validation only; writing stays with the daemon). Non-zero exit and one line per problem.

Out of scope: the daemon, any command that writes files, multi-project (`-p`), the roadmap.

Verify: `npm run check` green; unit tests cover ID minting, slugging, round-trip, and each `flume check` rule with a failing fixture; every requirement in docs/specs/task-files.md has a test or is noted as not yet covered.

Model: Sonnet. Touches: src/core/*, src/cli/ (check command only), test/*.
