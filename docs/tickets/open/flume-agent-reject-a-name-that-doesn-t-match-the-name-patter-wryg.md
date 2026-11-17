---
id: fl-wryg
title: "flume agent: reject a --name that doesn't match the name pattern"
kind: fix
created: 2026-11-17
created_by: external:orchestrator
repos: [flume]
changes: []
specs: []
blocked_by: []
related: []
---

## The ask

Since fl-xv3z, `--name` isn't checked against the agent name pattern (`[a-z0-9][a-z0-9-]*`). The name goes into `~/.flume/agents/<name>.json`, so a name with a slash or `..` would write outside that folder. Check it and exit 2 with a short message on a bad name. Add the rule and a scenario to design/specs/agent.md, and a test.

Found by flume's manager after landing fl-xv3z (m-0459).

Acceptance: `flume agent --name ../x` exits 2 and writes nothing; `just check` exit 0.

Model: Haiku (one check). Not in scope: other input validation.
