# Changelog

## Unreleased

### Added

- Instructions and pushed guides (fl-4tx8): `flume task instructions ID` prints the current phase's built-in steps, its template and the guides pushed to the phase (each in a `<guide>` element; a vanished guide is a `<guide_missing>` element, not an error). `flume task guide ID NAME --phase PHASE [--remove]` pushes a guide to a phase (stored nested by phase as `guides` in task.yaml, refused for a phase the task has passed or an unknown guide). A plan group can name guides with `Guide: NAME` lines (checked on write); `flume task next` prints them and the guides pushed to implement after the group (`guides` in `--json`). `flume guide` with no name lists the guides (`--json`). `claim` (or assign to yourself) prints the instructions; `phase` ends with `next: flume task instructions ID`; `task show` ends with a pointer line. History gains `instructions`, `guide_push` and `guide_remove` lines. New `POST /api/tasks/{id}/instructions` and `/guides`. Spec: `design/specs/instructions.md`.

- Task history (fl-eg2q): every change that goes through flume (create, field updates, assign and claim, phase, comment, plan done and skip with the reason, close, reopen, part writes and removes) appends one JSON line (`time`, `by`, `action`, and `field`/`from`/`to`, `part`, `items`/`reason`) to `history.jsonl` in the task folder, which moves with it on close and reopen. `by` is `AGENT_NAME` (the `X-Flume-Agent` header every command sends), or `human`. New `flume task history ID [--json]` and `GET /api/tasks/{id}/history`.

- Workflow v1 (fl-fu3v): tasks have `phase` (proposal, design, specs, plan, implement), `assignee` and `agent`. New commands: `flume task assign ID [NAME|human] [--force]` and `claim` (an agent needs `--force` to take a task someone else holds), `phase`, `write ID PART [--file PATH|-] [--remove]` and `show ID PART` (parts body, design, spec, plan, comments, by name), `template PART [--project P]` (built-in, `base/templates/`, `projects/<p>/templates/`, whole replace), `next`, `done` and `skip --reason` for the plan checklist (checked on write), and `flume workflow [--json]`. `task list` gains `--assignee` and `--phase`. New API endpoints for all of them.

- Guides: Markdown files with flat YAML front matter (`name`, `description`, optional `stage`) in `base/guides/` and `projects/<project>/guides/` of the flume-root (project overrides base). `flume guide <name> [--project P]` prints the body; `flume prime` lists each guide's name and description; `flume check` reports guides with bad front matter. New `GET /api/guides/<name>` and a `guides` list in `GET /api/prime`; both go through the daemon like prime (fl-x6xn).

- `flume.yaml` can list `projects:` (name -> `url`, optional `branch`); `flume check` reports a project with no url or a bad folder name. `flume clone <git-url> [<workspace>]` clones the tasks repo into the workspace (current folder by default) and runs `flume init --clone`; `flume init --clone` clones each missing project into `<workspace>/<name>/` (a failed clone is reported, the rest go on, exit 1); `flume project list [--json]` and `flume project add <git-url> [--name N] [--branch B]`. None use the daemon (fl-pshd).

- `flume prime` and `flume agent` ask the daemon for the workflow text and print it: built-in text, `base/workflow.md`, `projects/<project>/workflow.md`, `base/roles/<role>.md`, then `projects/<project>/roles/<role>.md` of the flume-root (missing files skipped; with no daemon the built-in text plus a line saying the rest is missing). New `GET /api/prime`, `flume agent --role <role>` (saved on the agent entry like `project`), `flume task new --project`, and a `project` field in `task.yaml` (fl-3pfa).

- Agent entries gain `last_seen` (UTC time): every flume command that calls the daemon sends `AGENT_NAME` in an `X-Flume-Agent` header, and the daemon sets that existing entry's `last_seen` on each request (never creates one). `flume agent list` has a LAST-SEEN column; `show` includes it (fl-t8xv).

- `flume init [--root PATH] [--force]` sets up a workspace folder: `.flume/` (`.gitignore`, `config.toml` root) and flume's shipped base workflow (one placeholder `workflow.md`) copied to `<root>/workflow/base/` in the task repo and committed there (never pushed). A second init fails and points at `--force`, which rewrites only `workflow/base/`. `flume prime` gains one line naming the reading order (base, workspace, project workflow files, then CLAUDE.md; later overrides earlier) when `<root>/workflow/` exists (fl-7sme).
- README `## Install`: prerequisites, clone (optional tag), `npm ci --omit=dev`, a symlink onto PATH, starting and checking the daemon (`flume serve`, `status`, `stop`), and update steps; verified in a fresh clone (fl-dtyj).
- `flume agent [<name>]` launches Claude Code as a named agent (registry in ~/.flume/agents, one pane per agent, `--project`, `--force`, `--system`, templates in ~/.flume/templates), plus `flume agent list|show` and `flume prime`; specs in design/specs/agent.md (fl-macf).
- `flume roadmap show|check` on `flume/roadmap.md` (Markdown headings plus lists of task wiki links; a Done section holds finished work), `GET /api/roadmap`, and `flume check` runs the roadmap check too; specs in design/specs/roadmap.md (fl-s52x).
- `flume task new|show|list|update|note|close|reopen`: the task CLI, a thin client of the daemon; human output by default, `--json` for agents, bare IDs, `--help` per command, and a clear error naming `flume serve` when no daemon answers. The API task object gains `file` (the stored text) for `show` (fl-yt5q).
- Daemon (src/daemon/): localhost HTTP API for tasks (create, show, list, update, note, close, reopen, check, stop), one git commit per change in the task root, and `flume serve`, `flume status`, `flume stop`; the address is recorded in the repo's shared git folder so any worktree finds it, FLUME_URL overrides (fl-brmx).
- Task-file core library (src/core/: IDs, slugs, front matter round-trip, links, folders) and `flume check`, which prints one line per problem and exits 1 (fl-w89j).
- `flume bug` prints a paste-ready bug-report template with the version line; release and update steps in docs/release.md; specs in design/specs/releases.md (fl-jc84).

### Changed

- The CLI runs on Commander with `@commander-js/extra-typings` (fl-xg67): every command declares its arguments and options there, and the hand-rolled argument loops, usage strings and per-command `--help` branches are gone. Every command and subcommand takes `--help` and `-h` (usage generated from the declarations, exit 0), `flume help <command> [<subcommand>]` prints the same, and a usage error prints the message, then the usage, to standard error and exits 2 (some usage-error messages changed to the generated form). `flume agent` is routed and documented by Commander but its own parser still reads its words (r-a2c0). New runtime dependencies: `commander` and `@commander-js/extra-typings` (no dependencies of their own; at work they are installed through Artifactory). Specs: `design/specs/cli.md`.

- An agent can no longer move a task to a later phase until it has run `flume task instructions` (or claimed the task) for the task's current phase since the task entered it; the human and moves backwards are never refused (fl-4tx8). The built-in prime text now says to claim, follow the printed instructions and push guides; the per-phase steps moved into `flume task instructions`.

- `flume prime` with no daemon (fl-ud4g): in a workspace (a `.flume/` folder here or above) it prints a `server_not_running` element naming the workspace and asking the human to run `flume serve`; with no workspace it prints a `flume_not_set_up` element explaining flume and the setup steps (init, project add or clone, serve). `flume_base` is kept in both; a daemon refusal still gives `workflow_missing`.

- Actor (fl-6hkt): a command run under Claude Code (`CLAUDECODE` set) without `AGENT_NAME` is the unnamed agent `agent-<first 8 of CLAUDE_CODE_SESSION_ID>` (`agent-unknown` without one), never the human. One check feeds comment authors, assign/claim (the unnamed agent needs `--force`; `assign`/`claim` with no name and no `AGENT_NAME` exits 2), history `by` and the `X-Flume-Agent` header.

- `flume project add` takes a git URL or a bare project name (fl-mvu7): a name adds the project to `flume.yaml` with no url, warns on stderr, and clones nothing; `flume check` no longer reports a project for having no url (only a bad name); `flume project clone` says "no url" when it skips one.

- Projects are names (fl-gr36): `flume init` only sets up the workspace and no longer checks project folders or takes `--clone`; new `flume project clone [<name>...] [--json]` clones projects into `<workspace>/<name>` (skips existing folders and projects with no url, exit 1 if any clone fails, exit 2 for an unknown name); `flume project list` drops the present/missing column; `flume clone` runs init then project clone.

- `flume task new` prints the ID only; `flume task show ID` prints task.yaml and a `parts:` line (use `show ID PART` for text); `task list` lines gain phase and assignee columns; the built-in prime text teaches the five-phase workflow (fl-fu3v).

- `flume prime` (and the text `flume agent` sends) and `flume guide` print XML sections: one `flume_prime` root with `flume_base`, `workspace_workflow`, `project_workflow`, `role`, `guides` parts (empty ones left out, tags that would forge an element neutralized); a guide prints inside `<guide name stage>`. With no daemon a `workflow_missing` element says the rest is missing. `GET /api/prime` also returns `parts` (fl-87h9).

- `flume init` can be run again in a set-up workspace instead of failing with "already set up": it repeats its steps, reports projects missing from the workspace (without `--clone`) and changes nothing else (fl-pshd).

- New layout, no migration (fl-3pfa): the tasks repo holds a versioned `flume.yaml` (`dir: flume`, or `.`) naming the flume-root; a task is a folder `tasks/open/<slug>-<id>/` with `task.yaml` (flat fields, now including `status`), `body.md` (the ask, no front matter) and `comments.md`; other files in the folder are left alone and move with it on close. `flume init` writes `flume.yaml` (`--dir NAME`) and no longer copies a base workflow, `init --force` and the shipped `workflow/base/` folder are gone, and `roadmap.md` now sits in the flume-root. `flume task show` prints task.yaml, body.md and comments.md; the API task object has `body`, `comments` and `fields` instead of `file`.

- `flume status`, `flume check`, `flume roadmap check` and `flume agent list` and `show` take `--json` (one JSON document on stdout: status an object with running, address and root; the checks an array of problems with path and message; list an array of entries; show an object). `flume agent show` prints YAML by default, JSON with `--json` (fl-cpcu).
- `flume agent` writes each agent's registry entry to `~/.flume/agents/<name>.yaml` (flat YAML, same fields) instead of `<name>.json`; `list` and `show` read `.yaml` only, `.json` entries are ignored, no migration (fl-89z2).
- The workspace config is `.flume/config.yaml` (flat YAML, `root: <path>`) instead of `.flume/config.toml`; a config.toml is not read, with no migration. `smol-toml` is removed; flume reads and writes config with the `yaml` package (fl-c9n9).
- `flume --help` and `flume serve --help` say the human runs `flume serve` and agents never do; a serve usage error says it too, and the built-in prime tells agents never to start it and to ask the human when the server is not running (fl-xxym).
- `flume serve` now needs `flume init` first (it fails with "run flume init first" when the folder has no `.flume/`), no longer takes `--root` (set it with `flume init --root`), and no longer creates `.flume/` (fl-7sme).
- The not-running message (`flume task`, `flume roadmap show`) now says "the flume daemon is not running for this workspace." instead of "for this project", since the server is per workspace (fl-k9pk).
- `flume agent` and `flume prime` no longer read `~/.flume/templates/` (base.md, project.md): the prime is always the built-in base text, plus the built-in project text when there is a project. `~/.flume/agents/` is unchanged; no workspace overrides yet (fl-hh6x).
- `flume version` is now `flume --version` (GNU style; same output, exit 0); `flume version` is an unknown command (exit 2), no alias. Top-level help lists `--version` and `--help` under Options (fl-a4nc).
- `flume serve` runs per workspace: from any folder (it need not be a git repo), with `.flume/` (own `.gitignore` of `*`) holding `daemon.json` and `config.toml` (`root = ...`, relative to the workspace folder). `--root` is saved and wins; with neither, the current repo. Commands find the server by walking up to the nearest `.flume/daemon.json`; `.git/flume-daemon.json` is gone, no migration (fl-4dgp).
- `flume prime` and `flume agent`: the default project template (no `~/.flume/templates/project.md`) now reads "You are working on the {project} project. Read that project's CLAUDE.md and follow its instructions." (fl-vpsb).
- `flume task note` is now `flume task comment` (API `POST /api/tasks/{id}/comments`, commit message "add a comment"; no alias). A comment goes under a `## Comments` heading at the end of the body, headed `### <local time with UTC offset>, <author>`; the author is `$AGENT_NAME` (the API takes an optional `author`), else the OS user name (fl-ha4p).
- `flume prime` and `flume agent`: the default base template (no `~/.flume/templates/base.md`) gets a second line, "Use the flume CLI to work with tasks; run flume --help to learn it." (fl-5xjg).
- Without a daemon, `flume task` and `flume roadmap show` print two lines to stderr: "flume: the flume daemon is not running for this project." and "Ask the human to start it: flume serve (in its own pane)."; exit 1 as before, and flume never starts a daemon (fl-qgr7).
- `flume agent`: before `--` only flume's own options (`--name`, `--project`, `--force`, `-h`/`--help`) and the prompt are accepted; any other option exits 2 with `flume: unknown option <arg>` and a hint to put Claude options after `--` (fl-zdqr).
- `flume agent`: the name is only `--name <n>` (or the tmux pane); one bare argument is the prompt, sent exactly (a short default when none); the prime text goes in `--append-system-prompt`, `--system` is gone, and claude gets `--name <agent>`. Claude's options are parsed by its own rules, also after `--`, and conflicts (two prompts, -n/--name, --append-system-prompt, a repeated single-value option, a missing value) exit 2 (fl-xv3z).

### Fixed

- `flume agent` and `flume prime` refuse a name outside `[a-z0-9][a-z0-9-]*` (from `--name`, `--name=` or the tmux pane) with exit 2, before writing or launching anything, so `--name ../x` can't write outside `~/.flume/agents` (fl-wryg).
- `flume agent alice --model opus` passes `opus` to claude as the flag's value instead of taking it as the prompt or name; covers claude's value-taking flags (fl-ttmw).
- `flume task new` with `--blocked-by` or `--related` is one commit, not two: `POST /api/tasks` accepts `blocked_by` and `related` (unknown IDs refused with 400, nothing written); spec in design/specs/api.md (fl-8vw7).
- Daemon refuses (403) requests with a foreign Host header (DNS rebinding) and POST/PATCH/DELETE with a foreign Origin header (CSRF); the CLI is unaffected; specs in design/specs/api.md (fl-gnef).

### Internal

- Duplicate spec id fixed (fl-7tyx): the cli.md requirement "Project clone clones projects" had r-c1a0, also on api.md's "Add a comment"; it now has r-7e4b (api.md keeps r-c1a0), and design/specs/.ids records the 34 ids that were hand-assigned without a ledger entry. `bridle spec id` runs clean again.
- `docs/design/daemon.md` records what the daemon is for: agents and the UI; setup commands need no daemon; only the human starts it (fl-35bq).
- Test binds scenario s-129b (version offline: one line, exit 0, no daemon) in test/cli.test.ts (fl-fruc).
- Behaviour spec for the web UI: board, task detail, roadmap (design/specs/ui.md, fl-8g3q).
- Behaviour specs for the task file format, `flume check`, the CLI and the daemon API (design/specs/, fl-47b8).
- Scaffold the TypeScript on Node project: flume bin (help, version), vitest, biome, strict tsconfig, `npm run check` / `just check` (fl-4r5q).
- Record the stack decision: TypeScript on Node, Go as the alternative (docs/design/stack.md).
