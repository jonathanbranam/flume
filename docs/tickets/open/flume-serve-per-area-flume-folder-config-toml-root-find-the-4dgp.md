---
id: fl-4dgp
title: "flume serve per area: .flume/ folder, config.toml root, find the server by walking up"
kind: feature
created: 2026-11-17
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-qgr7]
---

## The ask

Support the human's normal layout: one flume server per "area" (a folder of related repos), with the tasks in a separate task repo, found from anywhere inside the area. Replace today's daemon record in `.git/flume-daemon.json`.

The human, 2026-11-17 (verbatim excerpts):

> two basic options 1) flume in the same git repo; this is OK but has all the merge conflict problems; this is likely only for testing or very, very simple things 2) flume in a separate git repo - this is normally how I'll use flume

> proj-N here is a large, multi-repo project; repo-X is a actually a "project" in the flume sense; IDK what to call "proj-N" right now; I'll call it an area for now; I need one flume serve per area, that puts all flume tickets into proj-1-flume and never touches the other repos. I launch flume agent from proj-1/ folder and pass --project repo-a to it along with a name

> storing something inside the git repo doesn't really make sense to me, although it is true that each git repo must be associated with only one flume server

> let's just make a folder area-1/.flume/<stuff>

> for configuration though I want toml, not JSON; I hate JSON for config; config is either TOML or YAML ... I generally find toml much easier to edit and yaml ends up getting really deep and nested

> agree, daemon.json is not config, it can stay as JSON. agre on toml and agree that running 'flume serve' in area-1 after the setting the --root the first time should work.

## Layout

```
area-1/
  .flume/          flume's files for this area
  area-1-flume/    git repo: all of area-1's tasks
  repo-a/          code repos (each a flume "project")
  repo-b/
  repo-c/
```

## Design (agreed with the human)

1. **Serve from the area folder:** `cd area-1 && flume serve --root area-1-flume`. Tasks are written and committed only in the task root; flume never touches the other repos. `flume serve` no longer requires the current folder to be a git repo (the task root must be one).
2. **`area-1/.flume/`** (the folder where `flume serve` runs) holds flume's files. `flume serve` creates it when missing, with a `.gitignore` containing `*`, so it stays out of git even inside a repo.
   - `daemon.json`: runtime state written and removed by the server (address, pid, root). Not config; stays JSON.
   - `config.toml`: human-editable config, TOML. First key: `root = "area-1-flume"` (task root, relative to the area folder).
3. **Root remembered:** `flume serve --root PATH` saves `root` in `config.toml`; later `flume serve` in that folder with no `--root` uses it. With neither, the task root is the current folder's git repo (same-repo mode).
4. **Finding the server:** every flume command looks upward from the current folder for the nearest `.flume/daemon.json`. An agent in `area-1/` or `area-1/repo-a/src` reaches area-1's server. None found: the not-running message (fl-qgr7).
5. **One server per area:** a second `flume serve` in a folder whose `.flume/daemon.json` names a live server is refused, as today.
6. **Agents:** `cd area-1 && flume agent --name bob --project repo-a`; the agent's flume commands reach area-1's server from anywhere inside `area-1/`.
7. **Same-repo mode:** `flume serve` inside a repo with no `--root` and no config: `.flume/` at the current folder, tasks in that repo.
8. **`FLUME_URL`** still overrides discovery.
9. The `.git/flume-daemon.json` record is dropped (no migration: flume is days old).
10. Specs (cli.md serve/status/stop, api.md assumptions) and tests updated in the same change.

## Assumptions (assume-and-record)

- **TOML parser:** add one small, dependency-free pure-JS runtime dependency (e.g. smol-toml); installs through Artifactory with `npm ci` like `yaml`. Rule built-for-the-work-sandbox.
- **`--root` given and different from config:** `--root` wins and is saved.
- **`root` in config is relative to the folder holding `.flume/`;** an absolute path also works.
- **Out of scope:** a project field on tasks (repo-a vs repo-b), naming the "area" concept for good.
