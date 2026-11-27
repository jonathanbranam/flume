---
id: fl-zujz
title: "Regenerative Software reference: Chad Fowler's seven primitives"
kind: docs
created: 2026-11-27
created_by: external:aide
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-xp8s, fl-4k35]
---

## The ask

Add a reference file, `docs/research/regenerative-software.md`, holding Chad Fowler's seven
primitives from *Regenerative Software*, so flume work can point at them. Flume keeps its own copy
and updates it as we learn more.

## Design

### The file

`docs/research/regenerative-software.md` (beside `docs/research/openspec.md`), with these sections:

1. **Source**: Chad Fowler, *Regenerative Software*, O'Reilly, ch. 3 "The Seven Primitives". An
   O'Reilly Rough Cut (early release; no page numbers; may change before publication). Text
   copied by the human from the rough cut on 2026-11-22; recorded in the notes project at
   `project/agentic-dev/Regenerative Software.md`. Fowler calls them "primitives", not
   "principles".
2. **Fowler's wording** (a block quote, verbatim, as below).
3. **Writing good intent** (Fowler's wording, verbatim, as below).
4. **Our summary, not Fowler's wording** (as below), clearly marked as ours.
5. **How flume uses them**: a short placeholder line, "To be filled in as flume adopts them."

### Fowler's wording (quoted, ch. 3)

> The following seven primitives represent the types of system knowledge that have to survive
> implementation replacement.
>
> **Intent** captures what the system must do and why.
>
> **Compilation** is the architecture that generated code compiles into: boundaries, ownership,
> communication primitives, runtime choices, framework constraints, and operational constraints,
> specified mostly by humans so generated code doesn't have to figure them out.
>
> **Evaluations** define executable ways to determine whether behavior survived replacement (or
> even initial generation).
>
> **Provenance** preserves the lineage of decisions, constraints, incidents, rejected
> alternatives, and generated artifacts.
>
> **Pace** matches replacement velocity to architectural position.
>
> **Deletion** makes it safe to remove or replace components without breaking hidden
> dependencies.
>
> **Compaction** keeps regeneration from accumulating complexity.
>
> Each primitive exists because replacement destroys something unless that thing has been
> preserved somewhere else. Intent preserves purpose; compilation, architectural shape;
> evaluations, behavioral truth; provenance, reasoning; pace, stability; deletion, safety;
> compaction, comprehensibility. They form a loop.

(Bold on the names is ours, for scanning; the words are Fowler's.)

### Writing good intent (Fowler's wording, ch. 3)

> Good intent usually has three parts:
> 1. Scope: where the requirement applies
> 2. Invariant: what must remain true
> 3. Reason: why the invariant matters

### Our summary, not Fowler's wording

| Primitive | Preserves |
|---|---|
| Intent | purpose |
| Compilation | architectural shape |
| Evaluations | behavioral truth |
| Provenance | reasoning |
| Pace | stability |
| Deletion | safety |
| Compaction | comprehensibility |

- His earlier blog series "The Phoenix Architecture" (chadfowler.com, "The Phoenix Primitives",
  2026-04-13) had four: specification, evaluation, context boundary, provenance. Specification
  became intent in the book, context boundary grew into compilation; pace, deletion and
  compaction are new.
- The human's working rule: intent is the same in every environment; compilation (per
  environment) decides how.

### Not in this ticket

- Mapping the primitives onto flume's principles or workflow (fl-xp8s, fl-4k35 may use them later).
- The human's notes on pace, and the notes project's mapping to agentic-dev requirements (the
  notes advisor offered both; ask if wanted).

## Discussion (for reference, not authoritative)

The human, 2026-11-27 (to the aide, verbatim): "As part of the flume work, we're referring
repeatedly to some of the concepts from Chad Fowler's Regenerative Software book. I'd like to get
a file here that includes a description of the seven things that he lists there. This is all
recorded in my Notes project, and there's an advisor who's given the name Agentic-Dev. Please send
a message to the advisor on the Notes project with the name Agentic-Dev and ask for a copy of the
Principles of Regenerative Software that Chad Fowler has. Then we'll make a copy of it here and
update our copy here as we learn more."

The text above came from the notes project's advisor (agentic-dev), message m-1206, 2026-11-27,
copied from the notes file named under Source.
