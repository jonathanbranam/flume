---
id: fl-2962
title: "Layers: call the built-in layer the base layer"
kind: docs
created: 2026-11-27
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-e9dc, fl-8g3x]
resolved: 2026-11-27T17:32:47Z
---

## The ask

Rename the term "built-in layer" (and "built-in document") to "base layer" ("base document")
everywhere flume uses it, so the term matches the flume repo's own base/ folder. Wording only:
no behaviour, folder or file changes.

## Design

- Terms after the change: layers; layer (base, workspace, project, in that order); overlay;
  layered document. "Base document" is a document flume ships in its base/ folder.
- Change "built-in layer" and "built-in document(s)" to "base layer" and "base document(s)" in:
  design/specs/layers.md, design/specs/workflow.md, design/specs/agent.md, docs/help/usage.md,
  and the comments in src/core/documents.ts and src/cli/agent.ts. Requirement and scenario IDs
  stay; scenario wording changes with it.
- "Built-in named workflows" (workflows/light, workflows/none) keep that name: they are not a
  layer, they are copied into the workspace or project layer.
- Resolved tickets are left as they are.
- fl-e9dc's agreed terms change to match (advisor edits its Design).

### Not in this ticket

- No folder renames: the flume repo's base/ already has the name; the flume root's workspace/
  and projects/PROJECT/ stay.

## Discussion (for reference, not authoritative)

The human, 2026-11-27 (via advisor, verbatim): "I think "base" for "built-in" might make even
more sense." After the advisor's summary of the layering and the two points to weigh (base/ in the
flume root meant the workspace layer until fl-8g3x; "base" is also loosely "the layer below"):
"sure, let's do it. I agree."
