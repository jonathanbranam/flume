# Using flume

Run `flume <command> --help` (or `flume help <command>`) for any command's options. This guide
says what to run, who runs it and when.

## Who runs what

- **The human** runs `flume init`, `clone`, `project`, `serve`, `status`, `stop`, `check` and
  `roadmap`, directs which step of the workflow comes next, and reads task parts.
- **Agents** run the `flume task ...` commands on the task they hold, `flume prime` and
  `flume guide`. Agents never run `flume serve`.
- The human launches agents with `flume agent`; the daemon must be running first.

Run commands from any folder inside the workspace. Task commands need the daemon (`flume help
setup`). Set `AGENT_NAME` to the agent's name (`flume agent` does this); with neither it nor
Claude Code set, a command counts as the human's.

## A task's life

A task is a folder of files in the tasks repo. Its text is in parts: `body` (the ask, which
every task has) and any other part an agent writes, by any plain name. The standard workflow uses
`design`, `spec` and `plan` (a checklist grouped by headings). The workflow itself is text in
`workflow.md`, given to agents by `flume prime`; flume does not enforce it.

The usual order:

```sh
flume task new "Add search" -k feature [--body-file -]   # prints the task ID
flume task list [--assignee NAME|human]                  # one tab-separated line per task
flume task claim <id>          # take it yourself
flume task template <part>     # the template to start a part from (nothing when there is none)
flume task write <id> <part>   # replace a part from stdin, or --file PATH; --remove deletes it
flume task next <id>           # the current plan group and the guides its Guide: lines name
flume task done <id> 1.1 1.2   # tick plan items; skip them with: flume task skip <id> 1.3 --reason "..."
flume task comment <id>        # add a comment (--text TEXT or --body-file PATH)
flume task assign <id> human   # hand the task back to the human
flume task close <id>          # resolve it as done; close <id> --dropped "why" for not done; reopen reverses it
```

Other task commands: `task show <id> [part]` (fields and parts, or one part's text), `task update
<id> <field> <value>` (title, kind, parent, blocked-by, related), `task history <id>` (every change, oldest first). Most take `--json`.

An agent that finds a task held by someone else needs `--force` to take it. Every change is
committed in the tasks repo and logged in the task's `history.jsonl`.

## Agents

```sh
flume agent --name scout [--project P] [--role R] ["a prompt"]   # launch Claude Code as scout
flume agent list                  # agents, with last seen (--json too)
flume agent show scout            # one agent's entry
flume prime --name scout          # print the prime text an agent starts with
flume guide                       # list the guides
flume guide <name>                # print one
```

`flume agent` needs `claude` on PATH (`tmux` optional: one pane per agent). Its prime text
holds the merged workflow, project and role documents (see below).

## Changing the workflow

Flume ships `workflow.md` (the workflow, as text), `project.md`, `first-prompt.md` and
`templates/{body,design,spec,plan}.md`. A file of the same name in the flume-root's `base/`, then
in `projects/<project>/`, merges into it by heading. `roles/<role>.md` and `guides/<name>.md`
merge the same way. Every such file has exactly one `# H1` (a guide's comes after its front
matter), and it must match the H1 below.

- A heading with no tag replaces that section's own text; sub-sections you don't mention stay.
- `## Name @add` adds a new section; `@append` adds text; `@remove` drops a section (give it no
  text); `@replace` replaces the section and all its sub-sections.
- `# Name @replace` on the H1: your file stands alone.
- Anything flume cannot place (such as a heading that matches nothing) is an error: the command
  that needs the file stops, and `flume check` lists every error with its file and line.

```markdown
# Flume workflow

## Guides @replace

Read the guide testing before you write any code.

## The human is in control @append

Ask the human to read the plan before you start.
```

## Previewing a merged document

```sh
flume preview workflow --project P          # the merged text, as prime uses it
flume preview role worker --layers          # each section preceded by the file it came from
flume preview guide NAME --json             # the sections as JSON, each with its sources
```

`preview` takes `workflow`, `project`, `first-prompt`, `role R`, `guide G` and
`template PART`. A layer error prints its file, line and heading and exits 1.
Flume also ships whole workflows to use instead of its standard one, for repos that need less:

```sh
flume workflow install --list     # none, light (--json too)
flume workflow install light [--project P]   # copy into base/ (or projects/P/) and commit
```

The copies are yours to edit; a flume update does not change them. An existing file stops the
install (`--force` overwrites the workflow's files). To go back to the standard workflow, remove
the installed files.

## Checks and the roadmap

```sh
flume check             # validate task files, workflow files, guides and roadmap; exit 1 if any
flume roadmap show      # the roadmap with each task's state (needs the daemon)
flume roadmap check     # links to no task, resolved tasks listed as upcoming
```

## Getting help

`flume --help` lists every command; `flume help` lists these guides; `flume bug` prints a
bug-report template with the version line to paste into an email.
