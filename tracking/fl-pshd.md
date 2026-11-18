+++
id = "fl-pshd"
title = "flume clone: set up a whole workspace from the tasks repo; flume.yaml lists projects and repos"
kind = "feature"
state = "integrated"
created_at = "2026-11-18T02:01:06.414Z"
updated_at = "2026-11-18T03:11:44.843445891Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:clone",
]
branch = "bridle/clone"
commit = "8e7a43d6c2041a36f82491bdb423e4e5f1df967a"
summary = 'flume.yaml gains projects (name -> url, optional branch; src/core/projects.ts); flume check reports a missing url or a bad folder name. init now re-runs safely (no "already set up" error), reports missing projects, and --clone clones them (failed clone reported, rest continue, exit 1). New flume clone <url> [<ws>] (clone tasks repo under its own name, then init --clone, root set to it), flume project list [--json] / add (src/cli/project.ts). Specs: cli.md and task-files.md, 15 new scenarios, all bound to tests (test/project.test.ts, local bare/non-bare repos as URLs, no network). Assumptions: project add with a pre-existing folder that is a clone of the same origin URL is accepted (entry added, no clone); project list/add find the workspace by walking up to .flume; a failed clone in project add leaves the committed flume.yaml entry (init --clone retries); init skips (with a stderr note) projects lacking url or with a bad name.'
ticket = "pshd"
+++

docs/tickets/open/flume-clone-set-up-a-whole-workspace-from-the-tasks-repo-flu-pshd.md

## Thread

### note · external:advisor · 2026-11-18T02:51:29.484Z
readied by external:advisor

### note · external:advisor · 2026-11-18T02:51:29.501Z
human via advisor: go. The human, 2026-11-17 ~10:40 PM ET: "ready flume-clone". Readied; still blocked_by nothing but builds on fl-3pfa, which is being built.

### note · external:orchestrator · 2026-11-18T02:57:20.674Z
From orchestrator: fl-pshd planned and queued after fl-3pfa (blocked_by). Sonnet. Then x6xn, then 87h9, one at a time (overlapping files).

### note · agent:clone · 2026-11-18T03:10:36.724Z
built: 5ae2865619f1614d4140b619962831ec9b9bd685 (branch bridle/clone)

### note · agent:clone · 2026-11-18T03:10:36.742Z
done: flume.yaml projects, init --clone (re-runnable), flume clone, flume project list/add; just check exit 0, 186 tests, 15 new scenarios bound, spec check clean; 5ae2865619f1614d4140b619962831ec9b9bd685

### note · agent:manager · 2026-11-18T03:11:43.099Z
integrated: 8e7a43d6c2041a36f82491bdb423e4e5f1df967a (branch bridle/clone)

### note · agent:manager · 2026-11-18T03:11:44.843Z
cleanup: removed origin branch bridle/clone; kept agent clone (background job pid 3673402)
