---
id: fl-94yx
title: "Remove the rigid built-in phases: the workflow is text in base/workflow.md, flume enforces none of it"
kind: arch-revision
created: 2026-11-25
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-4k35, fl-vpvk, fl-mv4r]
---

## The ask

Flume must not assume the workflow. Remove the rigid built-in phases: the workflow becomes plain
text in base/workflow.md, and flume stops validating or enforcing any of it. The as-built design
was not wrong, only too rigid; workflow comes back as config later, one step at a time (fl-4k35).

## Design

### Remove

- **The phase field**: a new task gets no phase; an existing one is ignored. No flume task phase,
  no phase column or --phase filter in flume task list, no ?phase or POST /api/tasks/ID/phase, no
  phase lines in new history.
- **The forward gate** (instructions r-4d04).
- **flume task instructions**, and claim printing instructions; claim just claims. No
  instructions history lines; flume task phase's "next:" pointer goes with the command.
- **Guides pushed to phases**: flume task guide ID NAME --phase, the guides field in task.yaml,
  and flume task next printing the guides pushed to implement.
- **flume workflow** printing the phases; flume workflow install stays.
- **phases.md** as a layered document, flume preview phases, workflows/light/phases.md.
- The specs and tests of all of the above.

### Change

- **Parts are ad hoc**: a part is any plain name (flume task write, show and template ID NAME);
  flume only stores it. body stays required (it is the task). A template is looked up by the part's
  name in the layers as today; a part with no template prints none.
- **base/workflow.md** takes in the steps from base/phases.md as plain text, so agents still get
  the five-phase guidance as words; light's workflow.md takes in the useful lines of its phases.md.
- **Text that describes the phases as flume behaviour**: top-level --help (src/cli/main.ts), the
  not-set-up text (src/cli/agent.ts), docs/help/usage.md.

### Keep

- **The plan**: the part named plan keeps its form check and flume task next, done and skip,
  exactly as defined.
- **Guide: lines in plan groups** stay as they are, checked against existing guides and printed
  by flume task next. They belong to the plan, not to phases. How guides, steps and the plan
  relate is an open point for workflow as config (fl-4k35, step 6).
- Everything else: tasks, kinds, comments, assign/claim/--force, history, close/reopen, epics, the
  layer merge, flume guide, prime and the identity lines, flume workflow install, flume check.

### Assumed (advisor; change if wrong)

- Existing tasks keep their phase and guides fields on disk; flume ignores them (no migration:
  the human, "there are no old files").
- Guide: lines are kept rather than removed: removing them is easy later, putting them back is
  not, and the human is undecided.
- body is the one required part; any other name is free.

### Analysis: where flume assumed the workflow (advisor, 2026-11-25)

1. The phase field: src/core/store.ts, src/core/workflow.ts PHASES, flume task phase, task list
   --phase and column, the API, history. Specs: workflow r-47db and related; api; cli.
2. The forward gate: src/daemon/server.ts; instructions r-4d04.
3. Instructions per phase: src/core/instructions.ts, claim; instructions r-4c01, r-4d01.
4. Guides pushed to phases: src/core/update.ts pushGuide; instructions r-4a01, r-4a04.
5. flume workflow: src/core/workflow.ts PHASE_PART_OF, src/cli/workflow.ts.
6. Fixed parts and templates: WRITABLE_PARTS.
7. The plan form: src/core/plan.ts, parts.ts; instructions r-4b01, r-4c05.
8. phases.md: src/core/documents.ts TOP, flume preview phases, workflows/light/phases.md.
9. Text: src/cli/main.ts, src/cli/agent.ts, docs/help/usage.md, base/workflow.md.

The UI shows no phase; close does not look at the phase or the plan.

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

The human, 2026-11-25, verbatim, on the analysis (numbers as in the analysis above):

> The solution as-built is not incorrect, it is just too rigid. So, we will need to come back in a subsequent ticket and implement "workflow as config". As you're removing this rigid implementation, make that ticket and note how we should re-introduce workflow in the future. We should introduce it slowly, carefully, one step at a time.
>
> 1. agree to remove; in the future, valid phases will be configured per workflow;
> 2. forward gate will definitely be re-introduced, through configuration
> 3. per-phase instructions will be part of future solution
> 4. seems fine to remove
> 5. yes, this will be reintroduced later and would print the workflow as defined in config
> 6. I think even in destination state, a user of flume can create adhoc task parts. The workflow-as-config would list the required parts and templates
> 7. flume can retain plans as defined. I think this is something we will keep. whether plans can be further configured by users is TBD
> 8. agree to remove; future this will need to be generated by flume based on the config
>
> agree on (2) plan checklist; keep it for the part named plan
>
> I'm not sure exactly how to decide about (4) the guide and phases and plan relationship
