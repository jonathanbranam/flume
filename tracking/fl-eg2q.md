+++
id = "fl-eg2q"
title = "flume task history: a structural audit trail in each task folder"
kind = "feature"
state = "integrated"
created_at = "2026-11-18T03:05:38.479Z"
updated_at = "2026-11-18T04:00:11.619705946Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:history",
]
branch = "bridle/history"
commit = "c499a4e70c2f7fbe8e408b5d95240478e559cc4b"
summary = "Added history.jsonl per task folder (core/history.ts), appended by every daemon task-changing handler with time/by/action plus field/from/to, part, items/reason; 'by' = X-Flume-Agent header or human (actorOf in server.ts). New flume task history ID [--json] and GET /api/tasks/{id}/history. Specs r-1a7e, r-4d0a with scenarios s-2b8c, s-3c9d, s-5e1f bound to tests. No-op or refused changes append nothing."
ticket = "eg2q"
+++

docs/tickets/open/flume-task-history-a-structural-audit-trail-in-each-task-fol-eg2q.md

## Thread

### note · external:advisor · 2026-11-18T03:49:02.490Z
readied by external:advisor

### note · external:advisor · 2026-11-18T03:49:02.504Z
human via advisor: go. The human, 2026-11-17: "Please ready the other tickets you asked about earlier as well. They all look good". Readied.

### note · agent:history · 2026-11-18T03:58:30.907Z
Decisions: (1) 'by' comes from the X-Flume-Agent header (AGENT_NAME, sent by every command), else 'human'; decided in one function (actorOf in src/daemon/server.ts) so fl-6hkt changes one place. Tradeoff: assign's body 'actor' and comment's body 'author' are separate and unchanged. (2) History is appended by the daemon handlers (core/history.ts), so it lands in the same commit as the change; a no-op (same phase, assign to the holder, unchanged field) or refused change appends nothing. (3) Actions: create, update, assign (field assignee), phase, comment, plan_done, plan_skip, close, reopen, write, remove. (4) Existing commit-content tests now include history.jsonl in the new task folder.

### note · agent:history · 2026-11-18T03:58:32.198Z
built: 5bb08ded490c8f5f2d45eaaf2adb202727c30d89 (branch bridle/history)

### note · agent:history · 2026-11-18T03:58:32.212Z
done: task history (history.jsonl, flume task history, API); just check exit 0, 231 tests; 5bb08de

### note · agent:manager · 2026-11-18T04:00:09.708Z
integrated: c499a4e70c2f7fbe8e408b5d95240478e559cc4b (branch bridle/history)

### note · agent:manager · 2026-11-18T04:00:11.619Z
cleanup: removed agent history, origin branch bridle/history, branch bridle/history
