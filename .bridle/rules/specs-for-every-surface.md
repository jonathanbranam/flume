---
id: specs-for-every-surface
severity: must
roles: [orchestrator, project-manager, manager, worker, reviewer, advisor]
---
Every CLI command, every daemon API endpoint, every UI view and the task file format has a
bridle spec, and every executable scenario has a test that names its scenario ID.

- **Where**: bridle capability specs in `design/specs/<capability>.md`. `bridle spec id` assigns
  stable IDs; `bridle spec check --require-ids` must be clean; `bridle spec coverage` must list no
  unbound executable scenario.
- **Style**: each requirement is one EARS sentence ("When <trigger>, flume SHALL <response>";
  "flume SHALL ..." for a rule that always holds), with Given/When/Then scenarios under it as
  examples and acceptance checks. Bridle's spec parser accepts this (checked 2026-11-16).
- **Plain-text steps**: GIVEN/WHEN/THEN lines are matched literally by step definitions, so no
  Markdown in them (no backticks); put commands and paths in as plain words.
- **Spec first**: a change to behaviour edits the spec in place on its branch, in the same change
  as the code and tests. No behaviour lands without its spec and test.
- **Tests name scenarios**: put the scenario ID (`s-xxxx`) in the test's name or a comment beside
  it, so `bridle spec coverage` binds it.

Why: the human, 2026-11-16 ~11:20 PM ET (via advisor): "I DO want clear specs written for every
CLI command and the API and UI - use bridle specs and write tests for them". Spec style: "yes,
that's it" to EARS + Given/When/Then (ticket fl-47b8).
