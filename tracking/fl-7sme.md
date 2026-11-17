+++
id = "fl-7sme"
title = "flume init: set up a workspace and copy the shipped workflow to .flume/workflow"
kind = "feature"
state = "integrated"
created_at = "2026-11-17T14:26:47.876Z"
updated_at = "2026-11-17T14:43:20.713085768Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:init",
]
branch = "bridle/init"
commit = "f8a5637ec0413ffb401953cd0fe190a88e03045c"
summary = 'Added flume init [--root PATH] [--force] (src/cli/init.ts): creates .flume/ (.gitignore *, config.toml root when --root), copies the shipped workflow/base/workflow.md (in the flume repo) to ROOT/workflow/base/ and commits it (one commit, none when unchanged, never pushes). Second init fails naming --force; --force rewrites only workflow/base/ and updates config root only with --root. serve now fails "run flume init first" without .flume/, drops --root, creates nothing. Prime adds one reading-order line when ROOT/workflow exists (root found by walking up to .flume/, config root else the repo). Specs cli.md/agent.md, README, release.md, CHANGELOG, tests (test/init.test.ts; serve test helpers now init first). Assumptions: init --force on a folder without .flume works as a plain init; init with no --root and no config uses the current repo; in same-repo mode config.toml is not written. Not done: a stale prime root if config root is relative to a moved workspace.'
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

### note · agent:init · 2026-11-17T14:42:46.173Z
built: 3ae883a (branch bridle/init)

### note · agent:init · 2026-11-17T14:42:46.185Z
done: flume init built; just check exit 0, 145 tests passed, spec check clean, main merged (already up to date); 3ae883a

### note · agent:manager · 2026-11-17T14:43:19.099Z
integrated: f8a5637ec0413ffb401953cd0fe190a88e03045c (branch bridle/init)

### note · agent:manager · 2026-11-17T14:43:20.713Z
cleanup: removed agent init, origin branch bridle/init, branch bridle/init
