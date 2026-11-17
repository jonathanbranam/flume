---
id: fl-k9pk
title: flume not-running message says workspace, not project
kind: fix
created: 2026-11-17
created_by: external:orchestrator
repos: [flume]
changes: []
specs: []
blocked_by: []
related: []
resolved: 2026-11-17T14:22:57Z
---

## The ask

Since fl-4dgp, one flume server runs per workspace (the folder holding .flume/), found by walking up from the current folder. The not-running message (fl-qgr7) still says 'for this project', which now misleads: the server is per workspace.

Found by the manager when landing fl-4dgp (2026-11-17).

## Change

1. Reword the not-running message to name the workspace (e.g. 'no flume server is running for this workspace' and the existing second line on how to start one). Keep it two lines.
2. Update design/specs/cli.md (the fl-qgr7 scenario text) and the test asserting the message.

Model: Haiku. Out of scope: any change to discovery itself.
