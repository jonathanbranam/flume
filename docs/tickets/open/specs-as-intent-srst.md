---
id: fl-srst
title: "Intent per area, separate from specs: the pyramid, durable intent IDs, requirements name the intent they check"
kind: arch-revision
created: 2026-11-27
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-xp8s, fl-b2yb]
---

## The ask

Record flume's intent, per area, separate from the specs: the decisions and the why behind each,
so an agent (or the human) can tell a deliberate decision from an accident (e.g. agent names are
unique on the machine because Claude Code messaging addresses agents by name). The specs are the
evaluations that check the intent; each requirement names the intent items it checks. Keep the
history behind each intent item in separate, optional provenance. Applied to flume's own
development under bridle now, through a bridle rule, until flume can run itself.

## Design

### Where things live

Everything of flume's own is under docs/; design/ holds only design/specs/, which bridle's spec
tools read. docs/flume.md, docs/principles.md, docs/intent/, docs/provenance/.

### The pyramid

Fewer things at the top, more at the bottom; each layer is checked against the ones above it.

1. **What flume is** (docs/flume.md): one document.
2. **Principles** (docs/principles.md): a few, for all of flume.
3. **Intent** (docs/intent/AREA.md): per area, the decisions and their why.
4. **Requirements** (design/specs/): the evaluations; EARS requirements with scenarios and tests.

Principles and intent change only on the human's word (P8). Requirements change by tickets, as
long as they still serve the intent they name.

### Intent files

- One file per area. Areas so far: agents, tasks, workflow, setup.
- A short opening paragraph: what the area is for.
- Then one section per intent item: "## i-XXXX Title", a short statement and its why, in plain
  words (no CLI syntax, no file formats; those belong in the requirements).
- IDs are durable, like bridle's spec IDs: "i-" and four hex digits, never reused or renumbered.
  A removed item moves under a "Retired" heading with the date and ticket, so its ID stays taken.
- bridle spec id cannot mint them (it needs a Scenario under each heading; checked 2026-11-27).
  Until it can, mint one by hand (four random hex digits), check it is not in docs/intent/.ids,
  and append it there.

### Requirements name the intent they check

- A requirement lists every intent item it checks, on a line right after the requirement
  sentence: "*Intent*: i-XXXX, i-YYYY". bridle spec check accepts an extra paragraph there
  (checked 2026-11-27).
- A requirement may name none: mechanics (argument parsing, output layout) that serve no
  decision.
- An intent item with no requirement yet is allowed: it is a target, like docs/flume.md.

### Provenance

- All provenance lives in docs/provenance/: principles.md for the principles (moved there from
  docs/principles-provenance.md), and AREA.md for each intent file, same name, one section per
  item that has provenance, headed by its ID and title. Optional: only items that need it or where we
  have it now. Dated entries: the human's words verbatim, the ticket, what changed.
- An agent reads provenance only when it needs to know how a decision was made, or is about to
  change one.
- Requirements get no provenance of their own: their why is the intent they name.

### Rules (bridle overlay, now)

- read-the-principles grows: read docs/intent/AREA.md for each area a task touches.
- A new project rule, intent-and-evaluations, for every role:
  - A requirement added or changed names the intent items it checks.
  - A change that would add, change or retire an intent item says so at the top of its ticket and
    waits for the human's explicit confirmation (P8).
  - When the human's words decide an intent item, add them to its provenance in the same change.

### First steps

1. Draft docs/intent/agents.md for the human's review, from the agent spec review of 2026-11-27
   and the tickets the agent spec names. Known items: agent names unique on the machine; flume
   tracks only the agents it spawned; what an agent works on is tracked by its tickets, not the
   agent registry; flume never starts the daemon; identity lines no layer can change.
2. Once approved: the rules above, then *Intent* lines in design/specs/agent.md.
3. The other areas one at a time, the same way.

### Not in this ticket

- A checker (unknown or retired IDs named by a requirement, items no requirement checks): by hand
  first; a script or a bridle feature if it proves needed (P1).
- Flume's own support for intent: later, when flume runs itself.

## Discussion (for reference, not authoritative)

The human, 2026-11-27, verbatim: "I want to have a talk about specs: Bridle specs versus Chad
Fowler's concept of evaluations with respect to principles, our principles, and our discussion
about intent. ... I'd really like to start dogfooding Flume on Flume, but I feel like we're a long
way away from that being possible. We would lose a lot of really nice things that Bridle has
currently. I'm trying to find a middle ground here where we can use Bridle rules to overlay some of
what we're designing with Flume on top of Bridle, and then continue using Bridle for a while until
Flume is more mature. ... when I read these specs versus the principles, and even your analysis
just now pointed out something about whether agent names should be machine-unique,
project-unique, or workspace-unique, we know that answer. That answer should be in the provenance
or the reasons behind the decisions. It should be in the intent recorded. ... for every
requirement, we should treat it as an intent from now on, and that means recording the why behind
it. Then we should start adding provenance for these requirements. Provenance would be separate, I
think. I don't want an agent reading the requirements specs intent to read all of the provenance
along with it. Not every requirement is going to have necessarily very much provenance, so that
should be optional. ... design provenance as a folder, then create a file of the same name as
every spec, and then use the requirements ID to indicate provenance for each requirement."

Advisor's suggestions beyond the human's outline: the short *Why* lives in the spec (an agent
needs the reason to apply a requirement; the history it does not), and the spec's opening
paragraph serves as the area intent instead of separate docs/intent files. Mapping to Fowler's
idea as advisor understands it: requirement plus why is the intent, scenarios with their tests are
the evaluations, provenance is the record of how they came to be.

The human, 2026-11-27, verbatim (clarifying): "And just to be clear, in case I overstated that,
the provenance for every requirement that needs provenance or that we have provenance for right
now"

The human, 2026-11-27, verbatim: "Yes, requirements should name all of the intents that it checks,
and that could be multiple. For intent, every intent should be labeled using the same durable IDs
that we use in Bridle, not increasing numbers. Right, intent. I think we're following a pyramid
kind of principle here, right, like the testing pyramid a little bit. We've got: * At the very
top, what Flume is * Guiding principles * Intent * Requirements or specifications or evaluations
that we're calling them. We should have fewer of the things at the top, and we may have more of
the things at the bottom."

Advisor (superseded design): a *Why* line in each requirement and provenance per requirement in
design/provenance/; replaced by separate intent at the human's word above.

The human, 2026-11-27, verbatim: "Yeah, let's, I guess, put all of these in. Are we putting
everything in docs? Should we move Providence, Intent, and anything that's not part of Bridle?
Should live in docs? I think that makes sense to me."
