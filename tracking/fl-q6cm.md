+++
id = "fl-q6cm"
title = "flume help: install, setup and usage guides from the CLI"
kind = "feature"
state = "built"
created_at = "2026-11-19T18:47:12.845Z"
updated_at = "2026-11-19T19:24:35.998997873Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:helpguides",
]
branch = "bridle/helpguides"
commit = "321c4f4"
summary = "Added flume help: src/cli/help.ts (topics, guide reader, help command), main.ts answers `flume help` before parsing (no args: topic list; topic: docs/help/<topic>.md as is; command path: same as --help; unknown: topic list on stderr, exit 1). Guides written from the code and specs: docs/help/install.md, setup.md, usage.md. Top-level --help now describes flume and points at flume help setup. README Install/Use shrunk to first steps. cli.md requirement r-99ef with scenarios s-b8ca, s-71b0, s-56a4, s-3e8e, s-6710, each bound to a test in test/cli.test.ts. Note: outcome.argv is now set after the help rewrite (agent reads it). Assumption: `flume help help` is treated as unknown (help itself has no --help guide beyond the usage line)."
ticket = "q6cm"
+++

docs/tickets/open/flume-help-install-setup-and-usage-guides-from-the-cli-q6cm.md

## Thread

### note · external:advisor · 2026-11-19T19:00:01.961Z
readied by external:advisor

### note · external:advisor · 2026-11-19T19:00:01.981Z
Readied by human via advisor ("yes, ready q6cm it should come only AFTER the commander adoption lands"). blocked_by fl-xg67: start only after fl-xg67 has landed on main. First step: a worker drafts the three guides and the new top-level help text for the human's review before building the command.

### note · external:advisor · 2026-11-19T19:04:34.262Z
Change, human via advisor: no draft review first. The human: "I'm busy today, so, just have the worker directly write the guides and I'll review what gets shipped." Design updated (### Review). Still starts only after fl-xg67 lands.

### note · external:orchestrator · 2026-11-19T19:11:06.069Z
From orchestrator: fl-q6cm planned, queued tier 2, blocked by fl-xg67 (queue shows it). Start only after xg67 is on main. Sonnet. No draft step: the worker writes the three guides and top-level help directly; the human reviews what ships (thread, 19:04Z).

### note · agent:helpguides · 2026-11-19T19:24:35.986Z
built: 321c4f4 (branch bridle/helpguides)

### note · agent:helpguides · 2026-11-19T19:24:35.998Z
done: flume help (topics install/setup/usage in docs/help/, command help passthrough, unknown exits 1, top-level --help explains flume), specs r-99ef + 5 scenarios bound to tests; 321c4f4; just check exit 0, 254 tests passed; main already merged
