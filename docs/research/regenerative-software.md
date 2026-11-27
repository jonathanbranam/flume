# Regenerative Software: Chad Fowler's seven primitives

Flume's own copy of the seven primitives from Chad Fowler's book, so flume work can point at
them. We update this copy as we learn more. Related: fl-xp8s (principles), fl-4k35.

## Source

Chad Fowler, *Regenerative Software*, O'Reilly, ch. 3 "The Seven Primitives". This is an
O'Reilly Rough Cut (early release; no page numbers; the text may change before publication).
The text was copied by the human from the rough cut on 2026-11-22 and recorded in the notes
project at `project/agentic-dev/Regenerative Software.md`. Fowler calls them "primitives", not
"principles".

## Fowler's wording

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

## Writing good intent

Fowler's wording, ch. 3:

> Good intent usually has three parts:
> 1. Scope: where the requirement applies
> 2. Invariant: what must remain true
> 3. Reason: why the invariant matters

## Our summary (not Fowler's wording)

This table is ours, a summary for quick reference. It is not Fowler's wording.

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
  became intent in the book, and context boundary grew into compilation. Pace, deletion and
  compaction are new.
- The human's working rule: intent is the same in every environment; compilation (per
  environment) decides how.

## How flume uses them

To be filled in as flume adopts them.
