---
id: fl-fu3v
title: "flume workflow v1: phases, claim and assign, built-in base text"
kind: feature
created: 2026-11-18
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-3pfa, fl-87h9, fl-eg2q]
---

## The ask

Workflow v1: flume's built-in base text tells agents how to work a task through five phases (proposal, design, specs, plan, implement), and tasks record who holds them and which phase they are in. The human is in control of moving between phases. The audit trail is ticket fl-eg2q. On hold until the human says build.

For whoever edits this ticket (the human, 2026-11-17): "the design at the top is the currently agreed-upon design; keep it current and DO NOT include narration or restatements in the design. The discussion section can include the discussion narrative with restatements as a reference."

## Design

### Everything through flume

- Every change to anything in the tasks repo goes through a flume command. Agents never read or edit its files directly, and do not need to know where they are.
- Agents refer to a task's parts by name (`body`, `design`, `spec`, `plan`, `comments`), never by file path. The task commands' default output names no paths in the tasks repo (`flume task new` prints the ID only).
- Each command that changes a task commits it (as today) and appends to its history (fl-eg2q).

### Task fields (task.yaml, flat; layout fl-3pfa)

- `assignee`: who must act next: an agent name, or `human`. Empty when nobody holds the task.
- `agent`: the working agent: the agent the task was last assigned to. Kept when the task is assigned to the human for feedback, so the human can see which running agent is on it.
- `phase`: one of `proposal`, `design`, `specs`, `plan`, `implement`. A new task starts at `proposal`.
- A task is ready to build when its phase is `implement`.

### Task parts (files in the task's folder; agents see only the names)

- `body` (`body.md`): the proposal: goal and scope.
- `design` (`design.md`), `spec` (`spec.md`), `plan` (`plan.md`): one per phase.
- `comments` (`comments.md`, fl-3pfa): written only by `flume task comment`. Important conversations with the human are recorded there, the human's words verbatim. No separate discussion file.

### The plan

- The plan is a checklist: numbered groups, each with numbered items. Each item is open (`[ ]`), done (`[x]`) or skipped (`[-]`):

  ```
  ## 1. Implement login

  - [ ] 1.1 create db
  - [ ] 1.2 create schema
  - [ ] 1.3 unit tests
  ```

- `flume task write ID plan` refuses (exit 1, says what is wrong) a plan not in this form.
- Flume feeds the agent one group at a time: the first group with an open item. The agent gets the next group only when every item in the current one is done or skipped.
- Skipping an item needs a reason. The reason is stored in the plan, on the line under the item (`  Skipped: <reason>`), and the skip goes in the history (fl-eg2q).

### Commands


- `flume task show ID`: the task's fields (including the three below) and which parts it has.
- `flume task show ID PART`: prints that part's text. A part the task does not have: exit 1, with a message.
- `flume task write ID PART [--file PATH|-]`: replaces the part's text (body, design, spec or plan) with the file's or standard input's. `--remove` removes the part instead.
- `flume task assign ID [NAME|human] [--force]`: sets `assignee` to NAME, or to `$AGENT_NAME` when NAME is left out (an agent taking the task). When the assignee is an agent, sets `agent` too. Assigning a task to whoever already holds it succeeds and changes nothing.
- When an agent (`$AGENT_NAME` set) assigns a task that someone else holds, without `--force` flume changes nothing, exits 1, and says who holds it and that `--force` takes it over. The human (no `$AGENT_NAME`) never needs `--force`: they re-assign at any point.
- `flume task claim ID [--force]` is shorthand for `flume task assign ID [--force]` (to yourself) and works exactly the same: same checks, messages, exit codes and history.
- `flume task next ID`: prints the current plan group (heading and items, as above). When every item is done or skipped, says the plan is complete. No plan: exit 1, with a message.
- `flume task done ID ITEM...`: marks the items (e.g. `1.1 1.2`) done.
- `flume task skip ID ITEM... --reason TEXT`: marks the items skipped, with the reason. `--reason` is required.
- `done` and `skip` refuse items outside the current group or not in the plan (exit 1, nothing changed).
- `flume task phase ID PHASE`: sets `phase`. Any phase may follow any other (forwards, backwards, skipping).
- `flume task list` shows `phase` and `assignee`, and takes `--assignee NAME|human` and `--phase PHASE`. `--json` as rule cli-json-output.

### Built-in base text

Replaces today's built-in prime text (`src/cli/agent.ts`); printed first by `flume prime` (fl-3pfa), inside its XML section (fl-87h9). Its content, to be tightened by the builder but not extended:

```
You are agent {name}, stored in $AGENT_NAME. Use the flume CLI to work with tasks; run flume --help to learn it. Never start flume serve yourself; only the human does. If flume says the server is not running, ask the human to start it.

Read and change tasks only with flume commands. Never read or edit task files directly.

The human is in control. They may move a task to any phase, forwards or backwards, or skip phases ("write design and specs", "remove the specs and start over on the design", "the ticket is simple, skip specs and plan, just implement"). Do what they ask.

Working a task:
1. Claim the task (flume task claim ID). Read its phase (flume task show ID) and continue from that phase.
2. The phases, in order (read a part with flume task show ID PART; write one with flume task write ID PART):
   - proposal: check that the task has a clear proposal, goal and scope. If not, ask the human. Write them in the body.
   - design: when goal and scope are clear, think through the design questions and write the design.
   - specs: when the design is clear, write the spec: clear requirements in EARS form ("When <trigger>, the system SHALL <response>").
   - plan: read the body, design and spec, then write the plan: how to implement the task, step by step. Then mark the task ready: flume task phase ID implement.
   - implement: read the body, design and spec for context. Get the current group of plan items (flume task next ID), do them, and report each one: flume task done ID ITEM, or flume task skip ID ITEM --reason TEXT if it should not be done. Repeat until the plan is complete. When writing code, enter a git worktree to make the changes; when done, merge main into it, then exit the worktree and merge it into main. Close the task when done.
3. When your phase is done, set the next phase (flume task phase ID PHASE). One agent will likely not do the whole workflow: another may take the next phase, or finish the plan. If you are waiting on the human, assign the task back to them (flume task assign ID human).
4. In every phase, record important conversations with the human as comments (flume task comment ID), quoting the human verbatim.
```

### Not in v1

- No workflow schema file, no per-step instruction commands, no shipped continue skill (the OpenSpec-like model in Discussion is for later).
- Project and workspace workflows stay free text printed by prime (fl-3pfa); flume does not parse them.
- No persistent specs: a task's spec stays with the task; merging it into living project specs comes later.

### Assumed (advisor; change if wrong)

- `[-]` covers both skip and cancel; the human named both with the one marker. Command names `next`, `done`, `skip` (not `check`, which is `flume check`).
- Part names `body`, `design`, `spec`, `plan`; `flume task show ID PART` to read and `flume task write ID PART` to write, `--remove` to drop one ("remove the specs and start over").
- The everything-through-flume rule covers the task commands in this ticket. Other flume output that names tasks-repo paths (e.g. `flume init`, `flume status` for the human) is left alone.

## Discussion (for reference, not authoritative)

### 2026-11-17 ~11:00 PM ET, the human: the v1 flow (verbatim)

> yes, write a real base that is simple. also can agents claim tickets? Basic flow is:
> NOTE: we need claims or assigned to in the task; also we should have:
>
> - something like "last agent" or "working agent" for the agent that is working on a ticket currently, even if the ticket is assigned to the human for feedback, so I know which running agent is working on it; human may re-assign at any point
> - keep an audit trail also inside the task folder that is structural. probably JSON. Record changes to the ticket and history. Textual history is stored in github, don't recreate github, but store the updated that went through flume. status changes, phases, body updates with the timestamp and agent responsible.
>
> 1. claim a ticket, check the current phase in the workflow and continue from the following list:
>
> proposal: determine if the ticket has clear proposal, goal, and scope, if not ask user; write them in the body.md of the ticket; track important conversations in discussions.md
> design: when goal and scope are clear, think through any design questions and write them in design.md
> specs: when design is clear, write clear spec.md using EARS
> plan: read the body, design, spec and write a clear plan on how to implement the ticket, mark the ticket ready
> implement: read body,design,specs for context, then follow the steps in the plan to implement the ticket.
>
> Overall guidance: the human is in control. They can ask you to move between phases and go backwards or forwards. Human can say "write ddesign and specs" or "remove the specs and start over on the design" or; "the ticket is simple, skip specs and plan, just directly implement."
>
> The same agent may not complete each step in the workflow. When your step is done, if you are watiing on the human, assign it back to the human

> ok, that's a lot more than just a "base workflow" sorry! I think that's a good overall design for v1 of the workflow as a whole

> also add: when writing code, enter a worktree to make changes. when done, merge in main, then exit worktree and merge it into main

> an agent can claim a task also. that's fine

Advisor asked: a claim is refused when the task is already assigned to someone else; only assign takes it over. The human:

> it should be prompted and require a flag though

Advisor's reading: the refusal message is the prompt (agents run without a terminal, so no interactive question), and `--force` takes the task over.

Asked the difference between assign and claim (claim = assign to yourself, with the --force check), the human:

> one command

Advisor: one `flume task assign ID [NAME]`, no NAME = yourself; the --force check applies only when an agent takes a task someone else holds, so the human's re-assigning ("at any point") never needs it.

Then the human:

> then update the workflow to say "assign the task to yourself"

> I guess, if CLAIM is shorthand for "assign my-id" that's totally fine, but they should work exactly the same

> sure, then just say "claim the task"

Asked one file or two for important conversations (discussions.md vs fl-3pfa's comments.md):

> sure, one file: comments

Asked whether agents write the task files through flume (so the audit trail records each update) or edit them directly:

> all task updates go through flume; agents shouldn't even know where the files are. EVERYTHING that is editing in fluff-flume must go through flume.

Advisor compared v1 with OpenSpec and suggested: living specs, a checklist plan ticked off during implement, a check before close, section outlines per part. The human:

> persistent specs can come later
> the plan must be checked off, I thought we had that discusses before, flume should feed the agent a single list like
>
> ---
> ## 1. Implement login
>
> - [ ] 1.1 create db
> - [ ] 1.2 create schema
> - [ ] 1.3 whatever
> - [ ] 1.4 unit tests
>
> ---
>
> The agent has to report completion or cancel ([-]) of all items before getting the next set of items to implement. They can skip, but that should be require an explanation that is also stored. probably with plan.md?
>
> Clarification: It is true that one agent may not complete the plan, but what I meant was that definitely one agent likely will not complete the entire workflow

Context: asked what flume's built-in workflow text is, advisor showed today's prime text (identity, flume --help, never start flume serve; no workflow steps). Advisor: Open questions 1-7 below (from before the v1 flow) are superseded for v1 by the Design; they stay for the later OpenSpec-like model. The audit trail went to its own ticket, fl-eg2q.


### 2026-11-17, the human (verbatim)

> Make another ticket on workflow with the same instructions. A workflow is going to be a series of steps to follow.

> I really like yaml frontmatter; so, we're going to have yaml parsing; I think we bite the bullet and just make everything yaml now and it's totally fine.

Earlier (handover): the human will send their own agent workflow (worktrees, merge main before exit, agents don't push, commands to avoid); that becomes the base workflow's content.

### Open (advisor, for the human)

1. Are "steps" and "stages" the same thing? Guides are scoped to a stage; the Design treats a stage as a named step.
2. How steps are written: Markdown headings in `workflow.md`, YAML front matter listing them, or one file per step?
3. How a project workflow combines with the base one: replaces it, appends steps, or overrides steps by name?
4. Does flume track which step a task or agent is in (e.g. a field in task.yaml), or are steps only text for the agent to follow?

### The OpenSpec flow as the model (2026-11-17)

The human, verbatim: "I really like the openspec flow of new-change -> continue-change -> continue-change -> apply. the workflow itself defines the flow through artifacts. "continue" is a generic skill that uses `openspec` cli to dynamically generate the prompts for the agent. this is the model for flume workflows."

How OpenSpec does it (advisor read the skills and ran the CLI, see fl-87h9): `openspec status --change <name> --json` lists the schema's artifacts with status (done / ready / blocked by ...); the continue skill picks the first `ready` artifact, runs `openspec instructions <artifact> --change <name> --json`, writes that one artifact from `template`, `instruction`, `context`, `rules` and `dependencies`, and stops. The schema (`spec-driven`: proposal -> specs + design -> tasks) defines the artifacts and their dependencies. `apply` then works through `tasks.md`.

### Open (advisor, for the human)

5. Commands: flume equivalents of `openspec status` and `openspec instructions <artifact>` (e.g. `flume task status <id>`, `flume task instructions <id> <step>`)?
6. Where a workflow's steps are defined: a YAML file listing steps, their artifact file and what each needs (like an OpenSpec schema), with each step's instruction and template as Markdown files?
7. Does flume ship the generic continue skill (and new / apply), installed where Claude Code finds skills?

The human, 2026-11-17: "we don't have to copy openspec exactly, we should improve on it, but the overall design is sound."
