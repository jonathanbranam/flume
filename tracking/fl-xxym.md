+++
id = "fl-xxym"
title = "flume help and prime: agents never start flume serve"
kind = "fix"
state = "integrated"
created_at = "2026-11-17T23:38:05.346Z"
updated_at = "2026-11-17T23:46:09.138781515Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:no-serve",
]
branch = "bridle/no-serve"
commit = "8c25496ecf7a837a7fcec56a3ced379fbb1275e2"
summary = """Added the human-only wording. flume --help's serve line now reads "(the human runs this; agents never do)". flume serve --help is new: it prints the serve usage and "Only the human runs flume serve, in its own pane. Agents never start it." and exits 0. The serve usage error (src/cli/daemon.ts) prints that same line after its usage message, on stderr with exit 2. The built-in base prime (DEFAULT_BASE in src/cli/agent.ts) gains "Never start flume serve yourself; only the human does. If flume says the server is not running, ask the human to start it." after the flume --help line. Specs: design/specs/cli.md (new requirement "Help says agents never start serve" with three scenarios, s-7eb6, s-0396, s-f885) and design/specs/agent.md (s-a6c1 AND line). Tests: test/cli.test.ts and test/agent.test.ts name those IDs. Decision: serve --help only accepts the long form, as the ticket asked, not -h. Check on 33c5136: just check exit 0, 148 tests passed in 7 files. No last-full-test-count file exists in the workspace, so the test-count band was not compared."""
ticket = "xxym"
+++

docs/tickets/open/flume-help-and-prime-agents-never-start-flume-serve-xxym.md

## Thread

### note · external:advisor · 2026-11-17T23:38:10.452Z
readied by external:advisor

### note · external:advisor · 2026-11-17T23:38:10.471Z
human via advisor: a fix, readied.

### note · external:orchestrator · 2026-11-17T23:44:15.408Z
From orchestrator: fl-xxym planned and queued, Haiku.

### note · agent:no-serve · 2026-11-17T23:45:38.064Z
built: 33c5136 (branch bridle/no-serve)

### note · agent:no-serve · 2026-11-17T23:45:38.076Z
done: help and prime say agents never start flume serve (serve line in flume --help, new flume serve --help, serve usage error, DEFAULT_BASE prime line); specs cli.md (s-7eb6, s-0396, s-f885) and agent.md (s-a6c1); tests named; just check exit 0, 148 tests passed in 7 files; spec check --require-ids clean; merged main (already up to date); CHANGELOG line under Changed; summary written; 33c5136

### note · agent:manager · 2026-11-17T23:46:07.345Z
integrated: 8c25496ecf7a837a7fcec56a3ced379fbb1275e2 (branch bridle/no-serve)

### note · agent:manager · 2026-11-17T23:46:09.138Z
cleanup: removed agent no-serve, origin branch bridle/no-serve, branch bridle/no-serve
