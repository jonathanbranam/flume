---
id: fl-ha4p
title: "flume task comment: rename task note, with a Comments section and author/time headers"
kind: feature
created: 2026-11-17
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: []
---

## The ask

Rename `flume task note` to `flume task comment`, and give comments a small structure in the body.

The human, 2026-11-17: "rename 'task note' to 'task comment'". Asked whether task bodies are structured (they are not: free Markdown, task-files r-0aca), the human chose the structured option: "option (2) and record the agent name".

## Design (agreed)

1. **One word everywhere:** CLI `flume task comment ID [--text TEXT | --body-file PATH]`, API `POST /api/tasks/{id}/comments`, the UI's comment form, the commit message ("add a comment"), and the specs (cli.md r-52c7, api.md, ui.md). No `note` alias (flume is days old; one user).
2. **Comments section:** the first comment appends a `## Comments` heading at the end of the body (after one blank line). Every comment goes under it, newest last. The rest of the body stays free text; flume never rewrites it.
3. **Comment header:** each comment starts with a heading line `### <time>, <author>`, then a blank line, then the text.
   - **author** is the agent name from `$AGENT_NAME` (set by `flume agent`).
   - **time** is local time with its UTC offset, minutes precision, e.g. `2026-11-17 14:05 -05:00`.
4. **Specs and tests** change in the same commit (rule specs-for-every-surface); task-files.md gets a requirement for the Comments section and header format.

## Assumptions (assume-and-record)

- **No agent name** (the human at a bare shell, or the UI): author is the OS user name of the process (the CLI's, or the daemon's for the UI). Alternative: a fixed `human`. Change if the human wants a different label.
- **The API takes an optional `author`** field; the CLI sends `$AGENT_NAME` when set. The daemon fills in the OS user when it is missing.
- **Time with offset**, not UTC alone: readable to the human (ET) and still exact.
- **Existing notes** in task files are left as they are (plain text at the end of the body); no migration.
- **An existing `## Comments` heading** written by hand counts as the section; flume appends under the last one.
