---
id: fl-47b8
title: Language-agnostic specs for Flume
kind: docs
created: 2026-11-17
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-28pa]
---

## The ask

Write Flume's behaviour as language-agnostic specs: what the task files, the CLI and the localhost
API must do, independent of the implementation language, so any implementation (TypeScript now,
perhaps Go later) can be checked against them.

The human, 2026-11-16 (advisor session), on choosing TypeScript over Go: "sure, we should be
writing language-agnostic specs for this anyway!!"

Scope to start: the task file format (front matter, IDs, slugs, folders), the CLI commands and
their output, and the daemon's HTTP API. Sources: `docs/brief/project-note.md`,
`docs/brief/tickets-lite.md`.

Open question for the human: the spec style. The brief says "I struggle between EARS, which is
pretty nice, and Givens (Given/When/Then), which I also really like. I want to be flexible on
those." Pick one for Flume's own specs, or allow both?
