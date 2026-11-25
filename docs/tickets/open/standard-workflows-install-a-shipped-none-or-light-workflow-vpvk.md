---
id: fl-vpvk
title: "Standard workflows: install a shipped none or light workflow at init or later"
kind: feature
created: 2026-11-25
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: [fl-mv4r]
related: [fl-mv4r, fl-h8ty]
---

## The ask

Flume ships a few standard workflows besides its one full base workflow, and the human picks one
for a project during `flume init` or any time later. The full workflow is too much for a POC, a
docs repo, notes, dotfiles or research. Ship two to start: **none** (no workflow; flume is there
for tasks if wanted; follow the prompt) and **light** (tasks for code changes, no phases to speak
of). A document workflow comes later. Installing one copies its files into the project's workflow
files in the tasks repo. Pending: drafts for the human's review.

## Design

### What ships

- Flume keeps its one standard (full) workflow, built in, as today (fl-mv4r makes it the base
  workflow.md and phases.md files).
- Flume also ships named workflows, each a folder of layer files that replace the base:
  - `none`: workflow.md only.
  - `light`: workflow.md and phases.md.
- Each file starts `# ... @replace` (fl-mv4r), so the installed project ignores the base text.

### Installing one

- `flume init --workflow NAME` installs it while setting up.
- `flume workflow install NAME [--project P]` installs it later. With --project, into
  projects/P/ of the flume root; without, into base/ (the whole workspace).
- `flume workflow install --list` (and `--json`) lists the shipped workflows with a one-line
  description each.
- Install copies the files and commits them. If a target file exists, it changes nothing and exits
  1 naming the file; `--force` overwrites.
- The copied files are the project's own from then on: the human can edit them, and a flume update
  does not change them (reinstall with --force to take a newer version).

### Blocked by fl-mv4r

Today a project's workflow.md is appended after the built-in text, so a "none" workflow would
still carry the full workflow above it. These workflows need fl-mv4r's whole-file replace
(`# ... @replace`) at least.

### Draft: none/workflow.md

````markdown
# Flume workflow @replace

You are agent {name}, stored in $AGENT_NAME.

This repo does not follow a set workflow. Do what the human asks, directly: no
task, no worktree, unless they ask for one.

Flume is available if a task would help (to track work, or hand it to another
agent): run `flume --help`. Read and change tasks only with flume commands.
Never start `flume serve` yourself; only the human does.
````

### Draft: light/workflow.md

````markdown
# Flume workflow @replace

You are agent {name}, stored in $AGENT_NAME.

## Using flume

- Use the flume CLI to work with tasks; run `flume --help` to learn it.
- Never start `flume serve` yourself; only the human does. If flume says the
  server is not running, ask the human to start it.
- Read and change tasks only with flume commands.

## Working a task

Questions, research and edits to notes or docs need no task: just do them.
For a change to code:

1. Make a task (`flume task new TITLE --body-file -`) with the ask in the
   body, quoting the human; or take an existing one.
2. Claim it (`flume task claim ID`); it prints your instructions. Follow them.
3. If you are waiting on the human, assign the task back to them
   (`flume task assign ID human`).
4. Record important conversations with the human as comments
   (`flume task comment ID`), quoting the human verbatim.
````

### Draft: light/phases.md

````markdown
# Phases @replace

## Proposal

- Read the body (`flume task show ID body`). If the ask is unclear, ask the
  human.
- Move straight to implement: `flume task phase ID implement`.

## Implement

- Enter a git worktree to make the change. Run the tests.
- When done, merge main into it, then exit the worktree and merge it into main.
- Add a comment saying what you did (`flume task comment ID`), then close the
  task (`flume task close ID`).
````

### Assumed (advisor; change if wrong)

- Without --project, install goes to the workspace layer (base/). The human named projects; a
  notes or dotfiles workspace is often one project, but the workspace layer is the natural place
  when every project there is the same kind.
- Light keeps flume's five phases (they are in the code) but its phases.md has steps only for
  proposal and implement; a new task starts in proposal and the agent moves it straight to
  implement. Phases per workflow are fl-h8ty and docs/design/workflow-later.md.
- The standard workflow is not installable, since it is the base; removing a project's installed
  files goes back to it.
- Simplifying the standard base is left to its own ticket.
- The names: none, light, standard.

## Discussion (for reference, not authoritative)

The human, 2026-11-25 (to advisor), verbatim:

> I guess we need to add a new capability here that we don't have yet, but I think is going to be important quickly. That is a set of standard overrides or overlays for the workflow, for the base workflow.
>
> I do think we should keep some sort of base workflow, but maybe we should simplify it a little bit. Not exactly sure, but I think what we have in the base workflow is way too complicated for a lot of the projects that I'm working on.
>
> When I'm doing a POC, or I'm running a docs repo, or I'm using Flume, I want to start using Flume agents for my notes, or simple things like just updating my dotfiles, or just doing research or something. In those situations, I don't need, and I don't want, that complicated workflow. I think there are maybe two types of workflows that come to mind immediately.
>
> The first one would be really, almost no workflow at all. It would say, "This repo doesn't follow a standard workflow. Whatever, Flume is available. We still have Flume Prime, right? Flume is available for tickets if you need them, but follow the prompt."
>
> There should be a Flume command, probably as part of init. This is probably part of init, but it could also be applied later, I think. It would allow you to select from the standard base workflows.
>
> I guess the question I don't know about is this: I think, let's do the easiest thing first, which is that this just gets installed as a project workflow, and there's just one standard Flume workflow. Just clarifying there: let's keep the fact that we have one standard Flume workflow that lives in Flume, and then we want to provide both during `init` or a later command: "Please install one of the base workflows that ship with Flume."
>
> One of them is essentially no workflow, and I want a very light workflow that uses tickets. The no workflow would be used for a lot of no-code workspaces or workspaces that just don't need to work in tickets, tasks, and code. I would have a light one that would work with a coding repo, and I think later I'll add an official kind of document-based workflow.

The human, 2026-11-25, verbatim, on copy vs a setting: "Yes it is a copy onto the project or
workspace chosen by the user". And: "We need to ship workflow layers now then." (fl-mv4r)
