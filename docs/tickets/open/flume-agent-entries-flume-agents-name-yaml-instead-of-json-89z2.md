---
id: fl-89z2
title: "flume agent entries: ~/.flume/agents/<name>.yaml instead of .json"
kind: chore
created: 2026-11-18
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-c9n9]
---

## The ask

Agent entries in `~/.flume/agents/<name>.json` become `~/.flume/agents/<name>.yaml`, flat YAML, to match the rest of flume's files (fl-c9n9).

For whoever edits this ticket (the human, 2026-11-17): "the design at the top is the currently agreed-upon design; keep it current and DO NOT include narration or restatements in the design. The discussion section can include the discussion narrative with restatements as a reference."

## Design

- `flume agent` writes each agent's entry to `~/.flume/agents/<name>.yaml` (machine-wide, not per workspace), flat YAML with the same fields as today's JSON.
- `flume agent list` and `flume agent show` read the `.yaml` files.
- No migration or backwards compatibility: `.json` entries are not read (no project has onboarded).
- Update the specs, help text and tests that name `agents/<name>.json`.

## Discussion (for reference, not authoritative)

The human, 2026-11-17 (verbatim): "where are agents stored? That is global, right? ~/.flume/ something? Let's make that yaml as well did we overlook that?"

Earlier: "I think we bite the bullet and just make everything yaml now" and "no migration or backwards compatibility needed". fl-c9n9 switched `.flume/config.toml`; the agent entries were missed because they were JSON, not TOML.
