+++
id = "fl-w89j"
title = "Task-file core library and flume check"
kind = "feature"
state = "claimed"
created_at = "2026-11-17T04:10:37.444Z"
updated_at = "2026-11-17T04:38:17.897093573Z"
created_by = "external:orchestrator"
watchers = [
    "external:orchestrator",
    "agent:core",
]
ticket = "w89j"
+++

## The ask

The core task-file library and `flume check`: read, write and validate Flume's task files, with no daemon yet. Child of fl-danq; design in the epic's body and in the task-file specs (fl-47b8), which this implements and is checked against.

Build in `src/core/`:

- Folders `flume/tasks/open/` and `flume/tasks/resolved/` at the repo root; file names `<slug>-<id>.md`, slug from the title, capped at 50 characters (a constant, easy to change).
- IDs: 4 characters from `abcdefghjkmnpqrstuvwxyz23456789`, random, never reused (check both folders), `xxxx` reserved. A function to mint one; the daemon will call it later. Bare IDs accepted anywhere a task is named.
- Front matter (YAML): id, title, kind, created, parent, blocked_by, related, resolved. Kinds: feature, bug, chore, docs, research, epic. Parse and serialize round-trip without reordering or losing the Markdown body.
- Links to tasks are wiki links by full file stem; resolve a bare ID or a stem to a file.
- `flume check`: validates every task file (front matter fields and kinds, ID format and uniqueness, file name matches id and slug rule, open/resolved folder matches `resolved`, blocked_by/parent/related point at existing tasks, no dependency cycles). Reads files directly (validation only; writing stays with the daemon). Non-zero exit and one line per problem.

Out of scope: the daemon, any command that writes files, multi-project (`-p`), the roadmap.

Verify: `npm run check` green; unit tests cover ID minting, slugging, round-trip, and each `flume check` rule with a failing fixture; `bridle spec coverage` lists no task-file or `flume check` scenario as missing.


Specs and tests (the human, 2026-11-16 ~11:20 PM, via advisor: "use bridle specs and write tests for them"): the specs are bridle capability spec files from fl-47b8. Every executable scenario this ticket implements gets a test that names its scenario ID, so `bridle spec coverage` lists none of them as missing. If a behaviour you build has no scenario yet, add one (EARS requirement + Given/When/Then, observable behaviour only) and run `bridle spec id` and `bridle spec check`.

Model: Sonnet. Touches: src/core/*, src/cli/ (check command only), test/*.

## Thread

### note · external:orchestrator · 2026-11-17T04:10:52.406Z
readied by external:orchestrator

### note · external:orchestrator · 2026-11-17T04:10:52.423Z
Readied by human via orchestrator. The human, 2026-11-16 ~11:10 PM (orchestrator session): "the work is progressing, please help by approving and readying tickets over night and handling any admin tasks that need done". Child of fl-danq, split by orchestrator (acting PM; flume has no PM).
