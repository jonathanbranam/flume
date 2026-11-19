---
id: fl-ws3h
title: "Task resolution: drop the status field, record done or dropped on close"
kind: feature
created: 2026-11-19
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: []
---

## The ask

A task's state is the folder it sits in, so task.yaml should not repeat it in a `status` field.
What a resolved task does need is why it ended: done, or not done. Keep it to that distinction;
the details go in a comment.

## Design

### Fields

- Drop `status` from task.yaml. The folder a task sits in is its state (open or resolved).
- Add `resolution` to task.yaml, present only on a resolved task, with one of two values:
  - `done`: the work was finished.
  - `dropped`: the work was not done (won't fix, abandoned, duplicate, superseded).
- `resolved` (the timestamp) stays as it is.

### Commands

- `flume task close ID` resolves the task with resolution `done`.
- `flume task close ID --dropped REASON` resolves it with resolution `dropped` and adds REASON as
  a comment on the task. REASON is required with `--dropped`: a dropped task always says why.
- `flume task reopen ID` removes `resolution` (as it removes `resolved` today).
- `flume task show` and the JSON forms (CLI and API) show `resolution`. They still report the
  state (open or resolved), derived from the folder, so the output does not change shape.
- The history line for a close records the resolution.

### Check

`flume check` drops "a status that differs from the state folder" and reports instead: a
`resolution` on an open task; a resolved task without one; a value other than `done` or
`dropped`.

### Not in this ticket

- The folder layout (`tasks/open` and `tasks/resolved` today, or `tasks/` and
  `archive/tasks/`): open, see Discussion.
- States for an open task (held, parked, waiting on the human): see Discussion.
- Kinds choosing their workflow: see Discussion.
- No migration: existing task files are not rewritten (the task-files spec assumes no migration).

## Discussion (for reference, not authoritative)

### Origin

The human, 2026-11-19 (to advisor), comparing their work setup ("claude-as"), where there is no
open/closed split: active tickets in `task/`, and `archive/task/` for "anything that is old or
stale but that we're keeping for historical reasons". Then: "sorry, I meant that resolved tasks go
into archive immediately". Advisor's assessment: with resolved going straight to archive, this is
today's open/resolved split renamed (`tasks/` = open, `archive/tasks/` = resolved); resolving is
still a move. Gains: the open list is the bare `tasks/` folder; resolved work leaves the tree that
agents and grep read; `archive/` can be a project-wide "history" convention (old specs, docs).
Mostly cosmetic for tasks alone. Not decided.

### The human's words on statuses, 2026-11-19 (verbatim, dictated)

"We don't need a status that does that because a status that does that is just repeating the
folder name, so we don't need that, but we should have something else."

"don't implement this yet. Let's work on a ticket to resolve ticket statuses."

"we don't need to reproduce the name of the folder in the ticket. However, I do want an indication
of why something was archived, as either finished or won't fix, like abandoned. I don't know.
There are all sorts of things here, but I want to keep it pretty simple because we can add a
comment. We should primarily use comments for this, but I do think I want a distinction between
this was done and this wasn't done. Let's try to think of the simplest solution right now for
that."

"Really, every status on an open task is valid. The only time a task moves to archive is when we're
effectively done with it, and that should be one of the resolved statuses."

### Advisor's choices (for the human to confirm)

- Two values, not a list (wontfix, duplicate, obsolete, ...): the human asked for done vs not done,
  with comments for the rest. More values can be added later without breaking the two.
- Names: `resolution` (Jira's word for this) with `done` / `dropped`. Alternatives: `outcome`;
  `wontfix` or `abandoned` for the second value. `dropped` covers won't fix, abandoned and
  duplicate without implying which.
- A reason required with `--dropped`, written as a comment: rule "errors over silent guesses";
  "done" needs no explanation, "not done" always does.
- Not two archive folders (`archive/done`, `archive/dropped`): a folder per outcome brings back the
  move-on-change cost for no gain.

### Later: kinds choose the workflow (the human, 2026-11-19, verbatim, dictated)

"I think what the general standard is is that the kind of a ticket determines its workflow for
someday, when we have multiple workflows. In particular, a docs-only update or something doesn't go
through this workflow. By default, there's a default workflow for all tickets, but if there's an
override for a specific kind, we would use that workflow."

"I have tickets that are research tickets, and the purpose of it is to do a bunch of research and
write a document, or maybe write other tickets. That whole thing is just: there are no statuses or
phases or assignments, really. Do a bunch of research, write something out, then you're done."

"I have bug fixes, which typically don't need the entire workflow, right? You identify a bug fix,
you need to do the research, reproduce it, write failing test cases to prove you fixed it, and then
go fix it. It's very similar to a coding ticket, but it maybe has some additional nuance to it."
"You don't write any of these workflows out yet."

"those are common ones: dot research, docs update, types of things, bug fixes, and new feature
development."

Today flume's kinds are feature, bug, chore, docs, research and epic, and every kind goes through
the same five phases. Non-coding kinds (research, docs) exist already. Kind-specific workflows
would build on the workflow layers (fl-mv4r); worth its own ticket when the human is ready.

### Later: states for an open task

The human: "Really, every status on an open task is valid." Today an open task's only stored state
is its phase; there is no held, parked or waiting-on-the-human. Not in this ticket.
