---
id: fl-c9n9
title: "flume: replace TOML with YAML (.flume/config.yaml), remove smol-toml"
kind: chore
created: 2026-11-18
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-3pfa]
---

## The ask

Replace TOML with YAML in flume and remove the TOML library (`smol-toml`).

For whoever edits this ticket (the human, 2026-11-17): "the design at the top is the currently agreed-upon design; keep it current and DO NOT include narration or restatements in the design. The discussion section can include the discussion narrative with restatements as a reference."

## Design

- `.flume/config.toml` becomes `.flume/config.yaml`, flat YAML (`root: <path>`). `flume init` writes it; every command that reads config reads it.
- Remove `smol-toml` from package.json and the lockfile; YAML uses the `yaml` package flume already depends on.
- No migration or backwards compatibility: a `config.toml` is not read.
- Update the specs, help text, README and tests that name `config.toml`.
- Not in this chore: `flume.yaml` and `task.yaml` (layout ticket fl-3pfa, on hold).

## Discussion (for reference, not authoritative)

Split out of fl-3pfa so the TOML removal lands now; fl-3pfa stays on hold.

The human, 2026-11-17 (verbatim): "I really like yaml frontmatter; so, we're going to have yaml parsing; I think we bite the bullet and just make everything yaml now and it's totally fine. The config.yaml, flume.yaml, and task.yaml should be flat yaml as possible. avoid nestings" and "no migration or backwards compatibility needed; just replace toml with yaml; remove the toml library. No projects have onboarded."
