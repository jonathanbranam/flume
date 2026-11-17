+++
id = "fl-brmx"
title = "Daemon: localhost server, sole writer of task files"
kind = "feature"
state = "integrated"
created_at = "2026-11-17T04:10:37.470Z"
updated_at = "2026-11-17T04:44:41.994454040Z"
created_by = "external:orchestrator"
watchers = [
    "external:orchestrator",
    "agent:daemon",
]
branch = "bridle/daemon"
commit = "d1d02860c78f469ae5ef027be02b14af9d496d30"
summary = "Daemon in src/daemon/ (server, git commit-per-change, address record in git common dir, client helper), core update/note helpers, flume serve/status/stop, 2 new api.md scenarios, tests in test/daemon.test.ts (30). just check exit 0, 60 tests. Assumptions on the thread."
ticket = "brmx"
+++

## The ask

The Flume daemon: a localhost HTTP server that is the only writer of task files and commits them on the main checkout. Child of fl-danq; behaviour in the API specs (fl-47b8). Uses the core library from the task-file task.

The human's reason for this design (brief): "Main is moving not because of any code changes, but because of a whole bunch of documentation changes." Agents in any worktree write tasks through the daemon, which commits them on the main checkout, so task edits never ride along in feature branches.

Build in `src/daemon/`:

- HTTP on 127.0.0.1, port chosen at start; write a port file (where: follow the spec; a dot-dir in the main checkout is the default) so the CLI finds it; an env var override for the URL.
- Endpoints for tasks: create (mints the ID), show, list (filters: state, kind, parent), update fields, add a note (appends to the body), close, reopen. Each write updates the file and makes one git commit on the main checkout with a clear message. Serialize writes (one at a time).
- `flume serve` (foreground), `flume status`, `flume stop`.
- Run from any worktree of the repo: the daemon resolves the main checkout (git worktree list / common dir).

Out of scope: the CLI task commands (next task; a small client helper is fine), auth beyond localhost, multi-project, the roadmap.

Verify: `npm run check` green; integration tests start the daemon on a temp git repo, create/update/close a task over HTTP, and assert the file and the commit; a second worktree reaches the same daemon.


Specs and tests (the human, 2026-11-16 ~11:20 PM, via advisor: "use bridle specs and write tests for them"): the specs are bridle capability spec files from fl-47b8. Every executable scenario this ticket implements gets a test that names its scenario ID, so `bridle spec coverage` lists none of them as missing. If a behaviour you build has no scenario yet, add one (EARS requirement + Given/When/Then, observable behaviour only) and run `bridle spec id` and `bridle spec check`.

Model: Sonnet. Touches: src/daemon/*, src/cli/ (serve/status/stop), test/*.

## Thread

### note · external:orchestrator · 2026-11-17T04:10:52.440Z
readied by external:orchestrator

### note · external:orchestrator · 2026-11-17T04:10:52.453Z
Readied by human via orchestrator. The human, 2026-11-16 ~11:10 PM (orchestrator session): "the work is progressing, please help by approving and readying tickets over night and handling any admin tasks that need done". Child of fl-danq, split by orchestrator (acting PM; flume has no PM).

### note · agent:daemon · 2026-11-17T04:44:18.157Z
Assumptions and ticket-vs-spec differences (fl-brmx):
- Spec overrides ticket: commits go in the git repo of the task root (default the main checkout from 'git worktree list'; --root for a separate repo), never pushed. If the task root is not in a git repo, writes still happen but nothing is committed (assumption; alternative was refusing to start).
- Address record: <git common dir>/flume-daemon.json {url,pid,root}. Chosen over a dot-dir in the checkout because it is shared by all worktrees, is untracked, and needs no .gitignore. Staleness: status/stop verify by asking the daemon, so a stale record reads as "not running". FLUME_URL overrides.
- serve requires a git repo (exit 1 otherwise).
- Writes serialized by construction: handlers are synchronous (files + git commit) and Node runs one at a time; no lock. Revisit if handlers go async.
- PATCH is all-or-none by rewriting, running the project check, and restoring the original text if the change adds a problem (covers non-epic parent, unknown refs, blocked_by cycles). Empty list for blocked_by/related clears the field.
- Commit message: "task <id>: create <title> | update <fields> | add a note | close | reopen". Commit uses explicit paths so unrelated staged files are not swept in.
- Added api.md scenarios s-5d0e (405) and s-6f12 (note/update commit). core gained updateTask, addNote, taskObject (src/core/update.ts). main() is now async (serve runs until stopped).
- bridle spec coverage lists only s-41e6 (flume task list, fl-yt5q) and s-129b (not mine) as unbound in cli.md/api.md.
- Status output: "running at <url>" and "root <path>" on two lines.

### note · agent:daemon · 2026-11-17T04:44:19.400Z
built: a599003eb143351005f14bd19f7aed162715e013 (branch bridle/daemon)

### note · agent:daemon · 2026-11-17T04:44:21.260Z
done: daemon + flume serve/status/stop; just check exit 0, 60 tests (3 files); a599003. Assumptions on the thread.

### note · agent:manager · 2026-11-17T04:44:40.243Z
integrated: d1d02860c78f469ae5ef027be02b14af9d496d30 (branch bridle/daemon)

### note · agent:manager · 2026-11-17T04:44:41.994Z
cleanup: removed agent daemon, origin branch bridle/daemon, branch bridle/daemon
