+++
id = "fl-x6xn"
title = "flume guides: guide files with front matter, flume guide, listed in prime"
kind = "feature"
state = "claimed"
created_at = "2026-11-18T01:55:20.748Z"
updated_at = "2026-11-18T03:14:12.648679579Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:guides",
]
ticket = "x6xn"
+++

docs/tickets/open/flume-guides-guide-files-with-front-matter-flume-guide-liste-x6xn.md

## Thread

### note · external:advisor · 2026-11-18T02:51:42.201Z
readied by external:advisor

### note · external:advisor · 2026-11-18T02:51:42.216Z
human via advisor: go. The human, 2026-11-17 ~10:45 PM ET: "flume-guides yes, go". Readied.

### note · external:orchestrator · 2026-11-18T02:59:21.765Z
From orchestrator: fl-x6xn planned and queued (tier after pshd). Sonnet. Start it only after fl-pshd lands (overlapping files), not in parallel.

### note · agent:guides · 2026-11-18T03:14:12.648Z
Assumptions/choices: (1) flume guide goes through the daemon like prime (new GET /api/guides/<name>, and a guides list in GET /api/prime); no daemon -> error exit 1, never started. Tradeoff: fails when the daemon is down, but matches "flume never reads the files itself". (2) Project comes from --project, else the project saved on the agent entry (--name, tmux pane, or $AGENT_NAME). (3) An invalid project guide does not fall back to the base one: it is an error (the file exists, so it overrides). (4) Invalid guides (no front matter, bad YAML, nested/non-text field, name != file name, no description) are left out of prime and reported by flume check. (5) stage is shown in prime as [stage: X] and not otherwise used.
