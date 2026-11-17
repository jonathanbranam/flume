---
id: fl-fruc
title: Bind scenario s-129b (version offline) with a test
kind: chore
created: 2026-11-17
created_by: external:orchestrator
repos: [flume]
changes: []
specs: []
blocked_by: []
related: []
---

## The ask

`bridle spec coverage` lists one unbound scenario outside the UI spec: s-129b "Version offline" (design/specs/cli.md:39). Add a test that exercises it and names s-129b, like the other bound scenarios.

Acceptance: `just check` exit 0; `bridle spec coverage` no longer lists s-129b.

Model: Haiku (light, one test).

Not in scope, deferred: making coverage a failing check (`--require-all`). The 18 UI scenarios (design/specs/ui.md) can't be bound until the React UI epic builds the UI; turn the gate on there. Decided by orchestrator, 2026-11-17, under the human's overnight go ("make assumptions and take the best choice. KISS ... YAGNI").
