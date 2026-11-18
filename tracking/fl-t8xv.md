+++
id = "fl-t8xv"
title = "flume agent entries: last_seen, updated by the daemon on each request from the agent"
kind = "feature"
state = "integrated"
created_at = "2026-11-18T02:31:09.895Z"
updated_at = "2026-11-18T02:43:31.312411070Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:last-seen",
]
branch = "bridle/last-seen"
commit = "5122f4b8562370e770c0a26f8d38c537878b5ceb"
summary = "Agent entries gain last_seen. Shared entry read/write in src/core/agents.ts (CLI and daemon both use it, failsafe yaml). Client sends X-Flume-Agent from AGENT_NAME on every request (src/daemon/client.ts); daemon touchSeen() on each request, existing entries only, other fields kept (server.ts). list has LAST-SEEN column ('-' if none); show includes it. Specs: agent.md r-e1c0, s-e1c1..4. Also: relaunch now keeps unknown entry fields via spread."
ticket = "t8xv"
+++

docs/tickets/open/flume-agent-entries-last-seen-updated-by-the-daemon-on-each-t8xv.md

## Thread

### note · external:advisor · 2026-11-18T02:33:01.665Z
readied by external:advisor

### note · external:advisor · 2026-11-18T02:33:01.686Z
Readied by human via advisor: "agree, no throttling, yes ready it; yes"

### note · external:orchestrator · 2026-11-18T02:38:48.871Z
From orchestrator: fl-t8xv planned and queued in the tier after fl-cpcu (same files). Sonnet (daemon request handling + entry writes). Start it after cpcu lands.

### note · agent:last-seen · 2026-11-18T02:42:59.776Z
built: a3d11e1 (branch bridle/last-seen)

### note · agent:last-seen · 2026-11-18T02:42:59.787Z
done: last_seen via X-Flume-Agent, shared src/core/agents.ts, list/show, specs s-e1c1..4; just check exit 0, 160 tests, spec check clean; a3d11e1

### note · agent:manager · 2026-11-18T02:43:29.357Z
integrated: 5122f4b8562370e770c0a26f8d38c537878b5ceb (branch bridle/last-seen)

### note · agent:manager · 2026-11-18T02:43:31.312Z
cleanup: removed agent last-seen, origin branch bridle/last-seen, branch bridle/last-seen
