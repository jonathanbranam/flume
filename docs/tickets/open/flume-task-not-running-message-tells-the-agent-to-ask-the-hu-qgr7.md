---
id: fl-qgr7
title: "flume task: not-running message tells the agent to ask the human to run flume serve"
kind: fix
created: 2026-11-17
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: []
---

## The ask

When a `flume task` command finds no daemon, its message tells the agent to ask the human to start one. Flume never starts a daemon itself.

The human, 2026-11-17, after an agent stalled on a fresh project ("flume task list refuses to run until you start it with flume serve"): "no, don't start a daemon ever" and "a daemon started by claude would be refused or sandboxes". So the human starts the daemon; an agent only asks.

## Change

The not-running message (stderr, exit code unchanged) becomes:

```
flume: the flume daemon is not running for this project.
Ask the human to start it: flume serve (in its own pane).
```

Spec and tests updated in the same change. Nothing else changes.

## Note for the sandbox rule

Fact to keep (rule built-for-the-work-sandbox): a daemon started by Claude would be refused or sandboxed; only the human starts `flume serve`. Flume must never auto-start or background a daemon.
