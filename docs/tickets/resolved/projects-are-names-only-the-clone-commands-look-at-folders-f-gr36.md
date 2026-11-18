---
id: fl-gr36
title: "projects are names: only the clone commands look at folders; flume project clone replaces init --clone"
kind: fix
created: 2026-11-18
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-pshd, fl-mvu7]
resolved: 2026-11-18T03:57:23Z
---

## The ask

A project is a name; where its folder lives doesn't matter to flume. Only the commands whose job is cloning look at `<workspace>/<name>`. `flume init` and `flume project list` stop checking project folders, and `flume project clone` replaces `flume init --clone`. Changes fl-pshd's landed design.

For whoever edits this ticket (the human, 2026-11-17): "the design at the top is the currently agreed-upon design; keep it current and DO NOT include narration or restatements in the design. The discussion section can include the discussion narrative with restatements as a reference."

## Design

### Principle

- A project is a name in `flume.yaml`. Flume does not care where the project's folder is or what it is called, except in the commands that clone: `flume clone`, `flume project add <url>` and `flume project clone`, which put clones at `<workspace>/<name>`.

### Commands

- `flume init`: sets up the workspace only (`.flume/`, `.flume/config.yaml`, `flume.yaml` when missing). It does not read or check projects. `--clone` goes (an unknown option, exit 2).
- `flume project clone [<name>...]`: clones each named project (no names: every project in `flume.yaml`) into `<workspace>/<name>` (`git clone --branch <branch> <url>`, or plain `git clone <url>` with no branch). Skips, with a line saying so, a project whose folder exists and a project with no URL. A failed clone is reported on stderr with its name and URL and the rest carry on. Safe to re-run. Exit 0 when all went well, 1 when any clone failed, 2 for an unknown name or bad option. `--json` prints one record per project: name, and `cloned`, `skipped` (with the reason) or `failed`.
- `flume clone <tasks-repo-url> [<workspace>]`: clones the tasks repo, runs `flume init`, then `flume project clone` (all).
- `flume project add <url>`: unchanged (adds and clones).
- `flume project list`: name, url, branch only; no present/missing column, no folder check. Same in `--json`.

### Specs and docs

- Update the specs for init, clone, project list and add (rule specs-for-every-surface); remove init --clone's scenarios; add project clone's. Help texts and init's closing hint ("next: ...") updated to match.

## Discussion (for reference, not authoritative)

### 2026-11-17, the human (verbatim)

> Hmmm does it matter to flume where a project lives? Or if the project name matches its folder? Except for the helper clone command, it likely doesn't matter at all what the local file system looks like right?

Advisor checked the code: agent, prime, guide and tasks use the project name only; only clone, init --clone, project add and the present/missing check in project list and init look at `<workspace>/<name>`.

> Why does project list look for the project folder?

Advisor: the present/missing column was the advisor's addition to fl-pshd's design, not the human's ask.

> I'm not sure flume init should do that either frankly.

Advisor proposed: init does setup only; only clone, project add and a new project clone (replacing init --clone) look at folders; project list drops the column.

> Agree yes file it
