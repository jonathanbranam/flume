+++
id = "fl-yt5q"
title = "flume task CLI commands"
kind = "feature"
state = "integrated"
created_at = "2026-11-17T04:10:37.494Z"
updated_at = "2026-11-17T04:48:21.742964612Z"
created_by = "external:orchestrator"
watchers = [
    "external:orchestrator",
    "agent:task-cli",
]
branch = "bridle/task-cli"
commit = "8e3ea3f88c0a5a645708457ba70fdb9005b0f010"
summary = "Added src/cli/task.ts (flume task new|show|list|update|note|close|reopen) wired in main.ts; thin client over src/daemon/client.ts, no task files touched. Human output by default, --json per command, --help per command, exit 2 usage / 1 refused or no daemon (message names 'flume serve'). Assumptions: (1) show prints a new 'file' field (stored text) added to the API task object (omitted from lists), since the CLI may not read files; api.md updated. (2) Ticket asked for blocked_by/related and a --body flag on new but the spec had only --parent/--body-file: I extended the cli spec (s-5a1c, r-3d7e json, s-0c9d usage); new applies links with a second PATCH call (two commits; if that fails the task exists and the error says so). (3) Unknown update field exits 1 per s-4fd6. (4) note/close/reopen/update print nothing in human mode. Tests: test/task-cli.test.ts, real 'flume serve' processes stopped by pid, from main checkout and a second worktree. Not mine: s-129b (version offline) is still unbound in 'bridle spec coverage'."
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

### note · agent:task-cli · 2026-11-17T04:47:53.039Z
built: d54091c (branch bridle/task-cli)

### note · agent:task-cli · 2026-11-17T04:47:53.050Z
done: flume task CLI; just check exit 0, 81 tests passed; d54091c. Note: s-129b (version offline) remains unbound, not part of this ticket.

### note · agent:task-cli · 2026-11-17T04:47:54.878Z
Assumptions are in the summary: file field on API task object, extended cli spec (new --blocked-by/--related/--body, --json, usage), unknown update field exits 1.

### note · agent:manager · 2026-11-17T04:48:19.996Z
integrated: 8e3ea3f88c0a5a645708457ba70fdb9005b0f010 (branch bridle/task-cli)

### note · agent:manager · 2026-11-17T04:48:21.742Z
cleanup: removed agent task-cli, origin branch bridle/task-cli, branch bridle/task-cli
