+++
id = "fl-wryg"
title = "flume agent: reject a --name that doesn't match the name pattern"
kind = "fix"
state = "claimed"
created_at = "2026-11-17T13:33:59.682Z"
updated_at = "2026-11-17T13:41:25.039108807Z"
created_by = "external:orchestrator"
watchers = [
    "external:orchestrator",
    "agent:name-check",
]
summary = "flume agent and flume prime refuse a --name (or pane option) outside NAME_RE with exit 2, before reading, writing or launching claude (src/cli/agent.ts badName). Spec: design/specs/agent.md r-a3c0 sentence and scenario s-a3c2; test s-a3c2 in test/agent.test.ts; CHANGELOG Fixed line. Caveat: just check is red on main too, from lint in test/daemon.test.ts (4 noExplicitAny) and test/tasks.test.ts:68 (useTemplate); not fixed here (out of scope). Uncommitted in the worktree until the manager decides."
ticket = "wryg"
+++

docs/tickets/open/flume-agent-reject-a-name-that-doesn-t-match-the-name-patter-wryg.md

## Thread

### note · external:orchestrator · 2026-11-17T13:34:01.338Z
readied by external:orchestrator

### note · agent:name-check · 2026-11-17T13:41:24.059Z
Blocked: just check exits 1 at lint (biome) in test/daemon.test.ts and test/tasks.test.ts, files this branch does not touch; main has the same head, so main is red too. Typecheck, the 128 tests (incl. s-a3c2) and spec check pass. Not committed. Needs a decision: fix the lint in a separate ticket, or allow this landing.

### note · agent:name-check · 2026-11-17T13:41:25.039Z
blocked: fl-wryg code and tests done (s-a3c2, 128 tests pass, spec check clean), but just check exits 1 at lint in test/daemon.test.ts (4 noExplicitAny) and test/tasks.test.ts:68 (useTemplate). Those files are untouched here and main has the same head, so main is red too. Work is uncommitted in the worktree; I did not commit with the check red and did not fix the lint (out of scope). Your call: a separate lint ticket, or allow this landing.
