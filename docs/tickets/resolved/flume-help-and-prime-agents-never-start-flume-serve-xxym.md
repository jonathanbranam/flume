---
id: fl-xxym
title: "flume help and prime: agents never start flume serve"
kind: fix
created: 2026-11-17
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: []
resolved: 2026-11-17T23:46:11Z
---

## The ask

Say in flume's help and in the prime that agents never start `flume serve`.

The human, 2026-11-17: "agents can never start Flume serve, so be sure that's mentioned in the help. Probably the help and the prime". (Rule built-for-the-work-sandbox already says only the human runs flume serve; a daemon started by Claude is refused or sandboxed.)

## Change

1. **Top-level help** (`flume --help`), the serve line: `serve      run the daemon in the foreground [--port N] (the human runs this; agents never do)`.
2. **`flume serve --help`** (and its usage error text): add the line `Only the human runs flume serve, in its own pane. Agents never start it.`
3. **Built-in base prime**, new line after the flume --help line: `Never start flume serve yourself; only the human does. If flume says the server is not running, ask the human to start it.`
4. Specs (cli.md, agent.md prime contents) and tests in the same change.
