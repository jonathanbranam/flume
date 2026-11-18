---
id: fl-3pfa
title: "flume layout: one flume root in the tasks repo, prime prints the workflow, tasks as folders"
kind: feature
created: 2026-11-17
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-7sme, fl-x6xn, fl-fu3v]
---

## The ask

Build the design below. It is the agreed design: where the Discussion section disagrees, the Design wins. On hold until the human says build (the human, 2026-11-17: "Don't build it yet").

For whoever edits this ticket (the human, 2026-11-17): "the design at the top is the currently agreed-upon design; keep it current and DO NOT include narration or restatements in the design. The discussion section can include the discussion narrative with restatements as a reference."

## Design

### Files and folders

```
<workspace>/                     folder of related repos; not a git repo
|-- .flume/
|   |-- config.yaml              root: fluff-flume   (machine-local, not versioned)
|   `-- daemon.json              daemon state (unchanged)
|-- backend/                     project repos: nothing flume-related in them
`-- fluff-flume/                 the tasks repo
    |-- flume.yaml               dir: flume   (versioned; "." = the repo top)
    `-- flume/                   <flume-root>
        |-- base/                workspace-wide layer
        |   |-- workflow.md
        |   |-- roles/
        |   |   `-- <role>.md
        |   `-- guides/
        |       `-- <guide>.md
        |-- projects/
        |   `-- <project>/       project layer; overrides base/
        |       |-- workflow.md
        |       |-- roles/
        |       |   `-- <role>.md
        |       `-- guides/
        |           `-- <guide>.md
        `-- tasks/
            |-- open/
            |   `-- <slug>-<id>/
            |       |-- task.yaml     the task's fields
            |       |-- body.md       the ask; the task's root file
            |       |-- comments.md   the comments
            |       `-- ...           spec artifacts, attachments (images, CSVs)
            `-- resolved/
                `-- <slug>-<id>/      same as open/
```

### Config

- Every flume file with fields is YAML, as flat as possible: no nesting. Flume no longer uses TOML.
- `flume.yaml` sits at the top of the tasks repo and is versioned, so every clone finds the same layout. Its one key is `dir`: the flume-root folder's name, `flume` or `.` (the repo top itself).
- `.flume/config.yaml` in the workspace folder is machine-local and holds only `root`, the tasks repo.
- Nothing flume-related goes in a project repo. A project's own CLAUDE.md stays the project's.

### Prime

- Agents never read workflow, role or guide files; they run `flume`. `flume prime` asks the daemon (project name and role) and prints the whole text to stdout, in this order, later overriding earlier:
  1. flume's built-in base text (ships inside flume; not copied into any repo)
  2. `base/workflow.md`
  3. `projects/<project>/workflow.md`
  4. `base/roles/<role>.md`, then `projects/<project>/roles/<role>.md`, when a role is given
  5. the guides available (ticket fl-x6xn)
- A missing file is skipped without an error.
- The current prime line "Workflow: read the .md files in ..." goes.

### Roles

- A role is a file. Flume keeps no list of roles: the files in `roles/` (in `base/` and the project's folder) are the roles there are.

### Guides and workflow

- Guides (files, front matter, `flume guide`, prime's list): ticket fl-x6xn. Workflow steps: ticket fl-fu3v. This ticket only makes their folders part of the layout.

### Tasks

- A task is a folder, `tasks/open/<slug>-<id>/` (moved to `tasks/resolved/` when resolved).
- `task.yaml` holds the fields that were front matter (id, title, status, dates, ...), flat YAML. Flume writes it on status changes, so a status change never touches `body.md`.
- `body.md` is the ask, with no front matter.
- `comments.md` holds the comments, `### <time>, <author>` headers as today (fl-ha4p).
- Any other file in a task folder (spec artifacts, attachments) is not flume's: flume leaves it alone and moves it with the folder.

### init

- `flume init` no longer copies a base workflow; the built-in text lives in flume. With nothing to rewrite, `init --force` goes.

### Assumed (advisor; change if wrong)

- How the role gets to prime: `flume agent --role <role>` passes it; with no role, prime prints no role part.
- How init picks the folder: `flume init --root <repo> [--dir <name>]`, default `flume`; init writes `flume.yaml` if missing and creates `<flume-root>/tasks/open/` and `resolved/`.
- Tasks of several projects share the one `tasks/` folder, with a `project` field in `task.yaml` (advisor's pick, not yet confirmed by the human).
- Existing workspaces move by hand once, including renaming `.flume/config.toml` to `config.yaml`; no migration command (flume is days old).
- `.flume/daemon.json` stays JSON: it is the daemon's state, not config.

### Not in this ticket

- The pluggable spec system (OpenSpec-like) that writes spec artifacts into task folders: its own ticket, later.

### Specs

- Per rule specs-for-every-surface, the change updates the specs for init, prime, agent, the task file format and the config files, with tests.

## Discussion (for reference, not authoritative)

How the design was reached, kept for the record. Older sections below were overruled by later ones; the Design above is the result.

### Original ask

Two layouts for flume's files in a repo, chosen at `flume init`. Do NOT build yet (the human, 2026-11-17: "Don't build it yet. Don't need to build anything quite yet, but let's make a ticket for this folder structure and then document what I just said.").

The human, 2026-11-17 (verbatim excerpts, from voice):

> two things on that folder structure that I want to address: 1. Workflow should be inside of Flume, or none of it should be inside of Flume. 2. This doesn't reflect distinct projects.

> I think we just need two different behaviors: the behavior of Flume when it's inside of a repo, or this could just be an option when you run in it.
> 1. Everything inside of a Flume folder. Everything inside of a Flume folder means just that: everything's inside of a Flume folder, so it would be Flume tasks, Flume workflow. That would be pretty common for a single repo setup where we're going to put all of our Flume-related things inside of a specific folder.
> 2. No Flume folder. In that case, all of the Flume-related stuff goes at the top level of the repo. That's an option people can just choose during init.

Today (fl-7sme): tasks in `<root>/flume/tasks/`, workflow in `<root>/workflow/` (base in `<root>/workflow/base/`): mixed, which item 1 rejects.

### Design (draft, for the human)

| layout | tasks | workflow | base workflow |
|---|---|---|---|
| folder | `<repo>/flume/tasks/` | `<repo>/flume/workflow/` | `<repo>/flume/workflow/base/` |
| top | `<repo>/tasks/` | `<repo>/workflow/` | `<repo>/workflow/base/` |

- Chosen at `flume init` (e.g. `--layout folder|top`); one layout per repo, everything follows it.
- Likely use: folder for a single repo that holds both code and flume; top for a dedicated tasks repo (e.g. `fluff-flume/`).

### Open points (advisor, to settle before ready)

1. **Where the layout is recorded.** `.flume/config.toml` is machine-local and not versioned; a second clone (or work vs home) must find the same layout. Options: detect from the repo (a `flume/` folder at the top means folder layout), or a small versioned marker file in the repo.
2. **Project repos.** Projects never run `flume init`. Which layout does `backend/` use for its project workflow: the same as the workspace, or detected per repo (`backend/flume/workflow/` if present, else `backend/workflow/`)?
3. **Default** when `--layout` is not given: folder (today's tasks path) is the safer default.
4. **Top layout in a code repo** can clash with an existing `tasks/` or `workflow/` folder; init should refuse when one exists and is not flume's.
5. **Migration:** existing repos from fl-7sme (tasks in flume/tasks, workflow at top) are a mixed layout; flume is days old, so a one-time manual move is fine.

Separate, not in this ticket: multi-project task layout (distinct projects' tasks in one tasks repo), to be talked through next.

### Decisions, 2026-11-17 (the human, verbatim)

> Good point on the config. It should indicate whether we're using top level or nested structure. It can just list the folder name. "." For top level or "flume".

> Ok. I think for v1 let's put all the flume stuff in the flume repo. I'm not sure on the structure for workflow yet but let's try Flume-root/project/* for project level overrides. Base is Flume-root/base

### Resulting v1 layout (advisor's reading; settles open points 1 and 2)

`<flume-root>` is the flume folder in the tasks repo: the repo top (`.`) or `<repo>/flume/`.

```
<flume-root>/
  base/          flume's shipped workflow (flume init writes; --force rewrites)
  workflow/      workspace rules (assumed: unchanged from fl-7sme)
  <project>/     project overrides, one folder per project, e.g. backend/
  tasks/         task files (open/, resolved/)
```

- **Nothing flume-related in the project repos** for v1; project rules move from `<repo>/workflow/` to `<flume-root>/<project>/`.
- **Layout recorded in a versioned file** in the tasks repo, so every clone agrees: assumed `<repo>/flume.toml` at the repo top with `dir = "flume"` or `dir = "."`. Written by `flume init`; read by serve, check and agent. `.flume/config.toml` (machine-local) keeps only `root`.
- **Prime reading order:** `<flume-root>/base/`, then `<flume-root>/workflow/`, then `<flume-root>/<project>/`, then the project's CLAUDE.md; later overrides earlier.

Open (advisor): a project named `base`, `workflow` or `tasks` would collide; init/check should refuse those names, or projects could live under `<flume-root>/projects/<project>/` instead. Workspace rules folder name is unconfirmed by the human.

### Decision: projects under projects/ (2026-11-17)

The human: "Sure projects in projects/ folder." (Settles the name-collision point.)

```
fluff-flume/
  flume.toml           dir = "flume"   (or ".")
  flume/               <flume-root>
    base/              flume's shipped workflow
    workflow/          workspace rules
    projects/
      backend/         project overrides
      frontend/
    tasks/
      open/
      resolved/
```

Prime reading order: base/, workflow/, projects/<project>/, then the project repo's CLAUDE.md.

### Decision: prime builds the workflow; final layout (2026-11-17 ~8:45 PM ET)

The human, verbatim:

> why is an agent reading the files at all, that's not the design actually.
>
> What happens is that flume constructs the workflow itself by calling the daemon. So, `flume prime` calls the daemon's API and passes in the project name and role. flume prime then constructs the prime message by
>
> 1. Returning the base workflow from within flume
> 2. Then returning the flume workspace workflow
> 3. Then returning the flume project workflow
>
> the flume CLI then just prints all of that out to `stdout` for the agent to read. Agents don't read files, they call `flume`
>
> Also, yes, let's have it like this:
>
> ```
> .flume/config.toml # root=fluff-flume
> fluff-flume/
>  flume.toml # dir=flume
>  flume/
>   base/workflow.md
>   projects/<name>/workflow.md
>   tasks/[open|resolved]/slug-id/
>     body.md
>     comments.md
>   <other task-related files>
> ```

This replaces the "Resulting v1 layout" and "projects under projects/" sections above.

#### Layout (cleaned up)

The human: "'other task related files' should be indented to indicate they are inside of slug-id ... please make that directory structure nicer-looking, i was just typing and being quick"

```
<workspace>/
|-- .flume/
|   `-- config.toml            root = "fluff-flume"   (machine-local)
`-- fluff-flume/               tasks repo
    |-- flume.toml             dir = "flume"   (versioned; "." = repo top)
    `-- flume/                 <flume-root>
        |-- base/
        |   |-- workflow.md    workspace-wide workflow
        |   |-- roles/
        |   |   `-- <role>.md
        |   `-- guides/
        |       `-- <guide>.md
        |-- projects/
        |   `-- <project>/
        |       |-- workflow.md
        |       |-- roles/
        |       |   `-- <role>.md
        |       `-- guides/
        |           `-- <guide>.md
        `-- tasks/
            |-- open/
            |   `-- <slug>-<id>/
            |       |-- task.toml      fields: id, title, status, ...
            |       |-- body.md        the ask (root file of the task)
            |       |-- comments.md
            |       `-- ...    spec artifacts, attachments (images, CSVs)
            `-- resolved/
                `-- <slug>-<id>/   (same as open/)
```

#### What this means (advisor's reading)

- **Prime prints the workflow text, it does not point at files.** `flume prime` asks the daemon (project name and role) and prints, in order: flume's built-in base workflow, the workspace workflow, the project workflow. Agents never read workflow files; they run `flume prime`. Today's prime (`src/cli/agent.ts`, the "Workflow: read the .md files in ..." line) tells agents to read files; that goes.
- **Built-in base comes from the flume install**, not a copy in the tasks repo. So `flume init` no longer copies `workflow/base/`, and `init --force` loses its reason to exist (it only rewrote base).
- **No separate `workflow/` folder.** The layout has `base/` and `projects/` only.
- **Tasks become folders**: `tasks/open/<slug-id>/body.md` and `comments.md`, instead of one `<slug-id>.md` file with a `## Comments` section (changes fl-ha4p's format and the task file format spec).
- **Role** is a new input to prime; flume has no roles today.

#### Open (advisor, to confirm with the human)

1. `<flume-root>/base/workflow.md`: is this the **workspace** workflow (step 2), with the built-in base (step 1) living only inside flume? Advisor's reading: yes; otherwise the built-in base exists twice. If so, `base/` might be better named `workspace/` to avoid confusion with the built-in base.
2. Roles: which roles, and where does a role's workflow live (e.g. `base/roles/<role>.md`)? Or is role passed now and used later (YAGNI)?
3. Task folder: where does the front matter (id, title, status) go: top of `body.md`? Other task files live inside the task's folder (settled); what they are (attachments?) is open.
4. Does `flume.toml` live only at the tasks-repo top and `.flume/config.toml` only in the workspace folder? (Advisor: yes, as drawn.)

#### The human, 2026-11-17 (on open point 1)

> This will be the same structure once we add rules, they will be inside of base/ or project/<project>/

Advisor's reading: the folder stays named `base/` (no rename to `workspace/`). It is the workspace-wide layer in the tasks repo; `projects/<project>/` is the project layer. Rules, when they come, go in the same two places (e.g. `base/rules/`, `projects/<project>/rules/`), and prime prints them the same way. Flume's built-in text (step 1) stays inside flume and is printed first.

#### Decision: task fields in task.toml (2026-11-17)

The human, verbatim:

> I was imagining body.md as the "root" file of the task. It could even be "task.md" but that felt odd to repeat the name. I was thinking the frontmatter went inside body.md, but with a folder that isn't necessary, we can have <slug-id>/something.yaml with the frontmatter. not sure the best name? definition.yml? task.yml? suggest some options

Advisor offered task.toml / meta.toml / fields.toml / keep front matter in body.md, recommending task.toml. On TOML vs YAML the human said: "I'm honestly on the fence between the two ... Most config just doesn't need too much structure which is why toml feels easier. OTOH I generally like the convenience of yaml everywhere, one solution". Advisor: flume's config is already TOML (one format, no new package through the work mirror), task fields are flat, and YAML's implicit typing (unquoted `no` -> false, an id like `12e4` -> a number) is guessing.

> sure, we can always migrate easily later. toml it is

Result:

- Each task folder holds `task.toml` (the fields that were front matter: id, title, status, dates, ...), `body.md` (the ask; no front matter) and `comments.md`.
- Flume writes `task.toml` (status changes, resolve) without touching `body.md`, so body edits and status flips never conflict.
- Tradeoff accepted: Obsidian no longer shows the fields as properties.
- Settles open point 3's front-matter question; what the other task files are stays open.

#### Other task files: spec artifacts (2026-11-17)

The human, verbatim:

> What are the other files you asked. They would be the artifacts for implementing the task, once we build that:
>
> proposal.md
> design.md
> specs/<spec-name>/spec.md
> tasks.md
>
> Those are the openspec files. SpecKit would have
>
> spec.md
> plan.md
> tasks.md
> research.md
> quickstart.md
> contracts/
> data-model.md
>
> We'll have a pluggable spec solution similar to OpenSpec here.

Advisor's reading:

- The rest of a task folder is the spec tool's artifacts, written beside `task.toml`, `body.md` and `comments.md`. Which files depends on the spec plugin (OpenSpec-like or SpecKit-like).
- Not in this ticket (YAGNI): the pluggable spec solution is later work and gets its own ticket. For v1 flume only needs to leave other files in a task folder alone (keep them on resolve, which moves the whole folder).
- Note: both tools write a `tasks.md` (the implementation checklist) inside the flume task folder. No file clash with flume's own files (`task.toml`, `body.md`, `comments.md`), only a naming echo.
- Settles open point 3.

The human, 2026-11-17: "could also be attachments as well, yes. Images, CSVs, etc"

So a task folder may also hold attachments (any file type). Same v1 rule: flume leaves files it doesn't own alone and moves them with the folder.

#### Roles and guides (2026-11-17)

The human, verbatim: "roles are a folder inside base/ and projects/<name>; so are guides."

Advisor's reading:

- `base/roles/`, `base/guides/`, `projects/<project>/roles/`, `projects/<project>/guides/` (tree above updated). Same layering as the workflow: project overrides workspace.
- Assumed file naming: one file per role or guide, `roles/<role>.md`, `guides/<guide>.md`.
- Prime: given a role, prints the role's text from base/ then from projects/<project>/, after the workflow layers.
- Open: how guides reach agents. Agents don't read files, so presumably a flume command prints one (e.g. `flume guide <name>`), and prime lists the guides available. Which roles exist is up to the workspace (they are files), so flume does not need a fixed list.

The human, 2026-11-17, on the guides question above: "yes. that's right"

Settled: `flume guide <name>` prints a guide (project's over the workspace's); prime lists the guides available. Roles: no fixed list in flume; the role files are the roles.

### Everything YAML (2026-11-17)

The human, verbatim: "See, and here's the rub: I really like yaml frontmatter; so, we're going to have yaml parsing; I think we bite the bullet and just make everything yaml now and it's totally fine. The config.yaml, flume.yaml, and task.yaml should be flat yaml as possible. avoid nestings"

This overrules the task.toml decision above. Advisor notes: flume already depends on the `yaml` package (task front matter today), so dropping `smol-toml` leaves one parser. Guides and workflow split out to fl-x6xn and fl-fu3v.
