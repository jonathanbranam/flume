# Epics

Status: design notes. Only "Decided now" is being built (ticket fl-na9m). The rest is open, to talk
through with the human.

## What an epic is today

- A task of kind `epic`. Any other task may name one epic as its `parent`; an epic has no parent,
  so there is one level only (task-files spec, r-d671).
- `flume task list --parent ID` lists an epic's children; `--all` adds the resolved ones and
  `--json` prints them as JSON, for an agent or a script to loop over.
- Nothing else is special: an epic goes through the same five phases as any task, closing it
  does not look at its children, and there is no progress or rollup.
- The roadmap (`roadmap.md`, roadmap spec) may list any task, epics or not; nothing ties it to
  epics.

## Decided now

The human, 2026-11-18: "An epic is exempt from the workflow, and you can't resolve or close an
epic unless all the tickets are resolved. That's basically it for now."

1. **An epic is exempt from the workflow.** It does not go through proposal, design, specs, plan,
   implement. It has no phase, and the workflow commands do not apply to it.
2. **An epic closes only when all its children are resolved.** Closing an epic with an open child
   is refused and names the open children. There is no automatic way to close them all: close
   each child separately (an agent or a script loops over `flume task list --parent ID --json`),
   then close the epic.
3. **An epic's children can be listed, with `--json`.** This exists today (above).

## Open (not decided)

- **An epic's own workflow.** The human: epics "don't follow the same workflow". Either give
  epics a workflow of their own now, or wait for customizable workflows (docs/design/workflow-later.md,
  "per-task workflows") and use that to design a proper workflow for an epic. Not decided.
- **What an epic's body looks like.** Starting point: bridle's product manager role definition
  (asked of bridle's aide; to be filled in here). Bridle's working terms (its
  docs/notes/roadmap.md and docs/notes/product-manager-trial.md, 2026-10-09/10):
  - An epic is a planned group of work with an **outcome** and a **"Done when"**.
  - Its sections in practice: The ask, Outcome, Done when, Children and order, Notes.
  - A ticket belongs to an epic only if it is on the path to the epic's "Done when" (builds, and
    the design or research they wait on); ideas and investigations not yet committed to stay out
    until a decision pulls them in. The human (2026-10-10): "If it satisfies the 'when done,' then
    it can be part of that epic. If not, it's not."
  - The roadmap orders epics; themes (lasting areas) group them for reading.
- **The roadmap and epics.** Whether the roadmap lists only epics (the brief), and whether it
  shows an epic's progress.
- **Progress.** An epic's resolved children out of all its children (the UI spec's roadmap
  assumed this).
