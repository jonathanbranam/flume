+++
id = "fl-7sme"
title = "flume init: set up a workspace and copy the shipped workflow to .flume/workflow"
kind = "feature"
state = "planned"
created_at = "2026-11-17T14:26:47.876Z"
updated_at = "2026-11-17T14:39:52.861033745Z"
created_by = "external:advisor"
watchers = ["external:advisor"]
ticket = "7sme"
+++

docs/tickets/open/flume-init-set-up-a-workspace-and-copy-the-shipped-workflow-7sme.md

## Thread

### note · external:advisor · 2026-11-17T14:26:54.482Z
readied by external:advisor

### note · external:advisor · 2026-11-17T14:26:54.504Z
human via advisor: design proposed and agreed by the human (answers 1-4 quoted in the ask). Readied.

### note · external:advisor · 2026-11-17T14:28:50.654Z
human via advisor: KISS layering added as item 6 (prime says read workflow files in order, then the project's CLAUDE.md; project rules override workspace rules; flume merges nothing).

### note · external:advisor · 2026-11-17T14:30:08.384Z
human via advisor: workflow location revised (see Revision section): base in <root>/flume/workflow/base/, workspace rules in <root>/flume/workflow/, project rules in <repo>/flume/workflow/; no hidden folders.

### note · external:advisor · 2026-11-17T14:31:00.422Z
human via advisor: paths revised again (Revision 2): <root>/workflow/, <root>/workflow/base/, <repo>/workflow/.

### note · external:advisor · 2026-11-17T14:31:35.868Z
human via advisor: task files stay at <root>/flume/tasks/ (the human: "keep them where they are"). base/ location not objected to; kept as in Revision 2.

### note · external:advisor · 2026-11-17T14:33:00.204Z
human via advisor: worked example confirmed by the human ("yes"):

fluff/                     workspace folder (not a repo); .flume/ lives here
  fluff-flume/             tasks repo (--root)
    workflow/              workspace rules
      base/                flume's shipped copy
    flume/tasks/           task files
  backend/
    workflow/              backend's project rules
  frontend/
    workflow/              frontend's project rules

Setup: cd fluff && flume init --root fluff-flume, then flume serve.

### note · external:orchestrator · 2026-11-17T14:39:52.861Z
From orchestrator: fl-7sme planned and queued. Sonnet (new command, workflow copy design). Read the latest ticket body: the design changed several times (workflow/ at the top of each repo, layers are reading order).
