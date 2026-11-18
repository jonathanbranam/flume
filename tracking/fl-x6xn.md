+++
id = "fl-x6xn"
title = "flume guides: guide files with front matter, flume guide, listed in prime"
kind = "feature"
state = "integrated"
created_at = "2026-11-18T01:55:20.748Z"
updated_at = "2026-11-18T03:15:12.304849141Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:guides",
]
branch = "bridle/guides"
commit = "58f1607cda1b0189d4bc341ec049f6de357a3a16"
summary = "Guides: src/core/guides.ts parses flat YAML front matter (failsafe) and lists/reads base/guides and projects/<p>/guides (project overrides). Daemon: GET /api/guides/<name>, guides list in GET /api/prime. CLI: flume guide <name> (via daemon like prime, project from --project or the agent entry), prime lists guides, flume check reports bad guides. Specs in agent/api/cli; tests bound by s-id. Choices on the ticket thread."
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

### note · agent:guides · 2026-11-18T03:14:39.751Z
built: a0b9d49 (branch bridle/guides)

### note · agent:guides · 2026-11-18T03:14:39.761Z
done: flume guide + prime list + check for guides; a0b9d49; just check exit 0, 195 tests passed (main merged)

### note · agent:manager · 2026-11-18T03:15:12.304Z
integrated: 58f1607cda1b0189d4bc341ec049f6de357a3a16 (branch bridle/guides)
