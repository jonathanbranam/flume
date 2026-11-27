---
id: fl-srst
title: "Specs as intent: a Why for every requirement, provenance per requirement in design/provenance"
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

Treat every spec requirement as intent: record the why behind it, so an agent (or the human)
reading a requirement knows the reason and can tell a deliberate decision from an accident (e.g.
agent names are unique on the machine because Claude Code messaging addresses agents by name).
Keep the history behind each requirement (the human's words, tickets, how it changed) in separate,
optional provenance files that an agent does not read with the spec. Applied to flume's own
development under bridle now, through a bridle rule, until flume can run itself.

## Design

### Three layers per requirement

- **Requirement** (design/specs/NAME.md, unchanged): the EARS sentence. What flume does.
- **Why** (in the spec, under the requirement): one or two sentences, a paragraph starting
  *Why*: right after the requirement sentence, before its scenarios. The reason, stated as it
  stands now; no history, no quotes. bridle spec check accepts it (checked 2026-11-27).
- **Scenarios** (unchanged): the evaluations. Each executable one has a test naming its ID.
- **Provenance** (design/provenance/NAME.md, optional): where the requirement came from.

An agent building or reviewing reads the spec (requirement, why, scenarios). It reads provenance
only when it needs to know how a decision was made or is about to change one.

### Provenance files

- One file per spec, same name: design/provenance/agent.md for design/specs/agent.md. Created
  when the first entry is written; a spec with no provenance has no file.
- One section per requirement that has provenance, headed by its ID and title:
  "## r-a3c0 Registry entry". Requirements with nothing to record are left out.
- Each section: dated entries, oldest first: the human's words verbatim (marked if not), the
  ticket, and what changed. Same style as docs/principles-provenance.md.
- Keyed by the requirement ID, which bridle spec id keeps stable, so a renamed requirement keeps
  its provenance. A section whose ID no longer exists in the spec is an error to fix (the
  requirement was removed: delete the section, or keep it under a heading "Removed" with the
  date and ticket).

### The spec's opening paragraph is the area's intent

Each spec already opens with a paragraph saying what it covers. That paragraph becomes the area's
intent: what this part of flume is for and its main decisions, checked against docs/flume.md and
docs/principles.md. This replaces the separate per-area intent files (docs/intent/*.md) planned
in fl-xp8s: one place per area instead of two.

### Rules (bridle overlay, now)

A project rule, spec-why-and-provenance, for workers, reviewers and the manager:

- A requirement added or changed has a *Why*. Missing *Why* on an untouched requirement is not
  a defect; it is filled when the requirement is next touched or by a backfill ticket.
- When the human's words decide or change a requirement, add them to the provenance file under
  its ID, in the same change.
- A change that contradicts a requirement's *Why* says so at the top of its ticket, like a change
  to a principle (P8 in spirit; the human confirms).

### Backfill

One docs ticket per spec, starting with agent.md: write the *Why* of each requirement and seed
provenance only for requirements that need it or where we have it now, from the tickets the spec
names (their Discussion sections hold the human's words).
Where the why cannot be found, write "Why: not recorded" and list it for the human, rather than
inventing one.

### Not in this ticket

- A checker (orphan provenance IDs, missing *Why*): by hand and review first; a script or a
  bridle feature if it proves needed (P1).
- Flume's own support for this (a spec or task format): later, when flume runs itself.

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
