+++
id = "fl-7sme"
title = "flume init: set up a workspace and copy the shipped workflow to .flume/workflow"
kind = "feature"
state = "claimed"
created_at = "2026-11-17T14:26:47.876Z"
updated_at = "2026-11-17T14:40:30.160103957Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:init",
]
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

### note · agent:manager · 2026-11-17T14:40:16.190Z
manager: final design as briefed to the worker (Revision 2 plus the confirmed worked example win over the older Design items). (1) flume init [--root PATH] [--force], run in the workspace folder: creates .flume/ with .gitignore (*) and config.toml (root from --root; none means same-repo mode). .flume/ holds nothing workflow-related. (2) init copies flume's shipped base workflow (one placeholder file workflow.md) to ROOT/workflow/base/ in the task repo and commits it there (one commit, never pushes). (3) init when .flume/ exists fails and says to use --force; --force rewrites only ROOT/workflow/base/ and commits; --force with --root also updates root in config.toml, without --root keeps it. (4) flume serve with no .flume/ in the current folder fails: run flume init first; serve drops --root and reads root from config.toml. (5) Task files stay at ROOT/flume/tasks/. (6) Prime stays built in; when ROOT/workflow/ exists it adds one short line: read ROOT/workflow/base/*.md, then ROOT/workflow/*.md, then the project's workflow/*.md and its CLAUDE.md, each in name order; later layers override earlier (project over workspace over base). Flume merges nothing and never writes workspace or project rules. (7) Specs cli.md (init, serve) and agent.md (prime line), tests, README setup: flume init --root ... once, then flume serve.
