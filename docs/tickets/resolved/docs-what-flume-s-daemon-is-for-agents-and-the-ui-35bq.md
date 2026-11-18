---
id: fl-35bq
title: "docs: what flume's daemon is for (agents and the UI)"
kind: docs
created: 2026-11-18
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-pshd]
resolved: 2026-11-18T02:20:53Z
---

## The ask

Record what flume's daemon is for in a short design doc, `docs/design/daemon.md`, so it outlives the tickets.

For whoever edits this ticket (the human, 2026-11-17): "the design at the top is the currently agreed-upon design; keep it current and DO NOT include narration or restatements in the design. The discussion section can include the discussion narrative with restatements as a reference."

## Design

`docs/design/daemon.md` states:

- The daemon (`flume serve`) is for two things: agents and the UI.
- Commands the human runs to set up or change the workspace (`flume init`, `flume clone`, `flume project ...`) work on the files and git directly and need no daemon.
- Only the human starts the daemon; no flume command starts it (rule built-for-the-work-sandbox).
- One daemon per workspace, state in `.flume/daemon.json` (fl-4dgp).
- Link it from `docs/design/stack.md` where the daemon is mentioned.

## Discussion (for reference, not authoritative)

The human, 2026-11-17 (verbatim): "I think `init` `clone` `project add` are just normal commands, not through the daemon. we don't need `flume serve` running to do these things" and "`flume serve` is for two things: agents and the UI."

Today no design doc says what the daemon is for; `stack.md` only names it. Ticket fl-pshd carries the same decision for its commands.
