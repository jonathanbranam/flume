---
id: fl-fu3v
title: "flume workflow: a series of steps to follow"
kind: feature
created: 2026-11-18
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-3pfa]
---

## The ask

Design and build flume workflows. On hold until the human says build; the design is mostly open.

For whoever edits this ticket (the human, 2026-11-17): "the design at the top is the currently agreed-upon design; keep it current and DO NOT include narration or restatements in the design. The discussion section can include the discussion narrative with restatements as a reference."

## Design

Modeled on OpenSpec's flow: `new-change` -> `continue-change` -> `continue-change` -> ... -> `apply`. The overall design is OpenSpec's; the details need not copy it, and should improve on it where they can.

- A workflow is a series of steps to follow. The workflow defines the steps and the order through them; each step produces an artifact in the task's folder (fl-3pfa: spec artifacts beside `task.yaml`, `body.md`, `comments.md`).
- One generic "continue" skill drives every workflow: it runs `flume` to find the task's next step and to print that step's instructions, generated from the workflow, then the agent does the step. The skill holds no workflow-specific text; the workflow does.
- Agent text from these commands follows fl-87h9 (XML sections).
- The workflow lives in `<flume-root>/base/` (workspace) and `<flume-root>/projects/<project>/` (project); agents never read the files (fl-3pfa).
- A guide can be scoped to a workflow stage (fl-x6xn).

## Discussion (for reference, not authoritative)

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
