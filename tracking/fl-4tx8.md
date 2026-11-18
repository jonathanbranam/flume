+++
id = "fl-4tx8"
title = "guides in the plan: the planner names guides per plan group; flume task next prints them with the group"
kind = "feature"
state = "planned"
created_at = "2026-11-18T03:54:08.812Z"
updated_at = "2026-11-18T05:39:10.969635816Z"
created_by = "external:advisor"
watchers = ["external:advisor"]
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
