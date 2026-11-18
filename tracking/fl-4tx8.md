+++
id = "fl-4tx8"
title = "guides in the plan: the planner names guides per plan group; flume task next prints them with the group"
kind = "feature"
state = "integrated"
created_at = "2026-11-18T03:54:08.812Z"
updated_at = "2026-11-18T05:54:07.406614403Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:instructions",
]
branch = "bridle/instructions"
commit = "05e3ba977a7402eeee6fcfaca9177da0cbabe0a7"
summary = "Built in 6 commits on bridle/instructions. flume guide (no name) lists guides; flume task guide ID NAME --phase PHASE [--remove] (task.yaml guides nested by phase, refusal for passed phases and unknown guides); Guide: lines in plan groups (plan.ts, checked in writePart); src/core/instructions.ts holds per-phase steps and builds flume_instructions; task next prints group and implement guides (JSON gains guides); history records instructions, guide_push, guide_remove; daemon refuses (409) an agent's forward phase move without a fetch of the current phase's instructions since entry; claim/assign-to-self prints instructions; phase prints next: line; show ends with the pointer line. Spec: design/specs/instructions.md (+ edits in workflow.md, cli.md, agent.md); tests in test/instructions.test.ts, existing tests adjusted for the new show line and the gate. Decisions: instructions is a POST (it records the fetch); guide list reuses GET /api/prime; the gate is 409; removing a non-pushed guide is refused; bridle spec id fails on a pre-existing duplicate id r-c1a0 (cli.md and api.md), so my new ids were written by hand (spec check is clean). Check: just check exit 0, 248 tests."
ticket = "4tx8"
+++

docs/tickets/open/guides-in-the-plan-the-planner-names-guides-per-plan-group-f-4tx8.md

## Thread

### note · external:aide · 2026-11-18T04:06:56.361Z
readied by external:aide

### note · external:aide · 2026-11-18T04:06:56.385Z
From the human, via aide (2026-11-17 ~11:10 PM ET), verbatim: "Build eg2q and 4tx8 and inform advisor". This is the go to build fl-4tx8 (hold lifted).

### note · external:advisor · 2026-11-18T04:07:17.722Z
advisor: The ask updated with the human's go (via aide); hold line removed.

### note · external:advisor · 2026-11-18T04:08:39.628Z
Design change from the human via advisor (2026-11-18), verbatim: "Trying to set a guide on an earlier phase should be refused. The task must be moved to that phase first (or before that phase? Not sure exactly)". Design, Push to a phase: flume task guide ID NAME --phase PHASE (add or --remove) is refused (exit 1, nothing changed) when PHASE is earlier than the task's current phase; the message says to move the task back first. Current or later phase is allowed. Advisor assumed 'at or before' and that the human is not exempt; both under Assumed.

### note · external:orchestrator · 2026-11-18T05:39:10.969Z
From orchestrator: fl-4tx8 planned and queued (human via aide: 'Build eg2q and 4tx8'). Sonnet. Build from the current Design (the human's change: refuse pushing a guide to a phase the task has passed).

### note · agent:instructions · 2026-11-18T05:52:31.245Z
built: 401b14e (branch bridle/instructions)

### note · agent:instructions · 2026-11-18T05:52:34.110Z
Decisions: instructions is POST (records the fetch); guide list reuses GET /api/prime; gate answers 409; removing a guide not pushed is refused; bridle spec id fails on a pre-existing duplicate id r-c1a0 (cli.md vs api.md, not mine), so new spec ids were hand-assigned (spec check clean).

### note · agent:instructions · 2026-11-18T05:52:34.124Z
done: all 6 steps; just check exit 0, 248 tests; main already merged; 401b14e (pushed). Note: pre-existing duplicate spec id r-c1a0 in cli.md and api.md breaks 'bridle spec id'.

### note · agent:manager · 2026-11-18T05:54:05.663Z
integrated: 05e3ba977a7402eeee6fcfaca9177da0cbabe0a7 (branch bridle/instructions)

### note · agent:manager · 2026-11-18T05:54:07.406Z
cleanup: removed agent instructions, origin branch bridle/instructions, branch bridle/instructions
