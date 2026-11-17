---
id: fl-macf
title: "flume agent: launch Claude as a named agent (replaces claude-as)"
kind: feature
created: 2026-11-17
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: []
resolved: 2026-11-17T13:20:47Z
---

## The ask

`flume agent`: launch Claude Code "as" a named agent, replacing the human's `claude-as` at work.
**Priority: top. The human needs it at work within the hour (from ~2026-11-17 morning ET).**
Approved by the human: "I approve this to be built. Please ready and work the ticket. You have one
hour before I get to work."

The human's words on the design (2026-11-17, advisor session), verbatim where quoted:
"i'll use 'flume agent' immediately; don't need backwards compat"; "drop the --as-[command]";
"consume args that flume agent recognizes. Unrecognized args pass to 'claude' Also '--' forces
stopping consuming args."; "remove the custom --prompt, I stopped using it after I added
'--project' anyway"; "--force and --project CAN come before <name>".

## Commands

| command | does |
|---|---|
| `flume agent [<name>] [--project <p>] [--force] [--system] ["<one-off prompt>"] [claude args] [-- claude args]` | launch |
| `flume agent list` | all entries, ps style: NAME PANE PROJECT LIVE LAST-LAUNCH |
| `flume agent show <name>` | the full entry |
| `flume prime [<name>] [--project <p>]` | print the prime text the launcher would send (base template + project template) |

## Argument parsing

- Flume consumes what it recognizes, in any order (flags may come before or after the name):
  `--project <p>`, `--force`, `--system`, the name, the one-off prompt. Everything else is passed
  to `claude` unchanged, in order. `--` stops consumption: everything after it goes to `claude`.
- Bare arguments: one that looks like a name (`[a-z0-9][a-z0-9-]*`, no spaces) is the name, if no
  name is set yet; any other bare argument is the one-off prompt (for this launch only, never
  saved). `list` and `show` as the first argument are subcommands, so they can't be agent names.
  (Assumption, advisor: the one-off prompt goes before `--`, e.g. `flume agent "pick up xyz"`,
  because `--` now means "pass to claude untouched"; record if the build finds a better rule.)
- No name given: read it from the tmux pane option `@flume_agent` of the current pane
  (`$TMUX_PANE`). No name and none in the pane: error with usage.

## Launch

1. Registry: one JSON file per name, `~/.flume/agents/<name>.json`: name, project (may be empty),
   pane, created, last_launch. Machine-wide. No daemon needed for any `flume agent` command.
2. `--project <p>` saves the project on the entry; without it, the saved project is used.
3. Pane check (as `claude-as`): if the entry is associated with a different pane than the current
   one, refuse with a message naming that pane, unless `--force`, which claims the entry. No
   check of whether the other pane exists or is live (the human: ""stale" panes is not a good
   check at all, just remove that"). Record the current pane.
4. Set the pane option `@flume_agent=<name>` on the current pane.
5. Environment for claude: `AGENT_NAME=<name>`, and `AGENT_PROJECT=<project>` when set.
6. Default mode (as `claude-as` does today, "concat everything and pass to the interactive
   prompt"): one interactive prompt = base template + project template (if a project) + one-off
   prompt (if given), passed as claude's positional prompt.
7. `--system` mode (the human: "enable this with a specific option so I can test it"): the prime
   text goes to claude's system prompt (`--append-system-prompt`), and the interactive prompt is a
   kickoff: the one-off prompt if given, else a short default telling the agent to read its
   instructions and start. Something must always go in the interactive prompt: "claude sits still
   and doesn't do anything" without one.
8. Run `claude` as a child and wait for it; exit with its exit code. (Liveness can be read later
   from tmux; no "exited" bookkeeping needed now.)

## Templates

Defaults ship with Flume; a file in `~/.flume/templates/` (`base.md`, `project.md`) overrides
each. `{name}` and `{project}` are filled in. Base starts: "You are agent {name}, stored in
$AGENT_NAME." Project template starts: "You are working on project {project}." Keep both short.

## `list` LIVE column

From one `tmux list-panes -a` call: `yes` if the pane exists and runs `claude`, `pane` if it exists
running something else, `-` if gone. Works (prints `-`) outside tmux.

## Out of scope (YAGNI)

Rules in prime (parked by the human: "park rules for now"), a remove command, the daemon,
heartbeat, `--prompt`, a `claude-as` alias, importing the old registry.

## Specs and tests

Bridle specs (`design/specs/agent.md`) for every form above, implementation-agnostic, with tests
naming scenario IDs; tests run against a fake `claude` and fake `tmux` on PATH and a temporary
HOME. Update README and `docs/release.md` with install-to-use steps for `flume agent`.
