---
id: fl-vpsb
title: "flume prime: project text tells the agent to read that project's CLAUDE.md"
kind: fix
created: 2026-11-17
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-5xjg]
resolved: 2026-11-17T14:00:06Z
---

## The ask

Change the built-in project prime text (used when ~/.flume/templates/project.md is absent) to:

```
You are working on the {project} project. Read that project's CLAUDE.md and follow its instructions.
```

The human, 2026-11-17 (verbatim): "update the standard prompt like this (fix typos, grammar, clean it up): You are working on the {project} project. Read the CLAUDE.md for that project and follow its instructions." Why: "I start agents from a PARENT folder usually so they have broad read/write access to several related repos, but I want the agent to know it is scoped to a specific repo, without being overly explicit about telling it to \"cd into folder....\" Run with this and we'll see".

## Change

1. The default project template text above, replacing "You are working on project {project}."
2. Spec (design/specs/agent.md, prime contents / prime with a project scenarios) and tests updated in the same change. Nothing else changes.

Related: fl-5xjg changes the base text (the other constant in the same file); the two changes don't overlap.
