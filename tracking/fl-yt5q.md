+++
id = "fl-yt5q"
title = "flume task CLI commands"
kind = "feature"
state = "open"
created_at = "2026-11-17T04:10:37.494Z"
updated_at = "2026-11-17T04:12:32.200063813Z"
created_by = "external:orchestrator"
watchers = ["external:orchestrator"]
ticket = "yt5q"
+++

## The ask

The `flume task` CLI commands, talking to the daemon: `flume task new|show|list|update|note|close|reopen`. Child of fl-danq; behaviour in the CLI specs (fl-47b8).

- The CLI finds the daemon by the port file or env var and touches no task files itself. A clear error, with the fix (`flume serve`), when no daemon answers.
- Output: human-readable by default, `--json` for agents. Bare IDs accepted.
- `new` takes title, kind, and optional parent/blocked_by/related and a body (flag, file or stdin). `note` appends text (flag, file or stdin).
- `--help` for every command lists its options.

Out of scope: multi-project (`-p`), the roadmap, the UI.

Verify: `npm run check` green; end-to-end tests run the CLI against a daemon on a temp repo for every command, from the main checkout and from a second worktree; `bridle spec coverage` lists no scenario for these commands as missing.


Specs and tests (the human, 2026-11-16 ~11:20 PM, via advisor: "use bridle specs and write tests for them"): the specs are bridle capability spec files from fl-47b8. Every executable scenario this ticket implements gets a test that names its scenario ID, so `bridle spec coverage` lists none of them as missing. If a behaviour you build has no scenario yet, add one (EARS requirement + Given/When/Then, observable behaviour only) and run `bridle spec id` and `bridle spec check`.

Model: Sonnet (Haiku is too light for the end-to-end tests). Touches: src/cli/*, test/*.

## Thread

### note · external:orchestrator · 2026-11-17T04:10:52.474Z
readied by external:orchestrator

### note · external:orchestrator · 2026-11-17T04:10:52.489Z
Readied by human via orchestrator. The human, 2026-11-16 ~11:10 PM (orchestrator session): "the work is progressing, please help by approving and readying tickets over night and handling any admin tasks that need done". Child of fl-danq, split by orchestrator (acting PM; flume has no PM).
