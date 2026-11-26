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

The human can override the system: any rule, step or gate that flume or a workflow sets gives way
when the human says so. Some decisions are the human's alone, and agents are not allowed to make
them.

Source: 2026-11-17 (fl-fu3v): "Overall guidance: the human is in control. They can ask you to move
between phases and go backwards or forwards."

## P3 Flume does not own the workflow

Flume provides the mechanics (tasks, parts, comments, assignment, history, layered text, plans);
the workflow is text or configuration the user can replace whole. Flume enforces a workflow
rule only when the workflow's own configuration asks for it.

Source: 2026-11-25 (fl-94yx): "The workflow should not be assumed by flume." "flume ships several
workflows, but the user can fully override any part of the workflow system and replace it with
their own. That means that flume cannot make strong assumptions about the workflow itself."

## P4 Works in the work sandbox

Flume supports the Claude Code sandbox on the human's work computers, and most capabilities should
work inside it. A capability that cannot run in the sandbox must not break flume as a whole: the
rest of flume still works, and where it is possible that capability gets a fallback, or a separate
option with a different implementation that does work there.

Source: 2026-11-16 (fl-jc84): "I can directly reach public github and clone, but I'm not allowed
to push at all". 2026-11-17 (fl-qgr7): "don't start a daemon ever". 2026-11-26: "Flume supports
the work sandbox and is what most capabilities should work in [...] if certain capabilities are not
able to run in the work sandbox, Flume as a whole should still work, or it should have a fallback
or a separate option for those that are possible to work but need a different implementation."
(The specific constraints stay in the rule built-for-the-work-sandbox.)

## P5 Flume is self-describing

An agent can discover from the flume CLI itself how flume works, how to use it, and how the
current repository and workspace are set up, with no other knowledge of flume.

Source: 2026-11-19 (fl-q6cm): "agents start with '<command> --help' so the main thing is getting
the description right there; I want an agent with NO knowledge of flume to respond intelligently
to this question: "i want to use flume, explain how it works.""

## P6 Plain files are the record

Tasks and their history are plain Markdown and YAML files in a git repo, readable without flume
(in Obsidian, on GitHub). The daemon, CLI and UI read and write those files; they should hold no
independent record of their own.

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

- P6 is the advisor's reading of the brief; the human reviewed it and softened the last sentence.
- P4 is the general stance; the specific sandbox constraints (no Claude Code hooks, never start
  the daemon, updates by git pull) stay in the project rule built-for-the-work-sandbox, unchanged.
- The decisions that are the human's alone are not listed in P2; each area's intent names its own
  (the human).
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

The human, 2026-11-26, verbatim, on the first P2 draft ("Flume and its agents propose; the human
decides"): "P2 is not correct. "The human is in control" is true. "The human can override the
system" is what this should say. The way you worded this, it says, "agents propose, the human
decides." Absolutely not. That's not the right wording for this at all. "The human is in control"
means the human can make certain decisions that the agents are not allowed to make."

The human, 2026-11-26, verbatim: "P4 is also too strong, so let's temper this. It should say that
Flume supports the work sandbox and is what most capabilities should work in (the working work
sandbox). But if certain capabilities are not able to run in the work sandbox, Flume as a whole
should still work, or it should have a fallback or a separate option for those that are possible to
work but need a different implementation." And: "P2 should not list the decisions that are mine
alone. That is an implementation detail specific to individual intents."

The human, 2026-11-26, verbatim, on the first P5 draft ("Flume teaches itself"): "P5: The
principle and the expansion on it don't match. I guess maybe I'm not understanding the phrase
"Flume teaches itself." It's too ambiguous. I think what you mean to say is "Flume is
self-describing," and then I would agree. Agents should be able to discover how Flume works, how
to use it, including how the current repository is set up, directly from the CLI."

The human, 2026-11-26, verbatim: "For P6, I want to soften the final sentence a little bit: that
they should hold no independent record of their own."
