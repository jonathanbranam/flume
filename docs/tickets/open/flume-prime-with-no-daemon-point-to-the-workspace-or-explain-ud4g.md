---
id: fl-ud4g
title: "flume prime with no daemon: point to the workspace, or explain flume and how to set it up"
kind: feature
created: 2026-11-18
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-87h9, fl-pshd, fl-fu3v]
---

## The ask

When the daemon is not running, `flume prime` can't print the workflow, so today's output does little for the agent. Instead it should point the agent at the fix: where flume is set up and that the human should run `flume serve` there; or, when flume is not set up at all, explain what flume is and how to set it up.

For whoever edits this ticket (the human, 2026-11-17): "the design at the top is the currently agreed-upon design; keep it current and DO NOT include narration or restatements in the design. The discussion section can include the discussion narrative with restatements as a reference."

## Design

When `flume prime` finds no running daemon:

### A workspace is found

- Flume looks for the workspace folder (the nearest folder holding `.flume/`, from the current folder upward), as other commands do. Only what the agent's process can read counts (under a sandbox, a folder it cannot see is not found).
- Found: prime prints its built-in text, then a part saying flume looks set up in `<workspace>` but its server is not running, and to ask the human to run `flume serve` in `<workspace>`.

### No workspace is found

Prime prints, instead of the workflow:

- What flume is: a tool for managing agents' work with tasks and workflows. Tasks live in a tasks repo; agents work them through flume commands, phase by phase (fl-fu3v); `flume serve` is the server agents and the UI talk to, started by the human.
- How to set up a new workspace, for the agent to tell the human:
  1. `flume init` in the workspace folder (a folder of related repos).
  2. `flume project add <git-url>` for each project, or `flume clone <tasks-repo-url>` to set up a whole workspace from an existing tasks repo (fl-pshd).
  3. `flume serve`, run by the human, in its own pane.
- That the agent must not run these itself without the human (rule built-for-the-work-sandbox: never start the daemon).

### Both cases

- Text on stdout inside prime's XML (fl-87h9), each case its own element; exit code as today.
- `flume agent` (which needs the daemon to launch) is unchanged.

### Assumed (advisor; change if wrong)

- Exit code unchanged (prime still prints usable text; the agent reads it).
- The explanation is built into flume, a few short paragraphs; the builder writes it.

## Discussion (for reference, not authoritative)

### 2026-11-17, the human (verbatim)

> Prime when daemon is not running can't do anything effective.
>
> It should look for a flume root and if that exists and if the agent finds it in the sandbox, then output that it looks like flume is set up in folder ABC and you should run flume serve from there.
>
> If no flume hidden folder found then
> It should print an explanation of what flume is and how it works. Explain that it is for managing agent work with tasks and workflows. Explain how to set up a new project with flume init, project add (or clone) and flume serve.
