---
id: fl-94yx
title: "Workflows declared, not assumed: shipped and user workflows, a default per workspace and project, kinds mapped to workflows"
kind: arch-revision
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

### Analysis: where flume assumes the workflow (advisor, 2026-11-25, main at today's head)

**Workflow mechanics flume enforces or assumes (rip-out candidates):**

1. **The phase field.** A new task is written with phase: proposal (src/core/store.ts); the five
   names are fixed (src/core/workflow.ts PHASES); flume task phase refuses any other name;
   flume task list prints a phase column and takes --phase; the API takes ?phase and POST
   /api/tasks/ID/phase; history records phase changes. Specs: workflow r-47db and the phase,
   list and history requirements; api; cli.
2. **The forward gate.** An agent moving a task to a later phase is refused (409) unless it read
   that phase's instructions since the task entered it (src/daemon/server.ts; instructions
   r-4d04).
3. **Instructions per phase.** flume task instructions prints the current phase's H2 of
   phases.md plus "Every phase", the phase's template and its pushed guides
   (src/core/instructions.ts); claim prints them and records an instructions history line;
   flume task phase ends with "next: flume task instructions ID" (instructions r-4c01, r-4d01).
4. **Guides pushed to phases.** flume task guide ID NAME --phase P; task.yaml guides nested by
   phase; pushing to an earlier phase refused (src/core/update.ts pushGuide; instructions
   r-4a01, r-4a04).
5. **flume workflow** prints the five phases, the part each writes and what each requires
   (src/core/workflow.ts PHASE_PART_OF; src/cli/workflow.ts). flume workflow install is
   separate and generic.
6. **Fixed parts and templates.** A task's parts are body, design, spec, plan, named so
   (WRITABLE_PARTS); task write, show and template refuse other names; templates exist per part.
7. **The plan form.** task write ID plan refuses a plan not in numbered groups and items;
   task next, done, skip work the current group; Guide: lines in a plan group are checked
   against existing guides (src/core/plan.ts, parts.ts; instructions r-4b01, r-4c05).
8. **phases.md** as a layered document (src/core/documents.ts TOP), flume preview phases, and
   workflows/light/phases.md.
9. **Text that describes the five phases**: top-level --help (src/cli/main.ts), the not-set-up
   text in src/cli/agent.ts, docs/help/usage.md (about 14 places), base/workflow.md.

**Generic, keep as they are:** tasks, kinds, body, comments, assign/claim/--force, history,
close/reopen with resolution, epics/roadmap, the layer merge engine (workflow.md, project.md,
first-prompt.md, roles, guides, templates), the guide library (flume guide), prime and the
identity lines, flume workflow install with the none and light workflows, flume check. The UI
shows no phase (ui spec has none); close does not look at the phase or the plan.

### Proposed first step: rip-out (the human approved, if it is the fastest path)

The whole workflow becomes text in base/workflow.md; flume stops validating or enforcing any of it.

- Remove items 1 to 5 and 8: no phase field (a new task gets none; an existing one is ignored),
  no flume task phase, no --phase filter or column, no forward gate, no flume task instructions
  (claim just claims), no guides pushed to phases, flume workflow prints no phases (keeps
  install), no phases.md. Their specs and tests go with them.
- base/workflow.md takes in the steps from base/phases.md as plain text; light and none drop
  phases.md.
- Update the text in item 9.

Open for the human (advisor's recommendation first):

- **Parts (item 6)**: let a part be any plain name (task write/show/template ID NAME), templates
  any name; flume only stores them. Alternative: keep the four fixed names for now.
- **Plan checklist (item 7)**: keep task next/done/skip as a generic checklist tool on the part
  named plan, drop the Guide: line check. Alternative: remove it too; workflows say "write a
  checklist" and agents edit it.

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

The human, 2026-11-25, verbatim: "yes, perform the analysis now. I would approve a full rip-out
of everything if that is the most expeditious path forwards. The entire workflow can become simply
text in base/workflow.md and flume itself stops validating or enforcing any of the workflow. That
would be the first, direct solution."
