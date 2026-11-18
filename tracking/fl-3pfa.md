+++
id = "fl-3pfa"
title = "flume layouts: everything in a flume/ folder, or everything at the repo top level, chosen at init"
kind = "feature"
state = "claimed"
created_at = "2026-11-17T23:27:25.101Z"
updated_at = "2026-11-18T03:04:12.960894143Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:layout",
]
summary = "New layout built: flume.yaml (dir) at the tasks repo top; tasks are folders with task.yaml, body.md, comments.md (other files untouched, moved on close); init writes flume.yaml (--dir), no workflow copy, --force and workflow/base removed; GET /api/prime and async flume prime/agent print built-in text plus the daemon's layered base/project/role files; flume agent --role saved on the entry. Specs (task-files, cli, agent, api, roadmap), tests (new test/prime.test.ts, updated others), README/docs and CHANGELOG updated. Assumptions are on the ticket thread. just check green, 172 tests; spec check clean, unbound still the 18 ui scenarios."
ticket = "3pfa"
+++

docs/tickets/open/flume-layouts-everything-in-a-flume-folder-or-everything-at-3pfa.md

## Thread

### note · external:advisor · 2026-11-17T23:27:31.732Z
human via advisor: HOLD, do not ready or build. The human: "Don't build it yet." Pending until the human settles the open points.

### note · external:advisor · 2026-11-18T00:51:59.385Z
human via advisor: decisions added (dir = . or flume in a versioned config; all flume stuff in the flume repo; base/ and <project>/ under flume-root). Still not to be built.

### note · external:advisor · 2026-11-18T01:16:05.707Z
human via advisor: projects go under <flume-root>/projects/<project>/ ("Sure projects in projects/ folder.").

### note · external:advisor · 2026-11-18T02:45:15.411Z
readied by external:advisor

### note · external:advisor · 2026-11-18T02:45:17.978Z
human via advisor: go. The human, 2026-11-17 ~10:30 PM ET: "build it". Hold lifted; readied.

### note · external:orchestrator · 2026-11-18T02:51:19.619Z
From orchestrator: fl-3pfa planned and queued (hold lifted: human via advisor 'build it'). Sonnet. Build from The ask + Design only; Discussion is background.

### note · agent:layout · 2026-11-18T03:04:12.945Z
Assumptions made building fl-3pfa (rule assume-and-record), each changeable:
- No flume.yaml in a tasks repo: serve/check/daemon use dir "flume" (init always writes one). Alternative: refuse. Chosen for simplicity and so tests and old repos do not break on a missing file; an unusable dir value (e.g. a/b) is an error.
- Prime with no daemon (or a refusal): prints the built-in text plus one line saying the workflow text is missing and to ask the human to run flume serve; exit 0. A launch (flume agent) still starts claude with that text.
- Prime endpoint: GET /api/prime?project=&role= returns {text}: existing layer files joined by blank lines; project/role must be plain names (400 otherwise). The built-in text (name, project line) stays in the CLI; flume agent/prime are now async.
- task.yaml gains a status field (open|resolved) written on create/close/reopen, and an optional project field; flume check reports status differing from the folder. API/CLI: `flume task new --project NAME`, POST /api/tasks project. No PATCH of project (YAGNI).
- Task object: file is gone; body (body.md), comments (comments.md), fields (task.yaml text) instead. `flume task show` prints task.yaml, blank line, body.md, then comments.md if any.
- roadmap.md moved from flume/roadmap.md to <flume-root>/roadmap.md (design says everything flume lives in the flume-root).
- Not done: guides/workflow steps (other tickets); `flume init` creates no base/ projects/ tasks/ folders; no AGENT_ROLE env var; `agent list` table has no ROLE column (JSON does).
- Comments are also scanned for [[links]] by flume check.
