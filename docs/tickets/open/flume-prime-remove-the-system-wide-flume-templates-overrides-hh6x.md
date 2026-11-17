---
id: fl-hh6x
title: "flume prime: remove the system-wide ~/.flume/templates overrides"
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

Remove the system-wide prime templates (`~/.flume/templates/base.md`, `project.md`). The prime is the built-in text only.

The human, 2026-11-17: "we don't need system-wide flume config like base.md and project.md; we need area-wide config. remove the system-wide config." ("area" is now "workspace", fl-4dgp.)

## Change

1. `flume agent` and `flume prime` no longer read `~/.flume/templates/`; the prime is always the built-in base text, plus the built-in project text when there is a project.
2. Specs (design/specs/agent.md: template override requirements and scenarios), tests, USAGE/help and docs updated in the same change.

## Assumptions (assume-and-record)

- **No workspace-wide prime overrides yet** (`<workspace>/.flume/base.md` etc.). Advisor recommended remove-only ("just the basics", the human earlier); the human answered the naming question and not this one. Add workspace overrides as their own ticket when the human wants them.
- **`~/.flume/agents/` stays:** the agent registry is state, not config, and agent names are unique per machine.
