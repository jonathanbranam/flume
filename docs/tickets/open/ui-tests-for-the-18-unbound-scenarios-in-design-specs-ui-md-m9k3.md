---
id: fl-m9k3
title: UI tests for the 18 unbound scenarios in design/specs/ui.md
kind: chore
created: 2026-11-18
created_by: external:orchestrator
repos: [flume]
changes: []
specs: []
blocked_by: []
related: []
---

## The ask

bridle spec coverage lists 18 executable scenarios in design/specs/ui.md (s-b0a2..s-e1d2, from fl-8g3q) with no test bound to them (rule specs-for-every-surface). Found by the fl-7tyx worker. Write UI tests that bind each scenario, or mark a scenario non-executable where a test makes no sense. Check: bridle spec coverage reports no unbound scenarios in ui.md; just check passes. Model: Sonnet (UI test harness may need setup). Out of scope: changing UI behaviour.
