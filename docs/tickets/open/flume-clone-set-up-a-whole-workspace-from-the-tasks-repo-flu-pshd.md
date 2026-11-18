---
id: fl-pshd
title: "flume clone: set up a whole workspace from the tasks repo; flume.yaml lists projects and repos"
kind: feature
created: 2026-11-18
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: [fl-3pfa]
related: [fl-3pfa]
---

## The ask

Set up a whole workspace from the tasks repo: `flume.yaml` lists the projects and their git repos, and `flume clone <git-url>` does everything. On hold until the human says build.

For whoever edits this ticket (the human, 2026-11-17): "the design at the top is the currently agreed-upon design; keep it current and DO NOT include narration or restatements in the design. The discussion section can include the discussion narrative with restatements as a reference."

## Design

### flume.yaml lists the projects

```yaml
dir: flume
projects:
  backend:
    url: git@github.com:org/backend.git
    branch: main
  frontend:
    url: git@github.com:org/frontend.git
    branch: develop
```

- `projects` maps each project's name to a dict with `url` (the git URL) and `branch`. Nothing deeper. The name is the project's folder in the workspace and its folder under `<flume-root>/projects/`.
- Edited by hand; `flume check` reports a project without a `url`, or a name that is not a valid folder name.

### flume init

`flume init [--root PATH] [--clone]`, run in the workspace folder (which need not be a git repository), does exactly this, in order:

1. **Finds the task root**: `--root PATH`, else `root` in `.flume/config.yaml`, else the git repository the current folder is in (its main checkout). When there is none, or it is not a git repository: error on stderr saying there is no task root, exit 1, nothing created.
2. **Makes `.flume/`** in the workspace folder (if missing), with a `.gitignore` holding `*`.
3. **Writes `.flume/config.yaml`** with `root: <path>` when `--root` is given (relative to the workspace folder when inside it); without `--root` it keeps the file as it is.
4. **Writes `flume.yaml`** at the task root's top with `dir: flume` when it has none, and commits it there as one commit. An existing `flume.yaml` is read, never changed.
5. **Checks the projects** in `flume.yaml`'s `projects`: each one with no folder at `<workspace>/<name>/` is missing.
   - Without `--clone`: prints each missing project's name and URL, and a line saying `flume init --clone` clones them. Clones nothing.
   - With `--clone`: clones each missing project into `<workspace>/<name>/` with `git clone --branch <branch> <url>` (plain `git clone <url>` when `branch` is not set). A failed clone is reported on stderr with its name and URL; init carries on with the rest.
   - A folder that already exists is left alone either way.
6. **Prints** what it did (workspace, task root, each project cloned, already there or missing) and ends by telling the human to run `flume serve` in the workspace.

- Exit codes: 0 when all went well (missing projects without `--clone` are not an error); 1 when there is no task root or any clone failed; 2 for a bad option (unknown option, `--root` without a path).
- Running it again in a set-up workspace is safe: it repeats the steps, so it reports (or with `--clone`, clones) any project added to `flume.yaml` since, and changes nothing else.
- It never: starts the daemon, pushes, runs `git init`, copies a base workflow (the built-in text lives in flume; fl-3pfa), writes anything in a project repo, or creates task folders (flume makes those when a task is first written).

### flume clone

- `flume clone <git-url> [<workspace>]`: the workspace is the current folder, or `<workspace>` when given (as `git init [<dir>]`); flume makes the folder if missing, clones the tasks repo into it under the repo's own name (`<workspace>/fluff-flume/`), then runs `flume init --clone` there (so: projects cloned, `.flume/config.yaml` written).
- It never starts the daemon; it ends by telling the human to run `flume serve` in the workspace.

### Assumed (advisor; change if wrong)

- `branch` is optional; without it the clone takes the repo's default branch. Flume does no other git setup.
- Running init again is allowed (step list above) instead of today's "already set up" error, because fl-3pfa drops `--force` and a re-run is how newly listed projects are found.
- Init commits `flume.yaml` when it writes one (as today's init commits the base workflow) and does not create empty task folders (git can't hold empty folders).

## Discussion (for reference, not authoritative)

### 2026-11-17, the human (verbatim)

> flume.yaml should list the projects as well including their git repos. If I clone done fluff-flume, I want a flume command to set up the entire workspace.
>
> Honestly, even better would be `flume clone <git-url>` to the fluff-flume repo and everything happens!!

### Advisor notes

- Needs `flume.yaml` from the layout ticket fl-3pfa.
- The human asked for flat YAML ("avoid nestings"); a name-to-URL map is the one level a project list needs.
- `flume clone` is `git clone` plus `flume init`, so a second machine and a fresh clone take the same path.

### Settled: workspace path

1. Where `flume clone` puts the workspace with no `<workspace>` argument: (a) the current folder is the workspace (run it in an empty `fluff/`), or (b) a new folder named after the repo with `-flume` cut off (`fluff-flume` -> `fluff/`). (b) is a guess from a naming habit; (a) is plain. Advisor: (a).

The human, 2026-11-17: "follow git init convention. AFAIK it is git init . -- the path is required"

Advisor note: in git itself the path is optional for both `git init` (defaults to the current folder) and `git clone` (defaults to the repo's name). Advisor took the human's intent, an explicit path with no default, and made `<workspace>` required; `flume clone <url> .` uses the current folder. Change if the human wants git's optional form.

The human, 2026-11-17: "hmm.. yeah I don't typically want <workspace> and <fluff-flume> to be the same name."

Advisor: so no default from the repo's name (git clone's default would name the workspace `fluff-flume`); the required path stands. The workspace and the tasks repo are different folders: `flume clone <url> fluff` gives `fluff/fluff-flume/`.

The human, 2026-11-17: "so... hmmm.. I think `flume clone <git-url>` then should target the current folder."

Settled: with no path, the current folder is the workspace; an optional path works like `git init [<dir>]`. This replaces the required path above.

The human, 2026-11-17: "add to that ticket exactly what flume init does as well, even if it is unchanged"

Advisor: the Design's flume init section now lists every step, including what is unchanged from today's init (task root lookup, `.flume/` with its `.gitignore`, `config.yaml` root, never push or git init). Changed from today: no base workflow copy, no `--force`, re-run allowed, `flume.yaml` written, projects cloned.

The human, 2026-11-17: "I don't think flume init should clone by default. I think it should print a message for missing projects and support an optional `--clone` to clone them"

Settled: `flume init` reports missing projects; `flume init --clone` clones them; `flume clone` runs `flume init --clone`.

The human, 2026-11-17: "in flume.yaml, <project> should be a dict. then have the url and branch"

Settled: each project is `{url, branch}`. This replaces the name-to-URL map above.
