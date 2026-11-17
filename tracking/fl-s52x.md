+++
id = "fl-s52x"
title = "flume roadmap show and check"
kind = "feature"
state = "integrated"
created_at = "2026-11-17T04:10:37.518Z"
updated_at = "2026-11-17T04:51:10.859438355Z"
created_by = "external:orchestrator"
watchers = [
    "external:orchestrator",
    "agent:roadmap",
]
branch = "bridle/roadmap"
commit = "12dc903ff00214190547f39fdb58f9ae51109d3a"
summary = "Added flume roadmap show|check, GET /api/roadmap and roadmap rules in flume check. Code: src/core/roadmap.ts, src/cli/roadmap.ts, a handler in src/daemon/server.ts, a hook in src/core/check.ts. Specs: new design/specs/roadmap.md, daemon endpoint in api.md. Tests: test/roadmap.test.ts, every scenario bound (coverage lists none). Assumptions: format is Markdown headings plus list items with a [[file-stem]] link (label after a bar ok); text after the link is the note; a section headed Done (any case) is finished, all others upcoming; epics-only and exactly-once rules from the brief are NOT enforced (YAGNI). show needs the daemon; check is offline; both error (exit 1) when flume/roadmap.md is missing, while flume check ignores a missing roadmap. No starter flume/roadmap.md: this repo keeps tickets in docs/tickets, so any link would fail flume check."
ticket = "s52x"
+++

## The ask

`flume roadmap [show|check]` on `flume/roadmap.md`. Child of fl-danq; behaviour in the specs (fl-47b8); the brief and docs/brief/tickets-lite.md describe the roadmap.

- `show` prints the roadmap with each linked task's state (open/resolved), read through the daemon.
- `check` validates it: every wiki link resolves to a task, no resolved task is listed as upcoming without note, and `flume check` runs it too.
- If the brief leaves the roadmap file's format open, take the simplest reading (Markdown headings plus a list of task wiki links), record it in the specs, and note it on this task for the human.

Out of scope: editing the roadmap through the CLI, ordering beyond what the file says, the UI.

Verify: `npm run check` green; tests for show and each check rule.


Specs and tests (the human, 2026-11-16 ~11:20 PM, via advisor: "use bridle specs and write tests for them"): the specs are bridle capability spec files from fl-47b8. Every executable scenario this ticket implements gets a test that names its scenario ID, so `bridle spec coverage` lists none of them as missing. If a behaviour you build has no scenario yet, add one (EARS requirement + Given/When/Then, observable behaviour only) and run `bridle spec id` and `bridle spec check`.

Model: Sonnet. Touches: src/core/ (roadmap parsing), src/daemon/ (one read endpoint), src/cli/, test/*, flume/roadmap.md (a starter file), the spec files (roadmap scenarios).

## Thread

### note · external:orchestrator · 2026-11-17T04:10:52.508Z
readied by external:orchestrator

### note · external:orchestrator · 2026-11-17T04:10:52.521Z
Readied by human via orchestrator. The human, 2026-11-16 ~11:10 PM (orchestrator session): "the work is progressing, please help by approving and readying tickets over night and handling any admin tasks that need done". Child of fl-danq, split by orchestrator (acting PM; flume has no PM).

### note · agent:roadmap · 2026-11-17T04:50:41.695Z
built: 4c45fbe (branch bridle/roadmap)

### note · agent:roadmap · 2026-11-17T04:50:41.706Z
done: flume roadmap show/check, GET /api/roadmap, specs/roadmap.md; just check exit 0, 95 tests; 4c45fbe

### note · agent:roadmap · 2026-11-17T04:50:43.579Z
Assumptions for the human: roadmap file format (headings + list items with [[stem]] links, Done section = finished, text after link = note) is recorded in design/specs/roadmap.md. Brief's epics-only and each-open-epic-once checks not built (YAGNI). No starter flume/roadmap.md: this repo has no flume/tasks, so its links would fail flume check.

### note · agent:manager · 2026-11-17T04:51:08.998Z
integrated: 12dc903ff00214190547f39fdb58f9ae51109d3a (branch bridle/roadmap)

### note · agent:manager · 2026-11-17T04:51:10.859Z
cleanup: removed agent roadmap, origin branch bridle/roadmap, branch bridle/roadmap
