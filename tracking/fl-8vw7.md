+++
id = "fl-8vw7"
title = "flume task new with links: one commit, not two"
kind = "fix"
state = "built"
created_at = "2026-11-17T04:52:34.859Z"
updated_at = "2026-11-17T05:06:59.844573365Z"
created_by = "external:orchestrator"
watchers = [
    "external:orchestrator",
    "agent:one-commit",
]
branch = "bridle/one-commit"
commit = "b6802be"
summary = "POST /api/tasks accepts blocked_by and related (lists of IDs); createTask writes them in the one file and runs the project check, removing the file and refusing (400) when links add a problem, so nothing is committed. CLI new sends them in the create call; follow-up PATCH dropped. api.md create requirement updated, scenarios s-fc8d, s-88ac added with tests. Cycles cannot arise for a new task."
ticket = "8vw7"
+++

docs/tickets/open/flume-task-new-with-links-one-commit-not-two-8vw7.md

## Thread

### note · external:orchestrator · 2026-11-17T04:52:47.455Z
readied by external:orchestrator

### note · agent:one-commit · 2026-11-17T05:06:59.833Z
built: b6802be (branch bridle/one-commit)

### note · agent:one-commit · 2026-11-17T05:06:59.844Z
done: task new with links is one commit (POST accepts blocked_by/related, validated, nothing written on refusal); just check exit 0, 101 tests, b6802be
