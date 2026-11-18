---
id: fl-t8xv
title: "flume agent entries: last_seen, updated by the daemon on each request from the agent"
kind: feature
created: 2026-11-18
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-89z2, fl-3pfa]
---

## The ask

Record when each agent last talked to the daemon: a `last_seen` timestamp in the agent's entry, updated by the daemon on every request from that agent.

For whoever edits this ticket (the human, 2026-11-17): "the design at the top is the currently agreed-upon design; keep it current and DO NOT include narration or restatements in the design. The discussion section can include the discussion narrative with restatements as a reference."

## Design

- The agent entry `~/.flume/agents/<name>.yaml` gets a `last_seen` field (ISO 8601 UTC time, like `last_launch`).
- Every flume command that calls the daemon sends the agent's name when `$AGENT_NAME` is set (`flume agent` sets it for the agent's session), e.g. in a request header.
- On each request that carries an agent name, the daemon sets that agent's `last_seen` to the current time. It only updates an existing entry; it never creates one. A request with no agent name changes nothing.
- The daemon writes the entry, not the agent's CLI: the daemon runs outside the agent's sandbox (the human starts it), so the write works there.
- `flume agent list` and `flume agent show` show `last_seen` (blank when never seen).

- A write on every request, no throttling.

### Assumed (advisor; change if wrong)

- The header name is an implementation detail for the spec to fix (e.g. `X-Flume-Agent`).

## Discussion (for reference, not authoritative)

The human, 2026-11-17 (verbatim): "also include something like "last seen" or "last updated"?? Not sure; every time an agent calls the flume serve daemon, update that timestamp"

Context: the entry today holds name, project, pane, created, last_launch; `role` is added by fl-3pfa. `$AGENT_NAME` is already set by `flume agent` and used as the author of `flume task comment`.

The human, 2026-11-17: "agree, no throttling, yes ready it; yes" (name `last_seen` and no throttling confirmed; go to build).
