---
id: fl-94yx
title: "Workflows declared, not assumed: shipped and user workflows, a default per workspace and project, kinds mapped to workflows"
kind: feature
created: 2026-11-25
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-vpvk, fl-h8ty, fl-mv4r]
---

## The ask

Flume must not assume the workflow. The end state: flume ships several workflows, and a user can
fully override any part of the workflow system and replace it with their own. Like OpenSpec's
schemas: a workflow declares its steps (artifacts), each with its instructions, template and
dependencies, and any of that can be replaced by another workflow. A workspace and a project have
one default workflow; a project can map ticket kinds to workflows (one default for every kind, a
specific workflow for specific kinds); each ticket can choose a different workflow. The human was
not ready to build fully config-driven workflows yet, and the design is large: this ticket is the
analysis and the design first, then a decision on what to build when.

## Design

Not designed yet. Steps:

1. **Analysis**: every place flume assumes the five phases or the base workflow today (specs, code,
   CLI, daemon, UI, prime, instructions, templates, the shipped workflows), what each would do
   when a workflow declares its own steps, and what can stay.
2. **Design** for the human's review: how a workflow is declared (OpenSpec's schema.yaml is the
   model: steps with id, artifact, requires, instruction, template; docs/research/openspec.md),
   where workflows live (shipped with flume, the workspace, the project), how a project picks its
   default and maps kinds to workflows (fl-h8ty), how a ticket records its workflow, and how
   status and next steps are derived from it.
3. **Plan**: what to build first, and whether anything built already (the five fixed phases,
   phases.md, the shipped light workflow) should change now.

### Known so far (specs, 2026-11-25)

- task.yaml always holds phase, proposal for a new task (workflow spec, first requirement).
- An agent moving a task forward is refused unless it fetched the instructions for the current
  phase (instructions spec, r-4d04).
- flume task instructions prints steps per phase (phases.md, fl-mv4r); claim prints them.
- Guides are pushed to a phase, and pushing to an earlier phase is refused.
- flume task phase, flume workflow, flume task list --phase, and the plan (flume task next, done,
  skip) for implement.
- To check: whether close needs a phase or a complete plan; what the UI shows per phase; the
  prime text.

## Discussion (for reference, not authoritative)

The human, 2026-11-25 (to advisor), verbatim, after fl-mv4r, fl-vpvk, fl-a5vb and fl-hq8k landed:

> Yes, that is not OK. The workflow should not be assumed by flume. I'm not exactly sure how to fix this. I wasn't ready to build a fully config-driven workflow yet, but the previous work went further than I had planned in building a strict workflow based on the base/workflow layout.
>
> The end state is: flume ships several workflows, but the user can fully override any part of the workflow system and replace it with their own. That means that flume cannot make strong assumptions about the workflow itself. However, the shape and design of fully config-driven and overrideable workflows is large.
>
> Flume should behave similarly to openspec in this regard: openspec has a standard workflow driven by its artifacts which declare their instructions, templates, and dependencies, but all of which can be replaced by a different "scheme" There is one default "scheme" (our workflow) for a workspace + project and then each ticket can choose a different workflow. In flume also I would allow a map from kind to workflow so a project can configure one default workflow for all ticket kinds, then a specific workflow for specific ticket kinds.

Earlier, as filed:


The human, 2026-11-25 (to advisor), verbatim: "File a ticket that our phases in the base workflow
should NOT be required for tickets in a specific project or workspace. That will require some
analysis of what has been built"

Context: fl-vpvk (shipped none and light workflows) had to keep the five phases because they are
built into the code; its light workflow moves a task straight from proposal to implement.
