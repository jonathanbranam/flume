+++
id = "fl-94yx"
title = "Phases optional: tasks in a project or workspace need not go through the base workflow's phases"
kind = "feature"
state = "built"
created_at = "2026-11-25T12:16:02.311Z"
updated_at = "2026-11-25T15:11:12.624222303Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:p94yx",
]
branch = "bridle/p94yx"
commit = "d80d345"
summary = "Removed flume's built-in workflow: the task phase (field, list column and filter, API), flume task phase / instructions / guide, the forward gate, bare flume workflow, and phases.md (shipped and layered). The five-phase steps are now plain text in base/workflow.md (light's in its workflow.md). Parts are any plain name; the plan keeps its form check, next/done/skip and Guide: lines (next now prints only the group's guides). Old phase and guides fields stay in task.yaml and are ignored. Specs edited in place (instructions.md folded into workflow.md). Choices are on the thread. Workflow as config is fl-4k35."
ticket = "94yx"
+++

docs/tickets/open/phases-optional-tasks-in-a-project-or-workspace-need-not-go-94yx.md

## Thread

### note · external:advisor · 2026-11-25T12:16:02.354Z
advisor: filed from the human's words; pending (feature). First step is the analysis of where phases are enforced.

### note · external:advisor · 2026-11-25T14:18:58.253Z
advisor: reframed from the human's words (Discussion): flume must not assume the workflow; analysis, then design, then a plan. Folds in fl-h8ty (kinds choose their workflow). Pending: design first, the human decides what to build.

### note · external:advisor · 2026-11-25T14:28:30.994Z
advisor: analysis written under Design, with the rip-out proposal and two open points (parts, plan checklist).

### note · external:advisor · 2026-11-25T15:00:01.804Z
readied by external:advisor

### note · external:advisor · 2026-11-25T15:00:01.830Z
human via advisor: readied. The human approved the rip-out ("I would approve a full rip-out of everything") and decided each point (Discussion). Design is final; Guide: lines kept is an advisor assumption (see Assumed).

### note · external:orchestrator · 2026-11-25T15:05:45.652Z
From orchestrator: fl-94yx planned and queued; start it. Sonnet, one ticket (mostly removal; the Design's Analysis lists the files). Done when everything under Remove is gone, everything under Change is changed, everything under Keep still works, the specs and tests are updated, and the check is green. Existing tasks' phase and guides fields stay on disk and are ignored; no migration.

### note · agent:p94yx · 2026-11-25T15:11:11.113Z
p94yx: choices made while building (change if wrong)
1. "template ID NAME" read as shorthand: flume task template keeps its form (template PART [--project P]); a part with no template prints nothing, exit 0.
2. A part name is a plain name (letters, digits, dot, hyphen, underscore; starts with a letter or digit). Refused: a name differing only in case from a part the task has (rule no-case-colliding-paths); comments stays write-refused (use flume task comment). Parts list: body first, comments last, others by name.
3. flume preview template with a non-plain name now exits 1 (was a usage error naming the four parts). flume check now reads every templates/*.md, not only the four.
4. Bare flume workflow now just prints the group's help (the group only has install). GET /api/workflow and the phase, instructions and guides POSTs are 404; an old ?phase query is ignored.
5. design/specs/instructions.md deleted; its two surviving requirements (r-4b01, r-4c05) moved into workflow.md. Added requirement r-6f4f (unused task.yaml fields are kept and ignored).
6. A base/phases.md or projects/P/phases.md already in a tasks repo (for example from an installed light) is now silently ignored.
7. The shipped workflow.md says flume does not enforce it, and tells an agent to pick the phase from the task's parts and comments, since no phase is stored. Wording worth the human's eye; so is light/workflow.md.

### note · agent:p94yx · 2026-11-25T15:11:12.611Z
built: d80d345 (branch bridle/p94yx)

### note · agent:p94yx · 2026-11-25T15:11:12.624Z
done: fl-94yx built-in phases removed, workflow is text, parts ad hoc; check (npm run check) exit 0, 284/284 tests, spec check 0 errors, unbound 18 (ui.md only), on d80d345 (already contains main). No UI change, so no browser pass. last-full-test-count file is absent. Test count was lower than before only by removed behaviour. Choices on the thread.
