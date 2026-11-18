---
id: fl-7tyx
title: Duplicate spec id r-c1a0 in cli.md and api.md breaks bridle spec id
kind: fix
created: 2026-11-18
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: []
---

## The ask

`design/specs/api.md:114` (Add a comment) and `design/specs/cli.md:177` (Project clone clones projects) both carry `{#r-c1a0}`, so `bridle spec id` fails. Give one of them a fresh ID (`bridle spec id`), update any test naming the old one, and keep `bridle spec check --require-ids` and `bridle spec coverage` clean. Reported by agent:instructions on fl-4tx8.

## Design

- Keep r-c1a0 on whichever requirement the tests already bind to; re-ID the other one and fix its references.

## Discussion (for reference, not authoritative)

agent:instructions, fl-4tx8 landing note: "pre-existing duplicate spec id r-c1a0 in cli.md and api.md breaks 'bridle spec id'."
