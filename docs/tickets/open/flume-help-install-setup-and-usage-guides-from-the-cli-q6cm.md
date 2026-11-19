---
id: fl-q6cm
title: "flume help: install, setup and usage guides from the CLI"
kind: feature
created: 2026-11-19
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-jbxt]
---

## The ask

Flume's install, setup and usage docs are fully available from the CLI. `flume --help` lists a
`help` command; `flume help` prints the list of guides, and `flume help <topic>` prints one guide
in full, so a human or agent never needs the README or the repo to learn flume.

## Design

### Commands

- `flume --help` lists `help` among the commands: "detailed guides on using flume: install,
  setup, usage".
- `flume help` prints the topics, one line each with a one-line summary, and how to print one.
- `flume help install`: clone the public repo, check out a release tag (optional), `npm ci
  --omit=dev` (at work outside the sandbox, through the Artifactory mirror), put flume on PATH,
  check with `flume --version`; how to update.
- `flume help setup`: adopting flume, for a new project and for an existing one; the workspace
  (one git repo, or a folder of repos with a tasks repo: `flume init --root`, `flume clone`,
  `flume project`); running the daemon (`flume serve`, `status`, `stop`; only the human runs
  serve).
- `flume help usage`: what to run where and when: each command, who runs it (human or agent),
  from which folder, and the order of a task's life (new, claim, phases, close).
- An unknown topic prints the topic list to standard error and exits 1.
- Output is plain text (Markdown is fine) to standard output, exit 0. No `--json`: it is text, not
  data (rule cli-json-output, like `--help`).

### Source of the text

- Each guide is a Markdown file in the repo that `flume help` prints as is, so the text is
  written once. The README's Install and Use sections shrink to the first steps and point to
  `flume help`.
- The guide files ship with a `git pull`; no build step (rule built-for-the-work-sandbox).

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

### Advisor's choices (for the human to confirm)

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
- Show the drafts first: per the human's preference, a worker drafts the three guides into this
  ticket (or a branch) for the human's review before the command is built around them.

Related: every command takes --help (fl-jbxt).
