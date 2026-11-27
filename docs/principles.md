# Flume principles

These govern every change to flume: its process, its architecture and its decisions. What flume is:
[flume.md](flume.md). A ticket that would change or bend a principle says so at the top, and is not built
without the human's explicit confirmation, quoted on the ticket.

Each principle has a provenance, how it was decided and the history behind it, kept separately for
reference in [principles-provenance.md](principles-provenance.md). You do not need it to follow the principles.

## P1 Small and simple

Flume does the few things its work needs and no more. Each part is the smallest thing that does
the job, and a feature that might be needed later is left out until it is. When in doubt, KISS and
YAGNI.

## P2 The human is in control

The human can override the system: any rule, step or gate that flume or a workflow sets gives way
when the human says so. Some decisions are the human's alone, and agents are not allowed to make
them.

## P3 Workflows are dynamic

The workflow is not hard-coded in flume: it is fully configurable or overridable. Each workspace,
project and task can specify its own workflow. Flume provides the mechanics (tasks,
parts, comments, assignment, history, plans) and enforces a workflow rule only when the workflow's
own configuration asks for it.

## P4 Works in an enterprise sandbox

Flume is designed to work within the constraints of a Claude Code sandbox, such as one an
enterprise might put in place, and most capabilities should work inside it. A capability that cannot run in the sandbox must not break flume as a whole: the
rest of flume still works, and where it is possible that capability gets a fallback, or a separate
option with a different implementation that does work there.

## P5 Flume is self-describing

An agent can discover from the flume CLI itself how flume works, how to use it, and how the
current repository and workspace are set up, with no other knowledge of flume.

## P6 Plain files are the record

Tasks and their history are plain Markdown and YAML files in a git repo, readable without flume
(in Obsidian, on GitHub). The daemon, CLI and UI read and write those files; they should hold no
independent record of their own.

## P7 Specified from the outside

Every surface (CLI, API, UI, file formats) has an implementation-agnostic spec, and every
executable scenario has a test. A second implementation in another language could be checked
against the same specs.

## P8 Principles and intent change only on the human's word

A ticket that would change a principle or an intent says so loudly at the top. It is not readied
or built until the human confirms the change explicitly, quoted on the ticket.
