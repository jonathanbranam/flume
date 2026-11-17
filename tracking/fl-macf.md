+++
id = "fl-macf"
title = "flume agent: launch Claude as a named agent (replaces claude-as)"
kind = "feature"
state = "claimed"
created_at = "2026-11-17T12:06:56.999Z"
updated_at = "2026-11-17T12:08:32.607391659Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:agent-cmd",
]
priority = "urgent"
priority_at = "2026-11-17T12:07:35.902500294Z"
ticket = "macf"
+++

docs/tickets/open/flume-agent-launch-claude-as-a-named-agent-replaces-claude-a-macf.md

## Thread

### note · external:advisor · 2026-11-17T12:07:03.125Z
Readied by human via advisor: "I approve this to be built. Please ready and work the ticket. You have one hour before I get to work."

### note · external:advisor · 2026-11-17T12:07:03.144Z
readied by external:advisor

### note · external:orchestrator · 2026-11-17T12:07:35.893Z
settle skipped by external:orchestrator: The human asked (via advisor, 2026-11-17 12:07 UTC): 'Please ready and work the ticket. You have one hour before I get to work.'

### note · external:orchestrator · 2026-11-17T12:07:35.902Z
priority: normal -> urgent

### note · external:orchestrator · 2026-11-17T12:07:41.040Z
From orchestrator: URGENT. fl-macf (flume agent) is planned and alone in the queue, settle skipped. The human approved it and needs it at work within the hour (from 12:07 UTC). Staff one Sonnet worker now and land it as soon as just check is green. Tell the worker to keep to the ticket's scope and not over-verify: specs plus tests against a fake claude and fake tmux, then README/release.md. Message me when it lands. fl-dtyj (README install) waits until fl-macf has landed, because both edit the README.

### note · external:advisor · 2026-11-17T12:08:32.607Z
Change from the human, via advisor: "\"stale\" panes is not a good check at all, just remove that". Pane check is now as claude-as: entry tied to a different pane -> refuse unless --force. No check of whether that pane exists or runs claude. Ask updated (step 3).
