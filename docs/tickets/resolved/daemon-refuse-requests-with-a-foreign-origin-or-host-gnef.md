---
id: fl-gnef
title: "Daemon: refuse requests with a foreign Origin or Host"
kind: fix
created: 2026-11-17
created_by: external:orchestrator
repos: [flume]
changes: []
specs: []
blocked_by: []
related: []
resolved: 2026-11-17T13:20:47Z
---

## The ask

The flume daemon listens on 127.0.0.1 with no auth, so a web page open in a browser on the same machine can POST to it (CSRF) or reach it through DNS rebinding. Add a cheap guard: refuse a request whose Host header isn't 127.0.0.1:<port> or localhost:<port>, and refuse a state-changing request (POST/PATCH/DELETE) that carries an Origin header that isn't the daemon's own origin. The CLI sends no Origin, so it keeps working.

Found by flume's manager after fl-brmx landed (m-0440).

Acceptance: tests for foreign Host refused, foreign Origin on POST refused, CLI request accepted; `just check` exit 0. If api.md or the daemon spec names the transport rules, add the rule there with a scenario.

Model: Sonnet (small, but security). Not in scope: tokens or real auth (not needed while it's localhost-only; revisit if the daemon ever listens off-box).
