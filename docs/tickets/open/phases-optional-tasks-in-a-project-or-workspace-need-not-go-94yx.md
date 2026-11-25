---
id: fl-94yx
title: "Phases optional: tasks in a project or workspace need not go through the base workflow's phases"
kind: feature
created: 2026-11-25
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: []
---

## The ask

The base workflow's phases (proposal, design, specs, plan, implement) must not be required for
tasks in a project or workspace that does not use them. A light or no-workflow project (fl-vpvk)
should be able to make a task, work it and close it without moving it through phases, reading
phase instructions first, or having a plan. This needs an analysis of where flume enforces or
assumes phases today before a design.

## Design

Not designed yet. First step: the analysis below, written on this ticket, then a design for the
human.

### Analysis to do

Find every place flume requires or assumes a phase, in the specs, code, CLI, daemon and UI, and say
for each what it would do in a project with no phases. Known so far (specs, 2026-11-25):

- task.yaml always holds phase, proposal for a new task (workflow spec, first requirement).
- An agent moving a task forward is refused unless it fetched the instructions for the current
  phase (instructions spec, r-4d04).
- flume task instructions prints steps per phase; claim prints them.
- Guides are pushed to a phase, and pushing to an earlier phase is refused.
- flume task phase, flume workflow, flume task list --phase, and the plan (flume task next, done,
  skip) for implement.
- To check: whether close needs a phase or a complete plan; what the UI shows per phase; the
  prime text (it names every phase command).

### Points to settle in the design

- Where the setting lives: the workflow files themselves (a workflow with no phases.md, or a
  phases.md with no phases), or a setting in flume.yaml per project and for the workspace.
- What a task in such a project shows for phase (none, or a single phase), and what claim and
  instructions print.
- How it relates to kinds choosing their workflow (fl-h8ty).

## Discussion (for reference, not authoritative)

The human, 2026-11-25 (to advisor), verbatim: "File a ticket that our phases in the base workflow
should NOT be required for tickets in a specific project or workspace. That will require some
analysis of what has been built"

Context: fl-vpvk (shipped none and light workflows) had to keep the five phases because they are
built into the code; its light workflow moves a task straight from proposal to implement.
