---
id: fl-6hkt
title: flume knows a Claude Code agent even without AGENT_NAME; never records an agent as the human
kind: fix
created: 2026-11-18
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: [fl-eg2q]
related: [fl-fu3v, fl-eg2q, fl-t8xv]
resolved: 2026-11-18T04:03:47Z
---

## The ask

Flume records anything done without `$AGENT_NAME` as the human. An agent that runs flume without `$AGENT_NAME` (started outside `flume agent`, or the variable lost) is then recorded as the human, and gets the human's rights (e.g. assign without `--force`). Flume should recognize a Claude Code process from the variables Claude Code sets, and never record an agent as the human.

For whoever edits this ticket (the human, 2026-11-17): "the design at the top is the currently agreed-upon design; keep it current and DO NOT include narration or restatements in the design. The discussion section can include the discussion narrative with restatements as a reference."

## Design

### Who is acting

Flume works out who runs a command, in this order:

1. `$AGENT_NAME` set: that agent.
2. Else, running under Claude Code (`CLAUDECODE` is set, as Claude Code sets it in every shell it runs): an unnamed agent, recorded as `agent-<id>`, where `<id>` is the first 8 characters of `$CLAUDE_CODE_SESSION_ID` (`agent-unknown` when that is unset too).
3. Else: the human.

The check lives in one place, used by every command that records or decides by who is acting.

### Where it applies

- Comment authors, `assign` / `claim` actor, history `by` (fl-eg2q), and the `X-Flume-Agent` header to the daemon (so `last_seen` is not credited to the human).
- An unnamed agent is an agent for every rule: it needs `--force` to take a task someone else holds, as a named agent does.
- `flume task assign ID` / `claim ID` with no name and no `$AGENT_NAME` cannot assign to "yourself": refused (exit 2) with a message saying `$AGENT_NAME` is not set; the agent should be launched with `flume agent`.
- Commands that print for the agent may say once on stderr that `$AGENT_NAME` is not set (builder's choice).

### Assumed (advisor; change if wrong)

- `CLAUDECODE` is the signal (checked 2026-11-17: Claude Code sets `CLAUDECODE`, `CLAUDE_CODE_ENTRYPOINT`, `CLAUDE_CODE_SESSION_ID` and others in its shells). Other agent tools can be added to the same check when needed.
- Tradeoff: the human running flume from inside a Claude Code session (a `!` command) is recorded as the unnamed agent. Acceptable: rare, and the safe direction (never the reverse).
- The session-id suffix makes unnamed agents traceable to a Claude Code session rather than all being one "unknown".

## Discussion (for reference, not authoritative)

### 2026-11-17, the human (verbatim)

> Flume should check for env vars that Claude sets and then know that this is an agent. Even if agent name is missing. Don't record something from an agent as human
