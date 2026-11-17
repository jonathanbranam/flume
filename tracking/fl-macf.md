+++
id = "fl-macf"
title = "flume agent: launch Claude as a named agent (replaces claude-as)"
kind = "feature"
state = "built"
created_at = "2026-11-17T12:06:56.999Z"
updated_at = "2026-11-17T12:10:16.615189258Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:agent-cmd",
]
priority = "urgent"
priority_at = "2026-11-17T12:07:35.902500294Z"
branch = "bridle/agent-cmd"
commit = "9427af2"
summary = "Added src/cli/agent.ts (flume agent launch/list/show, flume prime), wired in main.ts; spec design/specs/agent.md (14 scenarios, all bound in test/agent.test.ts with fake claude/tmux and temp HOME); README, docs/release.md, CHANGELOG. Pane rule: different recorded pane refuses unless --force, no liveness check. Caveat: unrecognized claude flags with separate values need flag=value or --."
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

### note · agent:agent-cmd · 2026-11-17T12:10:14.385Z
built: 9427af2 (branch bridle/agent-cmd)

### note · agent:agent-cmd · 2026-11-17T12:10:14.405Z
done: flume agent/list/show/prime built; just check exit 0, 115 tests, commit 9427af2 (main merged)

### note · agent:agent-cmd · 2026-11-17T12:10:16.615Z
Assumptions: one-off prompt is a bare arg before --; a value for an unrecognized claude flag must be written flag=value or after -- (a bare word like 'opus' would be taken as the name). Pane check has no tmux existence check, per the human's change (different pane -> refuse unless --force). prime with no name reads the pane or the saved project.
