---
id: fl-3pfa
title: "flume layouts: everything in a flume/ folder, or everything at the repo top level, chosen at init"
kind: feature
created: 2026-11-17
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: []
---

## The ask

Two layouts for flume's files in a repo, chosen at `flume init`. Do NOT build yet (the human, 2026-11-17: "Don't build it yet. Don't need to build anything quite yet, but let's make a ticket for this folder structure and then document what I just said.").

The human, 2026-11-17 (verbatim excerpts, from voice):

> two things on that folder structure that I want to address: 1. Workflow should be inside of Flume, or none of it should be inside of Flume. 2. This doesn't reflect distinct projects.

> I think we just need two different behaviors: the behavior of Flume when it's inside of a repo, or this could just be an option when you run in it.
> 1. Everything inside of a Flume folder. Everything inside of a Flume folder means just that: everything's inside of a Flume folder, so it would be Flume tasks, Flume workflow. That would be pretty common for a single repo setup where we're going to put all of our Flume-related things inside of a specific folder.
> 2. No Flume folder. In that case, all of the Flume-related stuff goes at the top level of the repo. That's an option people can just choose during init.

Today (fl-7sme): tasks in `<root>/flume/tasks/`, workflow in `<root>/workflow/` (base in `<root>/workflow/base/`): mixed, which item 1 rejects.

## Design (draft, for the human)

| layout | tasks | workflow | base workflow |
|---|---|---|---|
| folder | `<repo>/flume/tasks/` | `<repo>/flume/workflow/` | `<repo>/flume/workflow/base/` |
| top | `<repo>/tasks/` | `<repo>/workflow/` | `<repo>/workflow/base/` |

- Chosen at `flume init` (e.g. `--layout folder|top`); one layout per repo, everything follows it.
- Likely use: folder for a single repo that holds both code and flume; top for a dedicated tasks repo (e.g. `fluff-flume/`).

## Open points (advisor, to settle before ready)

1. **Where the layout is recorded.** `.flume/config.toml` is machine-local and not versioned; a second clone (or work vs home) must find the same layout. Options: detect from the repo (a `flume/` folder at the top means folder layout), or a small versioned marker file in the repo.
2. **Project repos.** Projects never run `flume init`. Which layout does `backend/` use for its project workflow: the same as the workspace, or detected per repo (`backend/flume/workflow/` if present, else `backend/workflow/`)?
3. **Default** when `--layout` is not given: folder (today's tasks path) is the safer default.
4. **Top layout in a code repo** can clash with an existing `tasks/` or `workflow/` folder; init should refuse when one exists and is not flume's.
5. **Migration:** existing repos from fl-7sme (tasks in flume/tasks, workflow at top) are a mixed layout; flume is days old, so a one-time manual move is fine.

Separate, not in this ticket: multi-project task layout (distinct projects' tasks in one tasks repo), to be talked through next.
