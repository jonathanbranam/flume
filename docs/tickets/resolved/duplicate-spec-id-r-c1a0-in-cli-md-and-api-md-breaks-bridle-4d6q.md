---
id: fl-4d6q
title: Duplicate spec id r-c1a0 in cli.md and api.md breaks bridle spec id
kind: fix
created: 2026-11-18
created_by: agent:manager
repos: [flume]
changes: []
specs: []
blocked_by: []
related: []
resolved: 2026-11-18T05:55:56Z
---

## The ask

r-c1a0 is used twice: design/specs/api.md (Add a comment) and design/specs/cli.md (Project clone clones projects, from fl-gr36). bridle spec id fails on it, so workers hand-assign ids (fl-4tx8 did). Keep r-c1a0 on api.md; give the cli.md requirement a fresh id and update design/specs/.ids; check no other id is duplicated. Check: bridle spec id runs clean, bridle spec check --require-ids clean, just check passes. Found by worker instructions on fl-4tx8.
