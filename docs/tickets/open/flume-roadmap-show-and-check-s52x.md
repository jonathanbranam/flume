---
id: fl-s52x
title: flume roadmap show and check
kind: feature
created: 2026-11-17
created_by: external:orchestrator
repos: [flume]
changes: []
specs: []
blocked_by: []
related: []
parent: fl-danq
---

## The ask

`flume roadmap [show|check]` on `flume/roadmap.md`. Child of fl-danq; behaviour in the specs (fl-47b8); the brief and docs/brief/tickets-lite.md describe the roadmap.

- `show` prints the roadmap with each linked task's state (open/resolved), read through the daemon.
- `check` validates it: every wiki link resolves to a task, no resolved task is listed as upcoming without note, and `flume check` runs it too.
- If the brief leaves the roadmap file's format open, take the simplest reading (Markdown headings plus a list of task wiki links), record it in docs/specs/, and note it on this task for the human.

Out of scope: editing the roadmap through the CLI, ordering beyond what the file says, the UI.

Verify: `npm run check` green; tests for show and each check rule.

Model: Sonnet. Touches: src/core/ (roadmap parsing), src/daemon/ (one read endpoint), src/cli/, test/*, flume/roadmap.md (a starter file), docs/specs/ (only if the format needs recording).
