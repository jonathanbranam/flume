# Changelog

## Unreleased

### Added

- `flume init [--root PATH] [--force]` sets up a workspace folder: `.flume/` (`.gitignore`, `config.toml` root) and flume's shipped base workflow (one placeholder `workflow.md`) copied to `<root>/workflow/base/` in the task repo and committed there (never pushed). A second init fails and points at `--force`, which rewrites only `workflow/base/`. `flume prime` gains one line naming the reading order (base, workspace, project workflow files, then CLAUDE.md; later overrides earlier) when `<root>/workflow/` exists (fl-7sme).

### Changed

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

### Added

- README `## Install`: prerequisites, clone (optional tag), `npm ci --omit=dev`, a symlink onto PATH, starting and checking the daemon (`flume serve`, `status`, `stop`), and update steps; verified in a fresh clone (fl-dtyj).
- `flume agent [<name>]` launches Claude Code as a named agent (registry in ~/.flume/agents, one pane per agent, `--project`, `--force`, `--system`, templates in ~/.flume/templates), plus `flume agent list|show` and `flume prime`; specs in design/specs/agent.md (fl-macf).
- `flume roadmap show|check` on `flume/roadmap.md` (Markdown headings plus lists of task wiki links; a Done section holds finished work), `GET /api/roadmap`, and `flume check` runs the roadmap check too; specs in design/specs/roadmap.md (fl-s52x).
- `flume task new|show|list|update|note|close|reopen`: the task CLI, a thin client of the daemon; human output by default, `--json` for agents, bare IDs, `--help` per command, and a clear error naming `flume serve` when no daemon answers. The API task object gains `file` (the stored text) for `show` (fl-yt5q).
- Daemon (src/daemon/): localhost HTTP API for tasks (create, show, list, update, note, close, reopen, check, stop), one git commit per change in the task root, and `flume serve`, `flume status`, `flume stop`; the address is recorded in the repo's shared git folder so any worktree finds it, FLUME_URL overrides (fl-brmx).
- Task-file core library (src/core/: IDs, slugs, front matter round-trip, links, folders) and `flume check`, which prints one line per problem and exits 1 (fl-w89j).
- `flume bug` prints a paste-ready bug-report template with the version line; release and update steps in docs/release.md; specs in design/specs/releases.md (fl-jc84).

### Internal

- `docs/design/daemon.md` records what the daemon is for: agents and the UI; setup commands need no daemon; only the human starts it (fl-35bq).
- Test binds scenario s-129b (version offline: one line, exit 0, no daemon) in test/cli.test.ts (fl-fruc).
- Behaviour spec for the web UI: board, task detail, roadmap (design/specs/ui.md, fl-8g3q).
- Behaviour specs for the task file format, `flume check`, the CLI and the daemon API (design/specs/, fl-47b8).
- Scaffold the TypeScript on Node project: flume bin (help, version), vitest, biome, strict tsconfig, `npm run check` / `just check` (fl-4r5q).
- Record the stack decision: TypeScript on Node, Go as the alternative (docs/design/stack.md).
