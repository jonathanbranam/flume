---
id: fl-q6cm
title: "flume help: install, setup and usage guides from the CLI"
kind: feature
created: 2026-11-19
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: [fl-xg67]
related: [fl-jbxt]
resolved: 2026-11-19T19:25:36Z
---

## The ask

Flume's install, setup and usage docs are fully available from the CLI. `flume --help` lists a
`help` command; `flume help` prints the list of guides, and `flume help <topic>` prints one guide
in full, so a human or agent never needs the README or the repo to learn flume.

## Design

### Top-level help: what flume is

`flume --help` is where an agent starts, so it carries the explanation. Before the command list
it says, in a few short lines, what flume is and how it works: tasks as files in a git repo, the
phases a task moves through, the daemon the human runs, agents launched with `flume agent`, and
`flume help setup` as the place to start. Acceptance check: an agent with no knowledge of flume,
given only `flume --help` (and what it points to), answers "i want to use flume, explain how it
works." correctly.

### Commands

- `flume --help` lists `help` among the commands: "detailed help on using flume: install, setup,
  usage; flume help <command> is flume <command> --help".
- `flume help` prints the topics, one line each with a one-line summary, and how to print one.
- `flume help install`: clone the public repo, check out a release tag (optional), `npm ci
  --omit=dev` (at work outside the sandbox, through the Artifactory mirror), put flume on PATH,
  check with `flume --version`; how to update.
- `flume help setup`: adopting flume, for a new project and for an existing one; the workspace
  (one git repo, or a folder of repos with a tasks repo: `flume init --root`, `flume clone`,
  `flume project`); running the daemon (`flume serve`, `status`, `stop`; only the human runs
  serve). One name, no aliases.
- `flume help usage`: what to run where and when: each command, who runs it (human or agent),
  from which folder, and the order of a task's life (new, claim, phases, close).
- `flume help <command> [<subcommand>]` prints exactly what `flume <command> [<subcommand>]
  --help` prints, with the same exit code.
- A topic name is never a command name, so the two never overlap. The spec test checks every
  topic against the command list.
- An unknown topic or command prints the topic list to standard error and exits 1.
- Output is plain text (Markdown is fine) to standard output, exit 0. No `--json`: it is text, not
  data (rule cli-json-output, like `--help`).
- `flume guide` is unchanged and separate: it prints the workflow guides agents push to phases.

### Source of the text

- Each guide is a Markdown file in the repo that `flume help` prints as is, so the text is
  written once. The README's Install and Use sections shrink to the first steps and point to
  `flume help`.
- The guide files ship with a `git pull`; no build step (rule built-for-the-work-sandbox).

### Review

The worker writes the guides and the top-level text directly and ships them with the command; the
human reviews what ships. No draft review first.

### Specs

A cli.md requirement for `flume help` (the topic list, each topic prints, unknown topic exits 1),
and that `flume --help` lists `help`. The scenarios check the topics exist and print, not their
wording.

## Discussion (for reference, not authoritative)

### The human's words, 2026-11-19 (to advisor, verbatim)

"I'd like the flume install and setup and usage docs to be fully available from the CLI; e.g.
'flume --help' should list :

flume help           detailed guides on using flume; install and usage, etc

flume help install   explains in detail clearly how to clone, install flume
flume help setup (or init or adopt)? explains how to adopt flume for a new project or existing
project, explains multi-folder repo workspace setup, etc.
flume help usage     details on how to actually use each of the flume commands and what to run
where and when"

### The human's answers, 2026-11-19 (verbatim)

"just 'setup' is fine; agents start with '<command> --help' so the main thing is getting the
description right there; I want an agent with NO knowledge of flume to respond intelligently to
this question: "i want to use flume, explain how it works.""

"'flume guide' seems fine; I see the point of the question, but yeah, a "guide" is something
internal to flume;"

"i prefer just --help, but since we're adding 'flume help <blank>', let's make is symmetric and an
alias for exactly flume <command> --help, sure; so then our help docs cannot overlap with commands
I suppose?"

### Advisor's choices (as first proposed; the answers above settle the first three)

- Topic name `setup`, not `init` or `adopt`, and no aliases: setup covers init, clone, project and
  the daemon, wider than `init`; one name keeps it simple. Alternative: accept `init` and `adopt`
  as aliases of `setup`.
- Where the files live: undecided; a folder such as `docs/help/` (install.md, setup.md, usage.md).
- Name clash to watch: `flume guide` already exists and prints the workflow guides agents push to
  phases. `flume help` topics are for people learning flume, a different thing; "guide" is avoided
  in the help command's wording where it could confuse. Alternative: fold the topics into `flume
  guide`; advisor recommends against (different audience and purpose).
- `flume help <command>` as a synonym for `flume <command> --help` (as git does): not included
  (YAGNI); easy to add.
- Show the drafts first: superseded. The human, 2026-11-19: "I'm busy today, so, just have the
  worker directly write the guides and I'll review what gets shipped."


Related: every command takes --help (fl-jbxt).
