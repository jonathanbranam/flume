---
id: fl-b2yb
title: "Agent spec: fix the daemon line and drop requirements for removed features"
kind: fix
created: 2026-11-27
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-tf7c]
---

## The ask

Two corrections to the agent launcher spec (design/specs/agent.md), from the human's review of it
against docs/principles.md: its opening line wrongly says no command needs the daemon, and two
requirements only say what flume no longer does (leftovers from earlier versions; P1 Small and
simple).

## Design

- **Opening line.** Replace "No command here needs the daemon." with what is true: flume agent and
  flume prime ask the daemon for the workflow text (with a fallback when none answers), flume guide
  needs it, and the daemon sets last_seen. flume never starts it.
- **Drop the negative requirements for removed features:**
  - r-a3c0 Registry entry: drop "flume SHALL NOT read a .json file in that folder, and SHALL ignore
    it in list and show", and scenario s-a3c3 (A JSON entry is not read) with its test.
  - r-a8c0 Built-in prime text: drop "and SHALL NOT read any file in the home folder's templates
    folder", and scenario s-a8c1 (Templates folder ignored) with its test.
- Keep every other SHALL NOT (never start the daemon, the pane check, the conflicts): they state
  current behaviour, not removed features.
- The code that ignores .json entries and the templates folder may stay or go; nothing observable
  changes for a current install.
- bridle spec check --require-ids clean; bridle spec coverage lists no new unbound scenario.

### Not in this ticket

- The flume_not_set_up text still names a separate tasks repo (flume clone <tasks-repo-url>): left
  for the workspace versus single-project research ticket.
- Claude option parsing (r-d1c0) stays as it is.

## Discussion (for reference, not authoritative)

Advisor's review, 2026-11-27, items 1 and 3. The human, verbatim: "1. Yes, let's just fix the
comment about the demon." ... "For number 3, yes, drop negative requirements. That's fine."
