# Workflow: later enhancements

Status: draft for the human's review and revision. Not decided, not scheduled. Workflow v1 is
ticket fl-fu3v; the OpenSpec model these draw on is in `docs/research/openspec.md`.

## v1, for reference

- v1 built five phases (proposal, design, specs, plan, implement) into flume. Ticket fl-94yx
  removed them: the workflow is now only text in `workspace/workflow.md`, which flume does not enforce.
- Bringing the workflow back as config, one step at a time, is ticket fl-4k35.

## Later

The human's list, 2026-11-17 (verbatim): "Later enhancements, record these in a document for
review and revision".

1. **Workflow per task.** "workflow can be specified differently for different tasks". E.g. a
   task (or its kind) names its workflow; a bug might go proposal -> implement.
2. **Workflow is a DAG.** "workflow is a DAG". Steps list what they require, as OpenSpec's
   schema does (specs and design both unlock after the proposal); v1 is a line.
3. **Optional and required steps.** "some steps become optional or required". E.g. specs
   optional for a chore, required for a feature; flume refuses to move past a required step that
   has no part written.
4. **Steps for a different agent with a role.** "some steps MUST be done by a different agent
   with a specific role". E.g. the design is reviewed by an agent with the `reviewer` role (roles
   are files, fl-3pfa), not by the agent that wrote it; flume refuses the step to the same agent.
5. **Templates can be overridden.** Moved into v1 (fl-fu3v), the human: "actually, template overridding can happen today; instead of concat, it should just replace." The project template replaces the workspace one, which replaces the built-in one.

Also deferred from v1 (fl-fu3v), the human's words:

- Persistent specs: "persistent specs can come later". A task's spec merged into living project
  specs at close (OpenSpec's delta specs and archive).
- Verify: "verify can come later". Check the work against the spec before close.
- Branching: "v1 workflow is linear; later it can branch" (item 2).

## Open (for the human)

- Where a workflow is defined once it is more than a line: a YAML file per workflow in
  `<flume-root>/workspace/` and `projects/<p>/` (like OpenSpec's schema.yaml)?
- Does the generic continue skill and CLI-generated per-step instructions (OpenSpec's model,
  fl-fu3v Discussion) come with the DAG, or separately?
