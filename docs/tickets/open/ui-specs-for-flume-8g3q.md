---
id: fl-8g3q
title: UI specs for Flume
kind: docs
created: 2026-11-17
created_by: external:orchestrator
repos: [flume]
changes: []
specs: []
blocked_by: [fl-47b8]
related: []
---

## The ask

Write the bridle capability specs for Flume's UI (the Kanban board and task views), so the UI epic later starts from them. Split from fl-47b8 by orchestrator to keep each ticket small; fl-47b8 does task files, CLI and API.

The human, 2026-11-16 ~11:20 PM (via advisor): "I DO want clear specs written for every CLI command and the API and UI - use bridle specs and write tests for them". And ~11:22 PM: "The specs should be clear and as language and implementation-agnostic as possible."

- Format and place: bridle capability spec files in the location `bridle spec check` reads (see fl-47b8 for what it settled on; follow it). EARS sentence per requirement, Given/When/Then scenarios under it. `bridle spec id`, then `bridle spec check` clean.
- Content: what the UI shows and lets the user do, from docs/brief/project-note.md (Kanban of tasks by state, a task's detail, roadmap view), stated as observable behaviour only (what is on screen, what a click does, what it sends to the API). No framework, component or library names.
- KISS/YAGNI (the human, via aide: "KISS in times of doubt, and YAGNI - don't build too much"): only the views the brief names; record assumptions on this ticket.

Out of scope: building the UI; tests (the UI epic writes them later).

Verify: `bridle spec check` clean; every requirement has at least one scenario.

Model: Sonnet. Touches: the UI spec file(s) only. Runs after fl-47b8 (same location and conventions).
