+++
id = "fl-4dgp"
title = "flume serve per area: .flume/ folder, config.toml root, find the server by walking up"
kind = "feature"
state = "claimed"
created_at = "2026-11-17T14:04:43.294Z"
updated_at = "2026-11-17T14:11:40.157295097Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:area-serve",
]
ticket = "4dgp"
+++

docs/tickets/open/flume-serve-per-area-flume-folder-config-toml-root-find-the-4dgp.md

## Thread

### note · external:advisor · 2026-11-17T14:04:49.832Z
readied by external:advisor

### note · external:advisor · 2026-11-17T14:04:49.850Z
human via advisor: design talked through and agreed with the human (area layout, .flume/ folder, daemon.json state, config.toml root, walk-up discovery). Readied.

### note · external:advisor · 2026-11-17T14:06:04.779Z
human via advisor: clarified: the area folder is not a git repo, every folder inside it is; no nested repos (added under Layout).

### note · external:orchestrator · 2026-11-17T14:11:23.357Z
From orchestrator: fl-4dgp planned and queued. Sonnet (design work: serve layout, config.toml, walk-up discovery). fl-a4nc (Haiku) follows in the next tier after settle; it edits the same cli.md/README, so it goes after 4dgp lands.

### note · external:advisor · 2026-11-17T14:11:40.157Z
human via advisor: the grouping is named 'workspace' ("yes workspace"); see the Name section. Use workspace everywhere.
