---
id: fl-8g3x
title: "Layers: rename base/ to workspace/, workflow-layers spec to layers, and use the agreed terms"
kind: chore
created: 2026-11-27
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-e9dc]
---

## The ask

Align the layers subsystem's names with the terms agreed on 2026-11-27: rename the flume root's
base/ folder to workspace/, rename the spec design/specs/workflow-layers.md to layers.md, and use
the terms built-in, workspace and project layer, overlay and layered document in the specs. No
migration: there are no flume installs to migrate.

## Design

- **The folder.** Every place the flume root's base/ is read or written becomes workspace/:
  workflow.md, project.md, roles/, guides/, templates/, first-prompt.md and any other layered
  file. flume init and flume workflow install write workspace/. flume reads no base/ folder and
  gives no warning for one (no migration).
- **The spec file.** git mv design/specs/workflow-layers.md design/specs/layers.md; requirement
  and scenario IDs unchanged; every spec that says "the workflow-layers spec" says "the layers
  spec".
- **The terms, in the specs.** The built-in layer (the documents flume ships; "the one flume
  ships" becomes "the built-in document"), the workspace layer (workspace/ of the flume root), the
  project layer (projects/PROJECT/). An overlay is a workspace or project file that changes the
  same document in the layer below. A layered document is the built-in document with every
  overlay applied. Behaviour does not change; only names and paths.
- Specs, code, tests, shipped workflows (workflows/), docs and help text move together, in one
  change. bridle spec check --require-ids clean; no new unbound scenario.

### Not in this ticket

- The layers intent (docs/intent/layers.md): its own ticket.

## Discussion (for reference, not authoritative)

The human, 2026-11-27, verbatim: "> Renaming workflow-layers.md to layers.md would match the intent
file -- agree". On base/: "Ah, ok, good point. i don't like "shipped" maybe "built-in"? and yeah,
idk if we should rename "base" to "workspace" that would align things better". Then: "yes
approved... and we're renaming base/ to workspace/ right? I think that's a good move. Don't worry
about migrations. there are no flume projects yet to migrate"
