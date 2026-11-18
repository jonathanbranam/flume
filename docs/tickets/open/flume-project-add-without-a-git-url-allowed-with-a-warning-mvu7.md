---
id: fl-mvu7
title: "flume project add without a git URL: allowed, with a warning"
kind: feature
created: 2026-11-18
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-pshd]
---

## The ask

`flume project add` should work with or without a git URL, and warn when there is none.

For whoever edits this ticket (the human, 2026-11-17): "the design at the top is the currently agreed-upon design; keep it current and DO NOT include narration or restatements in the design. The discussion section can include the discussion narrative with restatements as a reference."

## Design

- `flume project add <git-url | name> [--name NAME] [--branch BRANCH]`. An argument that is a git URL (has `://`, or the `user@host:path` form) is the URL, as today. Anything else is the project's name, with no URL.
- With no URL: flume adds the project to `flume.yaml` with no `url` and commits it, clones nothing, and prints a warning on stderr: the project has no URL, so `flume clone` and `flume init --clone` cannot set it up on another machine; add one later by editing `flume.yaml` (or re-running with the URL). Exit 0.
- `flume project list` shows an empty URL for it (as `--json`: `url` empty or absent); `flume init` reports it present or missing as today but never tries to clone it.
- `--branch` with no URL: refused (exit 2), nothing to check out.

### Assumed (advisor; change if wrong)

- URL detection by form, not by checking the network.
- Not reading the URL from an existing folder's git origin (could come later: no warning needed when origin is known).

## Discussion (for reference, not authoritative)

### 2026-11-17, the human (verbatim)

> Btw project add should work with or without GitHub url but it should warn about missing url.
