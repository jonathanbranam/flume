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

- A workflow is a series of steps to follow.
- The workflow lives in `<flume-root>/base/workflow.md` (workspace) and `<flume-root>/projects/<project>/workflow.md` (project), and `flume prime` prints it; agents never read the files (layout and prime: ticket fl-3pfa).
- A guide can be scoped to a workflow stage (ticket fl-x6xn).

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
