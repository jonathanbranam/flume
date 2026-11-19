+++
id = "fl-ws3h"
title = "Task resolution: drop the status field, record done or dropped on close"
kind = "feature"
state = "built"
created_at = "2026-11-19T11:41:45.454Z"
updated_at = "2026-11-19T22:52:32.732179839Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:ws3h",
]
branch = "bridle/ws3h"
commit = "8c3363fcc4609d837264b11085cea6a1791a0ad3"
summary = "Dropped status from task.yaml; added resolution (done|dropped) set on close, removed on reopen (store.ts, update.ts taskObject, API close takes {dropped: reason} and adds it as a comment first, 400 on empty; CLI close --dropped REASON, empty is usage error exit 2). Layout: tasks/ (open) and archive/tasks/ (resolved); listTaskFiles reads both and skips tasks/open and tasks/resolved. flume check: resolution problems, old-layout folders reported with where to move them, never moved. History close line has resolution. Specs (task-files, api, cli, workflow) edited in place; new scenarios s-510a, s-e7f4, s-7035, s-da82 rewritten; tests bind them. Choice: --dropped comment is written before the move, by the actor name (agent) or OS user."
ticket = "ws3h"
+++

docs/tickets/open/task-resolution-drop-the-status-field-record-done-or-dropped-ws3h.md

## Thread

### note · external:advisor · 2026-11-19T22:41:59.842Z
readied by external:advisor

### note · external:advisor · 2026-11-19T22:41:59.863Z
Readied by human via advisor: the human picked folder layout B ("B"); Design updated. The resolution names (resolution: done | dropped) and the required reason with --dropped are the advisor's drafted choices, not yet confirmed by the human; build as written unless they say otherwise.

### note · external:orchestrator · 2026-11-19T22:42:27.564Z
From orchestrator: settling 5 min after the ready (rule: settle before plan); I plan and queue it at ~22:48Z, then it's yours. Sonnet as you said.

### note · external:orchestrator · 2026-11-19T22:48:19.407Z
From orchestrator: fl-ws3h planned and queued; yours. Sonnet. Layout B (tasks/ + archive/tasks/) is the human's pick. resolution done|dropped and the required --dropped reason are the advisor's drafts: build as written unless the human says otherwise.

### note · agent:ws3h · 2026-11-19T22:52:30.136Z
built: 8c3363fcc4609d837264b11085cea6a1791a0ad3 (branch bridle/ws3h)

### note · agent:ws3h · 2026-11-19T22:52:32.732Z
done: status dropped, resolution done|dropped, tasks/ + archive/tasks/ layout, check reports old layout; just check exit 0, 257 tests (no last-full-test-count file found), branch already contains main; 8c3363f
