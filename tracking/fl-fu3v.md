+++
id = "fl-fu3v"
title = "flume workflow: a series of steps to follow"
kind = "feature"
state = "integrated"
created_at = "2026-11-18T01:55:20.771Z"
updated_at = "2026-11-18T03:37:20.743891481Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:workflow",
]
branch = "bridle/workflow"
commit = "f0a79907361e974cb2ad8b63d58dceb3808e43e0"
summary = "Built workflow v1 in five commits. Core: src/core/workflow.ts (phases, part files), parts.ts (read/write/remove part, templates with whole-replace override, next/mark plan), plan.ts (plan parser/formatter); assign/phase in update.ts; task fields assignee, agent, phase (new tasks start at proposal). Daemon routes in src/daemon/server.ts (assign, phase, parts, plan/next|done|skip, templates, workflow, list filters). CLI: task assign/claim/phase/write/template/next/done/skip, show ID [PART], list --assignee/--phase, flume workflow [--json]; task new prints the ID only. Built-in prime base text replaced with the Design text, inside flume_base. Specs: design/specs/workflow.md (new), edits in cli.md, task-files.md, api.md; tests in test/workflow.test.ts, daemon.test.ts and updated task-cli/tasks tests. DEFERRED: every fl-eg2q history append (not built; none of the commands append history). Assumptions are on the thread. just check exit 0, 224 tests."
ticket = "fu3v"
+++

docs/tickets/open/flume-workflow-a-series-of-steps-to-follow-fu3v.md

## Thread

### note · external:advisor · 2026-11-18T02:51:46.351Z
human via advisor: stays on hold. The human, 2026-11-17 ~10:45 PM ET: "not ready for flume-workflow yet."

### note · external:advisor · 2026-11-18T02:52:46.948Z
human via advisor: parked for now. The human: "today we will print the full body of the workflow in text with prime, right? That's good enough for now" (fl-3pfa prints the workflow files in full).

### note · external:advisor · 2026-11-18T03:20:04.414Z
readied by external:advisor

### note · external:advisor · 2026-11-18T03:20:04.436Z
human via advisor: go. The human, 2026-11-17: "OK, I approve this to be built." Readied. Best built after fl-x6xn and fl-87h9 (all touch prime); its history appends need fl-eg2q (still pending).

### note · external:orchestrator · 2026-11-18T03:27:31.479Z
From orchestrator: fl-fu3v planned and queued (fl-87h9 has landed, so it is startable). Sonnet. The history appends (Design lines naming fl-eg2q: claim, phase moves, skips) are deferred: fl-eg2q is pending, not approved. Build everything else; leave the history parts to eg2q and say so in the summary. If the human approves eg2q first before this starts, I'll tell you. Big design (139 lines): watch the worker's context; if it nears 150K, stop and split rather than push on.

### note · agent:workflow · 2026-11-18T03:36:34.264Z
Assumptions made building fl-fu3v (reasonable choice, changeable):
- task show ID prints task.yaml, a blank line and "parts: a, b" (no body text); bodies are read with show ID body. JSON show is unchanged (still has path, body).
- write: no --file means standard input; --remove of body is refused (check requires body.md); writing comments is refused (only task comment writes it); empty text refused.
- Plan form: every non-blank line is a group heading, an item, a Skipped line (only under a [-] item) or a one-line HTML comment. done/skip rewrite the plan in canonical form, so blank lines and comments in a hand-written plan are normalised (tradeoff: simple code, plan text formatting is flume's).
- done/skip are all-or-nothing; they refuse when the plan is complete. Re-marking an already done item in the current group is allowed.
- The force rule applies to any agent assigning (also to human) a task someone else holds. Assignee must be one word.
- A task with no phase field reads as proposal. check does not validate phase (YAGNI).
- Actor is sent in the request body (AGENT_NAME), not the X-Flume-Agent header.
DEFERRED: all history appends (fl-eg2q): claim/assign, phase moves, skips and part writes append nothing; not built.

### note · agent:workflow · 2026-11-18T03:36:34.288Z
built: 3ab68d5 (branch bridle/workflow)

### note · agent:workflow · 2026-11-18T03:36:34.300Z
done: workflow v1 steps 1-5 built (history appends for fl-eg2q deferred); 3ab68d5; just check exit 0, 224 tests. Note: I ran a git fetch once by mistake (no effect, nothing used).

### note · agent:manager · 2026-11-18T03:37:18.797Z
integrated: f0a79907361e974cb2ad8b63d58dceb3808e43e0 (branch bridle/workflow)

### note · agent:manager · 2026-11-18T03:37:20.743Z
cleanup: removed agent workflow, origin branch bridle/workflow, branch bridle/workflow
