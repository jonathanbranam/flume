# Flume workflow

## Using flume

- Use the flume CLI to work with tasks; run `flume --help` to learn it.
- Never start `flume serve` yourself; only the human does. If flume says the
  server is not running, ask the human to start it.
- Read and change tasks only with flume commands. Never read or edit task
  files directly.

## The human is in control

This workflow is guidance; flume does not enforce it. The human may ask you to
go back, jump ahead or skip steps ("write design and specs", "remove the specs
and start over on the design", "the ticket is simple, skip specs and plan, just
implement"). Do what they ask.

## Working a task

1. Claim the task (`flume task claim ID`). Then look at it
   (`flume task show ID`): the parts it has and its comments tell you which
   phase comes next. Follow that phase's steps below.
2. One agent will likely not do the whole workflow: another may take the next
   phase, or finish the plan. Leave a comment saying where things stand. If you
   are waiting on the human, assign the task back to them
   (`flume task assign ID human`).
3. In every phase, record important conversations with the human as comments
   (`flume task comment ID`), quoting the human verbatim.

## Phases

In order. A task is made of parts: read one with `flume task show ID PART`;
write one with `flume task write ID PART`, starting from its template
(`flume task template PART`).

### Proposal

Check that the task has a clear proposal, goal and scope.

- Read the task: `flume task show ID body`.
- If the proposal, goal or scope is unclear, ask the human (assign the task to
  them: `flume task assign ID human`).
- Write them in the body: `flume task write ID body`, starting from the
  template (or the existing text).

### Design

When goal and scope are clear, think through the design questions and write the
design.

- Read the body: `flume task show ID body`.
- Write the design: `flume task write ID design`.
- Record each decision, the alternatives and why this one. Ask the human about
  anything open.

### Specs

When the design is clear, write the spec: clear requirements in EARS form.

- Read the body and design.
- Write the spec: `flume task write ID spec`.
- A requirement is one EARS sentence ("When <trigger>, the system SHALL
  <response>") with Given/When/Then scenarios.

### Plan

Write how to implement the task, step by step.

- Read the body, design and spec.
- Write the plan: `flume task write ID plan`, starting from the template.
  Numbered groups of numbered items.
- Decide which guides (`flume guide`) apply to each group and name them with
  Guide: lines under the group's heading, before its items. They are printed
  with the group by `flume task next`.

### Implement

Do the plan, one group at a time.

- Read the body, design and spec for context.
- Get the current group of plan items and its guides: `flume task next ID`.
- Do the items, and report each one: `flume task done ID ITEM`, or
  `flume task skip ID ITEM --reason TEXT` if it should not be done. Repeat
  until the plan is complete.
- When writing code, enter a git worktree to make the changes; when done, merge
  main into it, then exit the worktree and merge it into main.
- Close the task when done: `flume task close ID`.

## Guides

Guides are how-to notes. List them with `flume guide` and read any that matter
for your work (`flume guide NAME`).
