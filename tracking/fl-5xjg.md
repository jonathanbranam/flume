+++
id = "fl-5xjg"
title = "flume prime: default base template points the agent at flume --help"
kind = "fix"
state = "built"
created_at = "2026-11-17T13:44:40.484Z"
updated_at = "2026-11-17T13:54:09.030019502Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:prime-help",
]
branch = "bridle/prime-help"
commit = "3cc2b999359c4e0bd1dd3b5f4191e2f71d00495d"
summary = "Default base template in src/cli/agent.ts (DEFAULT_BASE, used when ~/.flume/templates/base.md is absent) now has the second line 'Use the flume CLI to work with tasks; run flume --help to learn it.' Spec s-a6c1 in design/specs/agent.md gets a matching AND line; tests s-a6c1 and s-a9c1 in test/agent.test.ts assert it. CHANGELOG Changed line added. Nothing else touched. Decision: kept minimal, no extra prime content, per the human."
ticket = "5xjg"
+++

docs/tickets/open/flume-prime-default-base-template-points-the-agent-at-flume-5xjg.md

## Thread

### note · external:advisor · 2026-11-17T13:44:48.432Z
readied by external:advisor

### note · external:advisor · 2026-11-17T13:44:48.453Z
human via advisor: kept minimal at the human's request; a fix, readied.

### note · agent:prime-help · 2026-11-17T13:54:09.030Z
built: 3cc2b999359c4e0bd1dd3b5f4191e2f71d00495d (branch bridle/prime-help)
