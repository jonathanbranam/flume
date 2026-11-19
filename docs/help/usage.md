# Using flume

Run `flume <command> --help` (or `flume help <command>`) for any command's options. This guide
says what to run, who runs it and when.

## Who runs what

- **The human** runs `flume init`, `clone`, `project`, `serve`, `status`, `stop`, `check` and
  `roadmap`, decides which phase a task is in, and reads task parts.
- **Agents** run the `flume task ...` commands on the task they hold, `flume prime` and
  `flume guide`. Agents never run `flume serve`.
- The human launches agents with `flume agent`; the daemon must be running first.

Run commands from any folder inside the workspace. Task commands need the daemon (`flume help
setup`). Set `AGENT_NAME` to the agent's name (`flume agent` does this); with neither it nor
Claude Code set, a command counts as the human's.

## A task's life

A task is a folder of files in the tasks repo. It moves through five phases, in order; each
phase writes one part and the next requires it:

1. proposal: writes `body` (what and why)
2. design: writes `design`
3. specs: writes `spec`
4. plan: writes `plan` (a checklist grouped by headings)
5. implement: no part; work the plan

`flume workflow` prints them (`--json` too). The human controls the phases; an agent moving
forward is subject to the rules `flume task instructions` prints.

The usual order:

```sh
flume task new "Add search" -k feature [--body-file -]   # prints the task ID
flume task list [--phase P] [--assignee NAME|human]      # one tab-separated line per task
flume task claim <id>          # take it yourself; prints the current phase's instructions
flume task instructions <id>   # the current phase's steps, template and pushed guides again
flume task template <part>     # the template to start a part from
flume task write <id> <part>   # replace a part from stdin, or --file PATH; --remove deletes it
flume task phase <id> <phase>  # move to another phase
flume task next <id>           # in implement: the current plan group and its Guide: lines
flume task done <id> 1.1 1.2   # tick plan items; skip them with: flume task skip <id> 1.3 --reason "..."
flume task comment <id>        # add a comment (--text TEXT or --body-file PATH)
flume task assign <id> human   # hand the task back to the human
flume task close <id>          # resolve it as done; close <id> --dropped "why" for not done; reopen reverses it
```

Other task commands: `task show <id> [part]` (fields and parts, or one part's text), `task update
<id> <field> <value>` (title, kind, parent, blocked-by, related), `task guide <id> <name> --phase
P` (push a guide to a phase), `task history <id>` (every change, oldest first). Most take `--json`.

An agent that finds a task held by someone else needs `--force` to take it. Every change is
committed in the tasks repo and logged in the task's `history.jsonl`.

## Agents

```sh
flume agent --name scout [--project P] [--role R] ["a prompt"]   # launch Claude Code as scout
flume agent list                  # agents, with last seen (--json too)
flume agent show scout            # one agent's entry
flume prime --name scout          # print the prime text an agent starts with
flume guide                       # list the workflow guides agents push to phases
flume guide <name>                # print one
```

`flume agent` needs `claude` on PATH (`tmux` optional: one pane per agent). Its prime text
holds flume's workflow, then the workspace's `base/` and `projects/<project>/` files.

## Checks and the roadmap

```sh
flume check             # validate task files, guides and the roadmap; exit 1 on a problem
flume roadmap show      # the roadmap with each task's state (needs the daemon)
flume roadmap check     # links to no task, resolved tasks listed as upcoming
```

## Getting help

`flume --help` lists every command; `flume help` lists these guides; `flume bug` prints a
bug-report template with the version line to paste into an email.
