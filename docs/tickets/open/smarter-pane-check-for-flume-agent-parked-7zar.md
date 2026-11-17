---
id: fl-7zar
title: Smarter pane check for flume agent (parked)
kind: feature
created: 2026-11-17
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-macf]
---

## The ask

Parked idea, to evaluate later: a smarter pane check for `flume agent`, so that a launch is refused
only when the agent is really alive in another pane.

The human, 2026-11-17: "\"stale\" panes is not a good check at all, just remove that" and then
"Park the idea and we can come back to it later and evaluate". Don't build until the human picks it up.

What fl-macf does instead: as `claude-as`, an entry tied to a different pane is refused unless
`--force`. The cost: `--force` after every tmux restart or moved window.

Options discussed (advisor, 2026-11-17):

1. Pane-gone check (the dropped "stale" rule): take over when the saved pane ID no longer exists.
   Flawed: tmux reuses pane IDs after a server restart, so `%12` can be an unrelated pane; and a
   pane that exists but no longer runs the agent still blocks.
2. Real-conflict check: refuse only when another pane both carries `@flume_agent=<name>` and is
   running `claude` now; anything else is taken over with a note. Avoids ID reuse. Cost: a tmux
   query per launch and a rule that is harder to predict.
3. Heartbeat-based: refuse when the agent was seen recently (needs the heartbeat, not built).
