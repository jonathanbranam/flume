---
id: fl-4tx8
title: "flume task instructions: per-phase steps with pushed guides; claim prints them; no advancing without them"
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

Guides reach agents two ways. PUSH: an agent at an earlier step decides a guide is relevant to a later step (a phase, or a group of the plan) and records it on the task; when an agent asks flume for that step's instructions, flume prints the guide with them. PULL: an agent sees a relevant guide in the list and reads it itself. Go: the human, 2026-11-17 ~11:10 PM ET (via aide): "Build eg2q and 4tx8 and inform advisor".

For whoever edits this ticket (the human, 2026-11-17): "the design at the top is the currently agreed-upon design; keep it current and DO NOT include narration or restatements in the design. The discussion section can include the discussion narrative with restatements as a reference."

## Design

### Pull (exists, fl-x6xn)

- Prime lists the guides; `flume guide NAME` prints one.
- New: `flume guide` with no name lists the guides for the current project: name, stage, description. `--json` as rule cli-json-output.

### Push to a phase

- `flume task guide ID NAME --phase PHASE` records that guide NAME applies to PHASE of the task; `--remove` drops it. Refused (exit 1) when the guide does not exist for the task's project (project guide, else base).
- Recorded in task.yaml as `guides`, nested by phase for readability (YAML is flat by default, not at the cost of usability), phase keys lowercase as the phase names, in workflow order, a phase with none left out:

  ```
  guides:
    design:
      - db-schema
    implement:
      - testing
  ```
- `flume task show ID` lists the pushed guides.

### Push to a plan group

- A plan group may name guides with `Guide: <name>` lines under its heading, before its items:

  ```
  ## 2. Add the login API

  Guide: api-conventions
  Guide: testing

  - [ ] 2.1 add the route
  - [ ] 2.2 unit tests
  ```

- `flume task write ID plan` refuses (exit 1) a plan naming a guide that does not exist.

### Delivery

- `flume task instructions ID`: the instructions for the task's current phase: that phase's text from the built-in workflow (fl-fu3v), its template, and the full text of each guide pushed to that phase, each in its own `<guide name="..." stage="...">` element (fl-87h9).
- `flume task next ID`: the current plan group, then the guides the group names and the guides pushed to `implement`, each in its own `<guide>` element.
- A pushed guide that has since disappeared is reported in the output, not an error.

### Prime and instructions

- `flume prime` keeps the high-level overview of the workflow: the phases, what each is for, the human is in control.
- `flume task instructions ID` gives the specific steps for the task's current phase. Each phase's step text is built into flume (split out of fl-fu3v's base text), with its template and pushed guides.

### No advancing without the instructions

- `flume task instructions ID` (and `claim`, which prints them) records in the task's history (fl-eg2q) that this agent fetched the instructions for the current phase.
- When an agent moves a task to a later phase (`flume task phase ID PHASE`, forwards, including skipping), flume refuses (exit 1, nothing changed) unless that same agent fetched the instructions for the task's current phase since the task entered it. The message names the command to run.
- Moving backwards is not gated. The human (no agent detected, fl-6hkt) is never gated.

### Agents find the instructions without knowing to look

- `flume task show ID` is the task's data (fields, parts, pushed guides) for humans and scripts; `flume task instructions ID` is what to do now, for the agent.
- `flume task claim ID` (and `assign` to yourself) prints the current phase's instructions right after claiming, as `instructions` would. Claiming a task you already hold prints them again (resuming).
- `flume task phase ID PHASE` ends with one line: `next: flume task instructions ID`.
- `flume task show ID` text output ends with one line: `For what to do now: flume task instructions ID`. Not in `--json`.

### Built-in text (fl-fu3v)

- Step 1 becomes: claim the task (flume task claim ID); it prints your instructions for the task's current phase. Follow them. To see them again, run flume task instructions ID, not flume task show (that prints the task's data, not what to do).
- In every phase: if you see guides (flume guide) that matter for a later phase of this task, push them (flume task guide ID NAME --phase PHASE). Read any guide that matters for your own work now (flume guide NAME).
- Plan phase: decide which guides apply to each group and name them with `Guide:` lines.

### Assumed (advisor; change if wrong)

- Guides are pushed per phase or per plan group, not per plan item: `flume task next` hands out one group at a time.
- A guide's own `stage` (fl-x6xn) stays a hint shown in lists; pushing is what ties a guide to a task's step.

## Discussion (for reference, not authoritative)

### 2026-11-17, the human (verbatim)

> Idk how guides get to agents for sure. But one way is this:
>
> When writing a task, somehow the human or agent can specify guides that are relevant for this task specifically. Eg the agent writing the plan should evaluate list of guides wrt the work being planned and should then include in the plan "use guide abc here" and then, when the agent reads the plan through flume, flume will output the guide right along with that section of the plan.

Context: advisor described guides as built (fl-x6xn): listed in prime, printed by flume guide, `stage` only a label so far.

Advisor drafted guides named per plan group, printed by flume task next, and asked about task-wide guides. The human:

> Similarly for different steps in the workflow. A guide on "how to design a database schema" should be inserted into the prompt returned to the agent when the agent asks flume for the instructions for the design step if that step is related to DB schema design.
>
> So guides have a push and pull mechanic. At an earlier step, the agent can determine that ABC guide is relevant and then record that somehow so when the next agent works on that step, the guide is output. This is a PUSH.
>
> Alternatively an agent can PULL a guide by noticing "I'm writing specs about the CLI and I saw a CLI guide in the list, I'll read it now"

Advisor had `guides` as a flat list of `<phase>:<name>` strings. The human (voice; "tank" read as task):

> Guides should be nested in the tank for readability

> YAML
>
> guides:
>   Design:
>     - ABC

Advisor asked lowercase or capitalized phase keys (phase names are lowercase elsewhere). The human:

> Agents are too black and white. Yes keep it flat that doesn't mean at the cost of usability

Advisor's reading: nesting stays; keys stay lowercase, matching the phase names.

> What difference between show and instruction? It sounds right but I'm worried agents will run show. It needs to be made clear and explocit

Advisor: kept the new command, and made claim print the instructions, phase and show point to it, and the built-in text say which to run.

> Yes prime should list the high level overview of the workflow but instructions show the specific steps.
>
> I think flume should refuse to advance the task in the workflow if this same agent has not run instructions
