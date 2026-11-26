---
id: fl-xp8s
title: "Flume principles: a few high-level principles every ticket is checked against"
kind: docs
created: 2026-11-26
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-94yx, fl-4k35]
---

## The ask

Write down flume's guiding principles: a few very high-level statements that govern the process,
the architecture and decisions. Every ticket is checked against them, and none is changed unless
the human explicitly asks and confirms. Separate from intent (per area, more detailed, its own
change control), which comes after the principles. This ticket holds the draft for the human's
review; nothing is in force until the human confirms each principle.

## Design

### Two kinds of document, separate files

- **Principles** (docs/principles.md): very high-level, few, govern process, architecture and
  decision-making across all of flume. Change only on the human's explicit confirmation.
- **Intent** (one file per area, e.g. docs/intent/agents.md, tasks.md, workflow.md, setup.md):
  more detailed than principles, still above the specs, with its own change control. Areas named
  so far by the human: managing agent sessions, the ticket (task) system, the workflow system,
  project setup. Drafted after the principles.
- **Specs** (design/specs/) stay as they are: observable behaviour, changed by tickets.

### Draft: docs/principles.md

Each principle: an ID, one sentence, what it means in practice, and the human's words as its
source. The words are verbatim unless marked.

---

# Flume principles

These govern every change to flume: its process, its architecture and its decisions. A ticket
that would change or bend one says so at the top, and is not built without the human's explicit
confirmation, quoted on the ticket.

## P1 Light

Flume is a light, scaled-down tool, lighter than bridle. Build the smallest thing that does the
job; when in doubt, KISS and YAGNI.

Source: the brief, 2026-11-16: "A very light, scaled-down version of something like bridle".
"I'm trying to get out all the ideas that go into bridle quickly and reformat them into a
lighter-weight, simpler thing." 2026-11-16: "KISS in times of doubt, and YAGNI - don't build too
much."

## P2 The human is in control

Flume and its agents propose; the human decides. Flume never blocks the human, and agents do what
the human asks, even when it skips or reverses a step.

Source: 2026-11-17 (fl-fu3v): "Overall guidance: the human is in control. They can ask you to move
between phases and go backwards or forwards."

## P3 Flume does not own the workflow

Flume provides the mechanics (tasks, parts, comments, assignment, history, layered text, plans);
the workflow is text or configuration the user can replace whole. Flume enforces a workflow
rule only when the workflow's own configuration asks for it.

Source: 2026-11-25 (fl-94yx): "The workflow should not be assumed by flume." "flume ships several
workflows, but the user can fully override any part of the workflow system and replace it with
their own. That means that flume cannot make strong assumptions about the workflow itself."

## P4 Built for the work sandbox

Flume runs under a Claude Code sandbox on the human's work computers: no Claude Code hooks, never
starts its own daemon, packages through a mirror, updates by git pull from the public repo only,
every bug traceable to a version.

Source: 2026-11-16 (fl-jc84): "I can directly reach public github and clone, but I'm not allowed
to push at all". 2026-11-17 (fl-qgr7): "don't start a daemon ever". (Full rule:
built-for-the-work-sandbox.)

## P5 Flume teaches itself

An agent learns flume from flume: --help, flume help and flume prime explain it well enough that
an agent with no knowledge of flume can use it and explain it.

Source: 2026-11-19 (fl-q6cm): "agents start with '<command> --help' so the main thing is getting
the description right there; I want an agent with NO knowledge of flume to respond intelligently
to this question: "i want to use flume, explain how it works.""

## P6 Plain files are the record

Tasks and their history are plain Markdown and YAML files in a git repo, readable without flume
(in Obsidian, on GitHub). The daemon, CLI and UI read and write those files; they hold no record
of their own.

Source: tickets lite (the brief): "Everything is plain files you can browse in Obsidian or on
GitHub, and a small local daemon does the mechanical writes". (Advisor's wording of the principle;
not yet the human's words.)

## P7 Specified from the outside

Every surface (CLI, API, UI, file formats) has an implementation-agnostic spec, and every
executable scenario has a test. A second implementation in another language could be checked
against the same specs.

Source: 2026-11-16 (fl-47b8): "I DO want clear specs written for every CLI command and the API and
UI - use bridle specs and write tests for them". "The specs should be clear and as language and
implementation-agnostic as possible."

## P8 Principles and intent change only on the human's word

A ticket that would change a principle or an intent says so loudly at the top. It is not readied
or built until the human confirms the change explicitly, quoted on the ticket.

Source: 2026-11-26: "Those high-level brief, high-level intent specifications or guiding
principles will not be violated unless explicitly requested, confirmed by me."

---

### Assumed (advisor; change if wrong)

- P6 is the advisor's reading of the brief; the human has not said it as a principle.
- P8 is the governance rule itself, kept as a principle so it lives with the others.
- How tickets are checked against principles (an Intent section in the ticket layout, who
  checks, what blocks readying) goes in a follow-up once the principles are agreed.
- Left out as too detailed for principles (candidates for intent or rules): --json on every
  command, ASCII text, the ticket layout.

## Discussion (for reference, not authoritative)

The human, 2026-11-26 (to advisor), verbatim:

> What I want to understand to start out with here is exactly what is in these specs. There's something that happened with the workflow implementation that was unexpected to me, and I want to work through how this is controlled. I think we need some sort of governance system that is somehow checked against and verified, so that when I request a ticket or a change, there are some overall invariants that are not changed (or that are called out really loudly for me if the ticket is implying a change to them).
>
> I'm working with another repo for talking through how to clearly document intent, requirements, and provenance for decisions that I'm making. [...] They have a concept of documenting intent. This is all based on Chad Fowler's generative software kind of writeup of this, but it fits with everything else we've been building.
>
> Anyway, I don't want to copy that intent over yet because we're still really working it out. The idea here is that I want high-level intent, very high-level, like guiding principles that every individual ticket should be checked against. Those high-level brief, high-level intent specifications or guiding principles will not be violated unless explicitly requested, confirmed by me.

Then:

> Yeah, let's talk through the intent. I feel like there are probably two concepts here that may be worth just differentiating:
>
> 1. I really like to call these principles that are extremely high-level and govern the process, the overall architecture, and decision-making.
> 2. Intent would be more detailed, but similarly at a higher level and a different type of change control than the specs are.
>
> And I think they live in two files. I don't know. I really like having things in different files, personally.
>
> The intent, I think, should be defined by module or area of some kind, where specific intents are around managing agent sessions compared to the ticket system, compared to the workflow system, and project setup. There would be top principles to guide the overall architecture, and then individual intents for the different sub-areas or different areas (I don't know if we call them modules or areas of the system).
>
> Let's go ahead and start drafting the principles now.

How the rigid workflow came about (advisor, from the tickets): the brief asked for a very light
tool with per-type workflows "probably not here"; fl-fu3v (approved) made five fixed phases; the
forward gate came in fl-4tx8 under the overnight "make assumptions" go; each later ticket built on
the specs before it, and none was checked against "light, and flume does not own the workflow",
which was written nowhere a worker reads.
