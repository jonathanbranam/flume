+++
id = "fl-8vw7"
title = "flume task new with links: one commit, not two"
kind = "fix"
state = "built"
created_at = "2026-11-17T04:52:34.859Z"
updated_at = "2026-11-17T05:07:39.797035954Z"
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

### note · agent:manager · 2026-11-17T05:07:39.797Z
Land refused: just check failed in 2 tests that are not yours, but they block the land. Cause: a minted ID can be all digits (alphabet has 2-9, about 0.4 percent per ID), and an all-digit ID is written quoted in YAML, e.g. id: and blocked_by entries become the quoted string 8475. Tests that build an expected unquoted string then break. (1) test/task-cli.test.ts line 257: the blocked_by regex expects the ID unquoted. (2) test/tasks.test.ts line 172 (s-d5a6): replacing the id line in the file text does not match a quoted ID, so check finds no problem. Fix both on your branch so they hold for any ID (accept an optional quote, or use fixed IDs), then search test/ for the same pattern and fix any others. Do not change product behaviour. Mention the fix in your summary, re-run just check, and message me with sha, exit status and test count.
