---
id: fl-h8ty
title: "Kinds choose their workflow: a default workflow, overridden per kind"
kind: feature
created: 2026-11-19
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-mv4r, fl-ws3h, fl-na9m]
---

## The ask

A task's kind should choose its workflow. One default workflow serves every kind; a kind that has
its own workflow uses that instead. A research or docs task should not go through the five coding
phases. Don't write the workflows yet: this ticket collects the idea until the human takes it up.

## Design

Not designed yet. Waiting on the human.

## Discussion (for reference, not authoritative)

### The human's words, 2026-11-19 (to advisor, verbatim, dictated)

"I want to be sure that we have a kind of ticket that's not a coding change."

"I think what the general standard is is that the kind of a ticket determines its workflow for
someday, when we have multiple workflows. In particular, a docs-only update or something doesn't go
through this workflow. By default, there's a default workflow for all tickets, but if there's an
override for a specific kind, we would use that workflow."

"There's a third level of an override kind of thing. I don't know, we could skip the override,
maybe."

"I have tickets that are research tickets, and the purpose of it is to do a bunch of research and
write a document, or maybe write other tickets. That whole thing is just: there are no statuses or
phases or assignments, really. Do a bunch of research, write something out, then you're done."

"I have bug fixes, which typically don't need the entire workflow, right? You identify a bug fix,
you need to do the research, reproduce it, write failing test cases to prove you fixed it, and then
go fix it. It's very similar to a coding ticket, but it maybe has some additional nuance to it."
"You don't write any of these workflows out yet."

"those are common ones: dot research, docs update, types of things, bug fixes, and new feature
development."

Then: "Create a different ticket on kinds and workflows as pending and move the discussion to
that".

### What flume has today

- Kinds: feature, bug, chore, docs, research and epic (task-files spec). Non-coding kinds
  (research, docs) exist already.
- Every kind goes through the same five phases: proposal, design, specs, plan, implement (workflow
  spec). Epics are to be exempt from the workflow (fl-na9m).
- The workflow layers (fl-mv4r) merge workspace, project and role files into the base workflow by
  heading; a per-kind workflow would most likely be one more layer or a separate base file per
  kind.

### Points to settle when the human takes this up

- The workflows the human named: research (research, write a document or tickets, done; no
  phases or assignment), docs update, bug fix (research, reproduce, failing test, fix), feature
  (today's five phases).
- How a kind's workflow is found: a file per kind beside the default, falling back to the default.
- Whether the "third level of override" is needed (the human: "we could skip the override,
  maybe").
