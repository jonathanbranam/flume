---
id: fl-danq
title: "Tasks first: task files, IDs, daemon and CLI"
kind: epic
created: 2026-11-17
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-28pa, fl-47b8, fl-jc84]
resolved: 2026-11-17T05:09:12Z
---

## The ask

The first cut of Flume: the task system, in TypeScript on Node (fl-28pa), checked against the
language-agnostic specs (fl-47b8). Guides, sensors, workflow steps, the agent launcher, the
heartbeat, tmux liveness and the React UI come later as their own epics.

The human, 2026-11-16 (brief, `docs/brief/project-note.md`): "The main thing is the ticketing
system." And on the churn this must fix: "Main is moving not because of any code changes, but
because of a whole bunch of documentation changes." On building it now: "let's see how much can
get built while I sleep".

Done means: an agent in any worktree can create, show, list, update, note, close and reopen tasks
through the `flume` CLI; a localhost daemon is the only writer of task files and commits them on
the main checkout; `flume check` validates the files; `flume roadmap` shows and checks the roadmap.

Design, from the brief and Tickets lite (`docs/brief/tickets-lite.md`), with the later decisions
that override Tickets lite:

- Folders: `flume/tasks/open/` and `flume/tasks/resolved/` at the repo root (not `docs/tickets/`);
  `flume/roadmap.md`. The word is "task", not "ticket".
- File names `<slug>-<id>.md`; slug capped at 50 characters (the human: "either 40 or 50. 60 gets
  pretty darn long"; 50 chosen as the default, easy to change).
- IDs: 4 characters from `abcdefghjkmnpqrstuvwxyz23456789`, random, never reused, `xxxx`
  reserved; the daemon mints them. Bare IDs accepted anywhere.
- Front matter: id, title, kind, created, parent, blocked_by, related, resolved. Kinds: feature,
  bug, chore, docs, research, epic.
- Dependencies (`blocked_by`, hard) and ordering (a suggestion) are separate; ordering can come
  later in the epic, dependencies now.
- Links to tasks are wiki links by full file stem.
- CLI commands (from the brief's draft): `flume task new|show|list|update|note|close|reopen`,
  `flume roadmap [show|check]`, `flume check`, `flume serve|status|stop`. The CLI finds the daemon
  by a port file or env var and touches no files itself.
- Multi-project (`-p <project>`) is in the design but can wait for a later child task; keep task
  IDs and the roadmap universal so it slots in.

Split into child tasks as the work goes; the specs (fl-47b8) come first or alongside.
