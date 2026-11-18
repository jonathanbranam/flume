---
id: fl-4tx8
title: "guides in the plan: the planner names guides per plan group; flume task next prints them with the group"
kind: feature
created: 2026-11-18
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-x6xn, fl-fu3v, fl-87h9]
---

## The ask

Guides reach agents through the plan: the agent writing the plan picks the guides relevant to each part of the work and names them in the plan; when an agent reads that part of the plan through flume, flume prints the named guides right with it. On hold until the human says build.

For whoever edits this ticket (the human, 2026-11-17): "the design at the top is the currently agreed-upon design; keep it current and DO NOT include narration or restatements in the design. The discussion section can include the discussion narrative with restatements as a reference."

## Design

### Naming guides in the plan

- A plan group may name guides with lines `Guide: <name>` under its heading, before its items:

  ```
  ## 2. Add the login API

  Guide: api-conventions
  Guide: testing

  - [ ] 2.1 add the route
  - [ ] 2.2 unit tests
  ```

- `flume task write ID plan` refuses (exit 1) a plan naming a guide that does not exist for the task's project (fl-x6xn: project guide, else base).

### Reading the plan

- `flume task next ID` prints the current group, then the text of each guide it names, each in its own `<guide name="..." stage="...">` element (as `flume guide`, fl-87h9). A guide that has since disappeared is reported in the output, not an error.

### Picking guides

- `flume guide` with no name lists the guides for the current project: name, stage, description. `--json` as rule cli-json-output.
- The built-in text's plan phase (fl-fu3v) adds: list the guides (flume guide), decide which apply to each group of the work, and name them in that group with `Guide: <name>` lines.
- The human can add or remove `Guide:` lines like any other plan edit (flume task write ID plan).

### Assumed (advisor; change if wrong)

- Guides are named per plan group, not per item: `flume task next` hands out one group at a time, so the group is where the guide is printed.
- Prime keeps listing all guides (fl-x6xn); the plan is what ties a guide to a piece of work.

### Open (for the human)

1. Should a task also have task-wide guides (e.g. a `guides` field set with `flume task guide ID NAME`), shown whenever the task is read in any phase, not only with plan groups?

## Discussion (for reference, not authoritative)

### 2026-11-17, the human (verbatim)

> Idk how guides get to agents for sure. But one way is this:
>
> When writing a task, somehow the human or agent can specify guides that are relevant for this task specifically. Eg the agent writing the plan should evaluate list of guides wrt the work being planned and should then include in the plan "use guide abc here" and then, when the agent reads the plan through flume, flume will output the guide right along with that section of the plan.

Context: advisor described guides as built (fl-x6xn): listed in prime, printed by flume guide, `stage` only a label so far.
