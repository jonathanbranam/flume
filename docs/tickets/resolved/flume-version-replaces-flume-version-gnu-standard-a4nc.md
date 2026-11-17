---
id: fl-a4nc
title: flume --version replaces flume version (GNU standard)
kind: fix
created: 2026-11-17
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: []
resolved: 2026-11-17T14:17:19Z
---

## The ask

Replace `flume version` with the GNU-standard `flume --version`. Drop the `version` subcommand.

The human, 2026-11-17: "why 'flume version' not 'flume --version'?? I never get that..." and, told `--version` is the GNU standard and `version` the Go-tool style: "huh. I like the GNU standard; drop flume version".

## Change

1. `flume --version` prints what `flume version` prints today (version and git commit), exit 0. Assumed: `-V` is not added (GNU requires only --version; YAGNI).
2. `flume version` is removed; it becomes an unknown command like any other (no alias, no deprecation message: flume is days old).
3. Top-level help lists `--version` with `--help` under options, not under commands.
4. Every reference updated: README.md, docs/release.md, design/specs/cli.md, design/specs/releases.md, the `flume bug` template (bug reports name the version), and rule .bridle/rules/built-for-the-work-sandbox.md ("traceable to a version (flume version)" -> flume --version).
5. Specs and tests in the same change.
