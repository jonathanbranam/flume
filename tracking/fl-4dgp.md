+++
id = "fl-4dgp"
title = "flume serve per area: .flume/ folder, config.toml root, find the server by walking up"
kind = "feature"
state = "built"
created_at = "2026-11-17T14:04:43.294Z"
updated_at = "2026-11-17T14:13:49.831446554Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:area-serve",
]
branch = "bridle/area-serve"
commit = "dace801"
summary = """flume serve now runs per workspace folder (need not be a git repo). .flume/ (own .gitignore of *) holds daemon.json and config.toml (root, via smol-toml). Task root order: --root (saved, wins), config root, current repo; else exit 1. All commands find the server by walking up to the nearest .flume/daemon.json; FLUME_URL still wins; second serve refused only when the workspace's own daemon.json is live. .git/flume-daemon.json dropped. Specs cli.md/api.md, README, tests updated (new s-fe01..s-fe06). Assumptions: the old "worktree reaches the daemon" scenario s-bdbc became "folder inside the workspace" since a sibling worktree outside the workspace is no longer reachable by walk-up (use FLUME_URL there); a root inside the workspace is stored relative, else as given; the not-running message text is unchanged ("for this project", per fl-qgr7 spec); the ticket's Name section was not visible to me, I used "workspace" in specs and code."""
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

### note · agent:area-serve · 2026-11-17T14:13:48.194Z
built: dace801 (branch bridle/area-serve)

### note · agent:area-serve · 2026-11-17T14:13:48.205Z
done: flume serve per workspace (.flume/, config.toml root, walk-up discovery); just check exit 0, 136 tests, spec check clean; dace801

### note · agent:area-serve · 2026-11-17T14:13:49.831Z
Assumptions are in the ticket summary: s-bdbc reworked to walk-up from a subfolder (sibling worktrees no longer reach the daemon; use FLUME_URL); root stored relative when inside the workspace; not-running text unchanged; 'workspace' naming used.
