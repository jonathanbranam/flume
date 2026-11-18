---
id: fl-eg2q
title: "flume task history: a structural audit trail in each task folder"
kind: feature
created: 2026-11-18
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: [fl-3pfa]
related: [fl-fu3v]
---

## The ask

Every task keeps a structural audit trail of the changes that went through flume, in its own folder: status and phase changes, assignments, body and phase-file updates, each with the time and who did it. Git already holds the text history: don't recreate it. On hold until the human says build.

For whoever edits this ticket (the human, 2026-11-17): "the design at the top is the currently agreed-upon design; keep it current and DO NOT include narration or restatements in the design. The discussion section can include the discussion narrative with restatements as a reference."

## Design

- Each task folder holds `history.jsonl`: one JSON object per line, appended, never rewritten. Flume writes it; nobody edits it by hand.
- Every flume command that changes a task appends one line: create, field updates, assign, phase, comment, plan items done or skipped (with the reason), close, reopen, and part writes (`flume task write`, fl-fu3v: every change to the tasks repo goes through flume).
- Each line: `time` (UTC, ISO 8601 with Z), `by` (`$AGENT_NAME`, or `human` when unset), `action`, and the action's data: `field`, `from`, `to` for field changes; `part` for a part write (the name only, not the text).
- `flume task history ID` prints it, one line per entry, oldest first; `--json` prints a JSON array (rule cli-json-output).
- Moves with the task folder (open/resolved).
- JSON Lines, not one JSON array: appending never rewrites earlier lines, and two branches that each append merge in git as added lines.

### Assumed (advisor; change if wrong)

- Part writes record only the part's name, not its content or a diff: git has the text.

## Discussion (for reference, not authoritative)

### 2026-11-17, the human (verbatim)

> keep an audit trail also inside the task folder that is structural. probably JSON. Record changes to the ticket and history. Textual history is stored in github, don't recreate github, but store the updated that went through flume. status changes, phases, body updates with the timestamp and agent responsible.

> JSON lines is good
