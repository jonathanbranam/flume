---
id: fl-5xjg
title: "flume prime: default base template points the agent at flume --help"
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

The built-in base prime gives the agent nothing about flume. Add one line to it.

The human tried `flume agent --name bob`; the agent saw only "You are agent bob, stored in $AGENT_NAME." and no flume text (no ~/.flume/templates on that machine). Earlier, the human: "I do always want, in terms of Flume Prime, the agent to understand how to use Flume." On a fuller proposal: "this is too complicated. No, make it very very simple right now".

## Change

The default base template (used when ~/.flume/templates/base.md is absent) becomes:

```
You are agent {name}, stored in $AGENT_NAME.
Use the flume CLI to work with tasks; run flume --help to learn it.
```

Spec (design/specs/agent.md, prime contents scenario) and tests updated in the same change. Nothing else changes.
