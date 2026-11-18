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
  backend: git@github.com:org/backend.git
  frontend: git@github.com:org/frontend.git
```

- `projects` maps each project's name to its git URL: one level, nothing deeper. The name is the project's folder in the workspace and its folder under `<flume-root>/projects/`.
- Edited by hand; `flume check` reports a project without a URL or a name that is not a valid folder name.

### flume init sets up the workspace

- Run in the workspace folder with the tasks repo already cloned there, `flume init --root <tasks-repo>` also clones each project in `flume.yaml` that is missing, into `<workspace>/<name>/`, with plain `git clone`.
- A project folder that already exists is left alone.
- A failed clone is reported by name and URL; init carries on with the rest and exits non-zero at the end.

### flume clone

- `flume clone <git-url> <workspace>`: the workspace path is required (`.` for the current folder); flume makes the folder if missing, clones the tasks repo into it, then runs `flume init` there (so: projects cloned, `.flume/config.yaml` written).
- It never starts the daemon; it ends by telling the human to run `flume serve` in the workspace.

### Assumed (advisor; change if wrong)

- Projects are cloned on their default branch; flume does no other git setup.

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
