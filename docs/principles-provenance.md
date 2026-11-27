# Flume principles: provenance

Where each principle in [principles.md](principles.md) came from: the human's words (verbatim unless marked), the
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
- 2026-11-27, "and in time each task" dropped so the principle holds as written: "I want these
  intents to these principles to live forever, so drop and, in time, just put each task."

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
