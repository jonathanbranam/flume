---
id: fl-8vw7
title: "flume task new with links: one commit, not two"
kind: fix
created: 2026-11-17
created_by: external:orchestrator
repos: [flume]
changes: []
specs: []
blocked_by: []
related: []
---

## The ask

`flume task new` with blocked_by/related makes two commits (POST create, then PATCH links). design/specs/api.md says one commit per change. Let POST /api/tasks take blocked_by and related, and have the CLI send them in the create call, so a new task is one commit.

Found by flume's manager after fl-yt5q landed (m-0440).

Acceptance: a test that creating a task with links makes exactly one commit; `just check` exit 0.

Model: Sonnet (small). Not in scope: batching other commands.
