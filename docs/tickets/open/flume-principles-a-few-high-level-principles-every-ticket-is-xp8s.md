---
id: fl-xp8s
title: "Flume principles, their provenance, and what flume is: three documents every ticket is checked against"
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

### The documents, separate files

- **What flume is** (docs/flume.md): a short, plain description of flume. The principles link to
  it.
- **Principles** (docs/principles.md): very high-level, few, govern process, architecture and
  decision-making across all of flume. Change only on the human's explicit confirmation.
- **Principles provenance** (docs/principles-provenance.md): for each principle, the human's words
  and the history of how it was decided. Linked from the top of the principles; an agent reading
  the principles does not need to read it.
- **Intent** (one file per area, e.g. docs/intent/agents.md, tasks.md, workflow.md, setup.md):
  more detailed than principles, still above the specs, with its own change control. Areas named
  so far by the human: managing agent sessions, the ticket (task) system, the workflow system,
  project setup. Drafted after the principles.
- **Specs** (design/specs/) stay as they are: observable behaviour, changed by tickets.

### Draft: docs/flume.md

---

# What flume is

This describes what flume is meant to be, not all of what is built today. What flume does now
is in its specs (design/specs/) and its CLI help.

Flume is a tool for orchestrating work between multiple coding agents by
organizing work into discrete tasks that follow a prescribed workflow. Flume
prioritizes transparency and human oversight by storing the workflow
configuration, agent instructions, and tasks as plain text files that can be
inspected and updated at any time. History is tracked in git. Agents interact
with the task system through a CLI to create, find, and claim tasks. The CLI
implements the task workflow and system rules are enforced through the CLI
instead of depending on agents to follow written instructions. Individual
projects (git repos) can be managed in a workspace.

The expected use case is for a single person working on a single workspace on a
single computer (one file system). Flume is not designed for multiple people
collaborating or to sync work between multiple checkouts of the workspace on
different computers. Flume has flexible capabilities so that it can work within
the constraints of a Claude Code sandbox, such as one an enterprise might put in
place.

Flume is made of:

- **Projects and workspaces**: a project is a single git repository; a workspace is a collection
  of related projects. Flume keeps its files (tasks, workflows, configuration) in a repository the
  user chooses, which can be the project's own repository when there is no workspace.
- **Tasks**: a task is made of one or more artifacts stored together. Documents are stored as
  Markdown, and structured data as YAML (in files or front matter). Kinds, epics and a roadmap
  organize them.
- **Agents**: Claude Code sessions started with flume agent, given the workflow, their identity
  and a role when they start (flume prime).
- **Workflows**: text for agents, and enforcement by the CLI of the workflow's steps, which can
  include required gates and reviews. Each step has instructions and names its required
  artifacts, each with a template. Flume ships some; a workspace or project can change or replace
  them.
- **Guides**: specific instructions for an agent doing a specific kind of work, such as adding a
  CLI command, building a UI component or doing a security review.
- **The daemon**, started by the human, which writes the task files and commits every change; the
  **CLI** agents and the human use; and a **web UI** to see the tasks.

---

### Draft: docs/principles.md

---

# Flume principles

These govern every change to flume: its process, its architecture and its decisions. What flume is:
flume.md. A ticket that would change or bend a principle says so at the top, and is not built
without the human's explicit confirmation, quoted on the ticket.

Each principle has a provenance, how it was decided and the history behind it, kept separately for
reference in principles-provenance.md. You do not need it to follow the principles.

## P1 Small and simple

Flume does the few things its work needs and no more. Each part is the smallest thing that does
the job, and a feature that might be needed later is left out until it is. When in doubt, KISS and
YAGNI.

## P2 The human is in control

The human can override the system: any rule, step or gate that flume or a workflow sets gives way
when the human says so. Some decisions are the human's alone, and agents are not allowed to make
them.

## P3 Workflows are dynamic

The workflow is not hard-coded in flume: it is fully configurable or overridable. Each workspace and
project can specify its own workflow, and in time each task. Flume provides the mechanics (tasks,
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

---

### Draft: docs/principles-provenance.md

---

# Flume principles: provenance

Where each principle in principles.md came from: the human's words (verbatim unless marked), the
tickets, and how it changed. For reference; the principles stand without it.

## P1 Small and simple

- The brief, 2026-11-16: "A very light, scaled-down version of something like bridle". "I'm trying
  to get out all the ideas that go into bridle quickly and reformat them into a lighter-weight,
  simpler thing."
- 2026-11-16 (via aide): "KISS in times of doubt, and YAGNI - don't build too much."
- First drafted as "Light: lighter than bridle". The human, 2026-11-26: "It's simply a comparison
  to Bridle. It doesn't have any meaning without knowledge of Bridle, and then Bridle can change. I
  want to rephrase this in terms of that: speak to Flume without reference to Bridle."

## P2 The human is in control

- 2026-11-17 (fl-fu3v): "Overall guidance: the human is in control. They can ask you to move
  between phases and go backwards or forwards."
- First drafted as "Flume and its agents propose; the human decides". The human, 2026-11-26: "P2
  is not correct. "The human is in control" is true. "The human can override the system" is what
  this should say. [...] "The human is in control" means the human can make certain decisions that
  the agents are not allowed to make."
- The human, 2026-11-26: "P2 should not list the decisions that are mine alone. That is an
  implementation detail specific to individual intents."

## P3 Workflows are dynamic

- 2026-11-25 (fl-94yx), after the built-in five phases and the forward gate turned out more rigid
  than planned: "The workflow should not be assumed by flume." "flume ships several workflows, but
  the user can fully override any part of the workflow system and replace it with their own. That
  means that flume cannot make strong assumptions about the workflow itself."
- The rigid phases were removed (fl-94yx); workflow as configuration comes back one step at a time
  (fl-4k35).
- First drafted as "Flume does not own the workflow". The human, 2026-11-26: "the workflow is fully
  configurable or overridable. [...] each project, each workspace and project, can specify their own
  workflow. [...] It could actually be task-specific. I'm trying to think of a general phrase that
  says the workflow is not hard-coded. The workflow is determined by the system dynamically.
  "Workflows are dynamic" might be the headline there."

## P4 Works in an enterprise sandbox

- 2026-11-16 (fl-jc84): "I can directly reach public github and clone, but I'm not allowed to push
  at all".
- 2026-11-17 (fl-qgr7): "don't start a daemon ever".
- First drafted as "Built for the work sandbox" (every constraint absolute). The human,
  2026-11-26: "P4 is also too strong, so let's temper this. It should say that Flume supports the
  work sandbox and is what most capabilities should work in [...] if certain capabilities are not
  able to run in the work sandbox, Flume as a whole should still work, or it should have a fallback
  or a separate option for those that are possible to work but need a different implementation."
- The specific constraints stay in the project rule built-for-the-work-sandbox.
- First titled "Works in the work sandbox", naming the human's work computers. The human,
  2026-11-26: "Let's also rephrase the work sandbox to be a little more generic. Let's say an
  enterprise sandbox. Don't say "the humans work computers." Make it more generic, as if we're
  describing this to an audience on the internet, to say that it's designed to work within the
  constraints of the Claude Coast sandbox that might be in place in an enterprise setting."
  ("Claude Coast" read as Claude Code.)

## P5 Flume is self-describing

- 2026-11-19 (fl-q6cm): "agents start with '<command> --help' so the main thing is getting the
  description right there; I want an agent with NO knowledge of flume to respond intelligently to
  this question: "i want to use flume, explain how it works.""
- First drafted as "Flume teaches itself". The human, 2026-11-26: "It's too ambiguous. I think what
  you mean to say is "Flume is self-describing," and then I would agree. Agents should be able to
  discover how Flume works, how to use it, including how the current repository is set up, directly
  from the CLI."

## P6 Plain files are the record

- Tickets lite (the brief): "Everything is plain files you can browse in Obsidian or on GitHub, and
  a small local daemon does the mechanical writes".
- The advisor's wording of the principle. The human, 2026-11-26: "For P6, I want to soften the final
  sentence a little bit: that they should hold no independent record of their own."

## P7 Specified from the outside

- 2026-11-16 (fl-47b8): "I DO want clear specs written for every CLI command and the API and UI -
  use bridle specs and write tests for them". "The specs should be clear and as language and
  implementation-agnostic as possible."

## P8 Principles and intent change only on the human's word

- 2026-11-26: "I think we need some sort of governance system that is somehow checked against and
  verified, so that when I request a ticket or a change, there are some overall invariants that are
  not changed (or that are called out really loudly for me if the ticket is implying a change to
  them)." "Those high-level brief, high-level intent specifications or guiding principles will not
  be violated unless explicitly requested, confirmed by me."

---

### Assumed (advisor; change if wrong)

- docs/flume.md is a new, separate file (the human: "in this document or another document"); the
  README's one line and flume --help can point to it later.
- P1 no longer names any other tool.
- P4 is the general stance; the specific sandbox constraints stay in the project rule
  built-for-the-work-sandbox, unchanged.
- P8 is the governance rule itself, kept as a principle so it lives with the others.
- How tickets are checked against principles (an Intent section in the ticket layout, who checks,
  what blocks readying) goes in a follow-up once the principles are agreed.
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

The human, 2026-11-26, verbatim:

> Okay, I'm tempted to approve these principles, but I think, yet again, I'm getting ahead of myself because I'm running out of time. The P1, I have problems with because it doesn't say anything about. It's simply a comparison to Bridle. It doesn't have any meaning without knowledge of Bridle, and then Bridle can change. I want to rephrase this in terms of that: speak to Flume without reference to Bridle.
>
> For these principles here, let's keep a document on provenance. The provenance document for the principles would contain these source statements that you have here and would be a separate document that does not need to be read by an agent reading the principles, but can be referenced. It should be linked at the top of the principles document to say that each of these principles has a provenance for how the decision was made and the history behind it. They're stored separately for reference. Update this to indicate that and show me the two documents here in the ticket separately.
>
> Also, do we have a high-level explanation of what Flume is? These principles don't describe what Flume is at all. I think there needs to be a description in this document or another document that says pretty clearly what Flume is.

Advisor: there was no such document; the README says only "A workflow tool for agents", and flume
--help has one paragraph. Drafted docs/flume.md.

The human, 2026-11-26, verbatim:

> * add "and a role" to flume intro agents
> * P3, I want to change the wording there. Instead of saying "Flume does not own the workflow," it should say "the workflow is fully configurable or overridable."
>
> I think of a short sentence here. We'll work out the exact sentence, but the idea is not to say "Flume does not own the workflow," but that each project, each workspace and project, can specify their own workflow. "Workflows project-specific" might be the right way to put that. It could actually be task-specific.
>
> I'm trying to think of a general phrase that says the workflow is not hard-coded. The workflow is determined by the system dynamically. "Workflows are dynamic" might be the headline there.

The human, 2026-11-26, verbatim: "Let's also rephrase the work sandbox to be a little more generic.
Let's say an enterprise sandbox. Don't say "the humans work computers." Make it more generic, as if
we're describing this to an audience on the internet, to say that it's designed to work within the
constraints of the Claude Coast sandbox that might be in place in an enterprise setting."

The human, 2026-11-27, verbatim (on flume.md): "It should say "flume prioritizes transparency"
instead of "prioritizing," so please fix that. And then, per "flume is made of under tasks," I
don't really feel like we need to specify here that it's one folder per task. ... I would like it
to say that a task can be made of multiple artifacts that are stored together. Those artifacts are
plain text and configuration, or the format for plain text is Markdown, and for structured text,
structured data is YAML in files or front matter. And then workflow needs to be updated to say that
workflow includes both text for an agent as well as enforcement by the CLI for the steps in a
workflow (which can include required gates and reviews). Each step in the workflow has
instructions, and they include required artifacts, which have a template. For guides, I wanted to
say that these are specific instructions for an agent that is completing a specific task, such as
adding a CLI command, building a UI component, or doing a security review."

Advisor: chose "artifacts" (the human's first word) over "documents"; open to change.

Advisor asked whether flume.md describing more than is built would confuse agents; recommended a
line at the top pointing to the specs and CLI help for current behaviour. The human, 2026-11-27,
verbatim: "Sure, let's add that sentence as well."

The human, 2026-11-27, verbatim: "tasks do not necessarily live in a separate repo. Just drop the
tasks live in a tasks repo section. What you're describing is a workspace ... I do still have a
desire for Flume to work in single-project repos without a separate workspace, without a separate
Flume repo. I'm not sure if that's implemented or not. Let's not worry about that too much. I
think, really, the primary use case is going to be for a workspace ... but I do really want to use
it as well for single-repo projects where I don't have a separate workspace ... Flume is made of
projects and workspaces. They say a workspace is a collection of related projects. A project is a
single Git repository, and Flume can store all of its system, all of its documents, maybe, in a
user-specified repository."

The human, 2026-11-27, verbatim: "I don't think there's a reason to stay in what Flume is, that
artifacts are plain text documents. I think in the future I would be okay having images in there,
specifically for UI-related work, or diagrams of some kind ... We don't need to say that Flume
supports images right now ... What I want to say is that artifacts that are documents are stored
as Markdown, and artifacts that are structured data are stored as YAML. Just don't say anything
about that artifacts must be plain text."
