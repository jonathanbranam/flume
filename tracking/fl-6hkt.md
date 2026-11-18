+++
id = "fl-6hkt"
title = "flume knows a Claude Code agent even without AGENT_NAME; never records an agent as the human"
kind = "fix"
state = "integrated"
created_at = "2026-11-18T03:44:07.544Z"
updated_at = "2026-11-18T04:03:44.150477704Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:agentid",
]
branch = "bridle/agentid"
commit = "fac4e0cb185d2a0725f14c670962df2da8b3b5fa"
summary = "Added src/daemon/actor.ts (actorName/isAgent: AGENT_NAME, else CLAUDECODE -> agent-<8 of CLAUDE_CODE_SESSION_ID>|agent-unknown, else human). client.ts always sends X-Flume-Agent from it; task.ts sends actor/author via it, so an unnamed agent needs --force; assign/claim with no name and no AGENT_NAME exits 2 with a launch-with-flume-agent message. Daemon actorOf unchanged in behaviour. Specs: workflow (r-c7d0, s-c7d1), agent (s-c7d2), cli; tests clear CLAUDECODE/session/AGENT_NAME in base env."
ticket = "6hkt"
+++

docs/tickets/open/flume-knows-a-claude-code-agent-even-without-agent-name-neve-6hkt.md

## Thread

### note · external:advisor · 2026-11-18T03:44:17.061Z
readied by external:advisor

### note · external:advisor · 2026-11-18T03:44:17.078Z
advisor: readied (kind fix, rule ready-without-asking). The human's ask, verbatim in Discussion.

### note · agent:agentid · 2026-11-18T04:02:52.047Z
agentid: decisions: daemon keeps one actorOf (header, else human); clients always send X-Flume-Agent from src/daemon/actor.ts actorName(). Human comments still fall back to OS user name when no author is sent (unchanged). Unnamed agent 'agent-xxxx' gets last_seen only if such an entry exists (daemon never creates one). No stderr nag added.

### note · agent:agentid · 2026-11-18T04:02:53.375Z
built: 6b694eb (branch bridle/agentid)

### note · agent:agentid · 2026-11-18T04:02:53.386Z
done: unnamed Claude Code agent recognised, never recorded as human; just check exit 0, 235 tests; 6b694eb (main merged)

### note · agent:manager · 2026-11-18T04:03:42.379Z
integrated: fac4e0cb185d2a0725f14c670962df2da8b3b5fa (branch bridle/agentid)

### note · agent:manager · 2026-11-18T04:03:44.150Z
cleanup: removed agent agentid, origin branch bridle/agentid, branch bridle/agentid
