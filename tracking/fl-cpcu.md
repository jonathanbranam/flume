+++
id = "fl-cpcu"
title = "flume output: --json on every command that prints data; agent show prints YAML"
kind = "chore"
state = "integrated"
created_at = "2026-11-18T02:31:54.718Z"
updated_at = "2026-11-18T02:41:25.703113583Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:json-out",
]
branch = "bridle/json-out"
commit = "cfeb364377389a00cf7e559028a28770cf82240c"
summary = "Added --json to flume status, flume check, flume roadmap check, flume agent list and flume agent show (src/cli/daemon.ts, check.ts, roadmap.ts, agent.ts, main.ts). status --json: object with running, address, root (null when stopped). check and roadmap check --json: array of {path, message}, [] when clean, exit codes unchanged. agent list --json: array of entries plus live (yes, pane, -). agent show prints YAML by default, JSON object with --json. Other args to these commands are a usage error (exit 2). Specs: cli.md (status and check --json), agent.md (list, show), roadmap.md (check); tests name the scenario IDs. Rule recorded in docs/conventions.md, README status line, CHANGELOG Changed. Decision: list --json includes the live field, since the human table shows it. Caveat: no last-full-test-count baseline file exists in the workspace, so the test-count band was not compared."
ticket = "cpcu"
+++

docs/tickets/open/flume-output-json-on-every-command-that-prints-data-agent-sh-cpcu.md

## Thread

### note · external:advisor · 2026-11-18T02:31:56.141Z
readied by external:advisor

### note · external:advisor · 2026-11-18T02:31:56.161Z
advisor: readied (the human's ask is clear and self-evident; rule ready-without-asking). The human can stop it.

### note · external:orchestrator · 2026-11-18T02:37:50.654Z
From orchestrator: fl-cpcu planned and queued. Haiku (mechanical --json on 5 commands + specs/tests). New rule cli-json-output (0919784) applies. fl-t8xv follows in a later tier (same files: agent.ts, specs/agent.md), on Sonnet.

### note · agent:json-out · 2026-11-18T02:40:41.264Z
built: 8123aaf (branch bridle/json-out)

### note · agent:json-out · 2026-11-18T02:40:54.737Z
done: --json on flume status, check, roadmap check, agent list and agent show; agent show prints YAML by default. just check exit 0 on 8123aaf (156 tests passed, 0 failed); bridle spec check --require-ids clean (0 errors). Branch bridle/json-out pushed and marked built; main is already an ancestor (no merge needed). Browser check N/A (CLI only). Caveat: no last-full-test-count file in the workspace, so the test-count band was not compared. Decisions: list --json includes live; other args to these commands are exit 2; status --json not-running is {running:false,address:null,root:null} with exit 1; help and usage text updated; CHANGELOG Changed line added; rule recorded in docs/conventions.md; README status line updated. Pre-existing biome warnings in test/tasks.test.ts and test/daemon.test.ts left alone.

### note · agent:manager · 2026-11-18T02:41:24.036Z
integrated: cfeb364377389a00cf7e559028a28770cf82240c (branch bridle/json-out)

### note · agent:manager · 2026-11-18T02:41:25.703Z
cleanup: removed agent json-out, origin branch bridle/json-out, branch bridle/json-out
