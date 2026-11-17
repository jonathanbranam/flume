+++
id = "fl-wryg"
title = "flume agent: reject a --name that doesn't match the name pattern"
kind = "fix"
state = "integrated"
created_at = "2026-11-17T13:33:59.682Z"
updated_at = "2026-11-17T13:42:44.450932981Z"
created_by = "external:orchestrator"
watchers = [
    "external:orchestrator",
    "agent:name-check",
]
branch = "bridle/name-check"
commit = "8c5041e44369bd77440518c30d8623cff3dbfa76"
summary = "flume agent and flume prime refuse a --name (or tmux pane option) outside the agent name pattern with exit 2, before the registry is read or written or claude runs (src/cli/agent.ts, badName). Spec: design/specs/agent.md r-a3c0 sentence and scenario s-a3c2; test s-a3c2 in test/agent.test.ts; CHANGELOG Fixed line."
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

### note · agent:manager · 2026-11-17T13:41:39.768Z
Thanks for stopping. main is not red as far as I can tell: the integration check ran 'just check' (lint included) green on fee3a76 a few minutes ago, and main has had only a ticket-file move since. So your worktree's toolchain probably differs. Please: (1) run 'npx biome --version' (the lockfile pins 2.6.8); (2) run 'npm ci' (not npm install) to reinstall node_modules exactly from package-lock.json; (3) confirm 'git status' shows no package.json or package-lock.json change; (4) re-run 'just check'. If it's green, commit and report as usual. If lint still fails on the same untouched files with biome 2.6.8, tell me the biome version and the exact lint lines, and don't fix them.

### note · agent:name-check · 2026-11-17T13:42:11.600Z
built: b779553ae7857a079cc4ce3e0fb3a29cfc0e9ef3 (branch bridle/name-check)

### note · agent:name-check · 2026-11-17T13:42:11.615Z
done: fl-wryg; b779553ae7857a079cc4ce3e0fb3a29cfc0e9ef3. just check exit 0 on this tree (biome 2.6.8, npm ci, package files unchanged); 128 tests pass including s-a3c2; lint shows 4 warnings and 1 info, no errors. Earlier red was a stale toolchain in my worktree. Main was merged (already up to date). Note: the run also printed the workspace last-full-test-count as 0; I did not compare against it.

### note · agent:manager · 2026-11-17T13:42:19.028Z
Code is good. One fix before I land: your ticket summary still says just check is red on main and the work is uncommitted; the summary becomes the landing commit's body. Rewrite it ('bridle ticket summary fl-wryg --text ...') without the caveat (the red was your worktree's stale toolchain), then message me. No code change needed.

### note · agent:name-check · 2026-11-17T13:42:21.048Z
done: fl-wryg summary rewritten without the caveat; code unchanged at b779553ae7857a079cc4ce3e0fb3a29cfc0e9ef3.

### note · agent:manager · 2026-11-17T13:42:42.676Z
integrated: 8c5041e44369bd77440518c30d8623cff3dbfa76 (branch bridle/name-check)

### note · agent:manager · 2026-11-17T13:42:44.450Z
cleanup: removed agent name-check, origin branch bridle/name-check, branch bridle/name-check
