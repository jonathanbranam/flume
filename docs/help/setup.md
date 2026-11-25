# Setting up flume

Flume keeps tasks as files in a git repository (the tasks repo). Setup makes a workspace folder
that points at that repo, then starts the daemon every other command talks to. You do this once
per workspace; the human does it, not an agent.

## The workspace

A workspace is a folder. Flume commands find it from any folder below it. It is one of:

- **One git repo**: your project's repo also holds its tasks. Run `flume init` inside it.
- **A folder of repos with a tasks repo**: a folder holding several project repos and one
  separate repo for the tasks. Run `flume init --root <tasks-repo>` in the folder.

`flume init` creates `.flume/` in the workspace (git-ignored; it holds the daemon's address and
the task root). If the task repo has no `flume.yaml`, it writes one at its top, naming the
flume-root folder (`flume` by default; `--dir .` uses the repo top) and commits it. It never
pushes and never starts the daemon.

Inside the flume-root folder of the tasks repo live your own files: `base/` and
`projects/<project>/` (workflow text, roles, guides, templates) and `roadmap.md`. Agents receive
them through `flume prime`, never by reading the files. How your files change flume's own is in
`flume help usage` under "Changing the workflow".

## A new project

```sh
cd my-project            # a git repository
flume init               # tasks live in this repo, under flume/
```

For a folder of repos:

```sh
cd my-workspace          # holds the project repos and the tasks repo
flume init --root tasks  # the tasks repo is the folder named tasks
```

## An existing project

Run the same `flume init`. It adds one commit (`flume.yaml`) to the task repo and changes
nothing else in your projects. Already have a tasks repo on a server? Clone the whole workspace
from its URL:

```sh
flume clone <git-url> [<workspace>]
```

This clones the tasks repo, runs init, and clones each project listed in its `flume.yaml`.

## Projects

`flume.yaml` lists projects (name, git url, optional branch). These commands edit and use that
list; they work on files and git directly, with no daemon:

```sh
flume project list                    # name, url, branch
flume project add <git-url> [--name N] [--branch B]   # add to flume.yaml, commit, clone
flume project clone [names...]        # clone the named projects (default all)
```

## The daemon

All task commands go through a local daemon that listens on localhost only and commits each
change in the tasks repo (never pushing). Only the human runs `flume serve`; agents never do, and
flume never starts it for you.

```sh
flume serve     # foreground; prints its address; leave it running in its own pane
flume status    # in another terminal: "running at <address>" and the task root; exit 1 if not running
flume stop      # ask the daemon to exit
```

`flume serve` before `flume init` fails. A command that needs the daemon and finds none says so
and asks the human to run `flume serve`. `flume status --json` and `flume check --json` print
JSON for scripts. `flume check` validates the task files (one line per problem, exit 1 if any).

## Next

`flume help usage` says what to run where and when, and the order of a task's life.
