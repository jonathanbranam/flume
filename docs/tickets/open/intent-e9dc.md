---
id: fl-e9dc
title: "Intent: layers (docs/intent/layers.md and its provenance)"
kind: docs
created: 2026-11-27
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-acpm]
---

## The ask

Write the layers intent, docs/intent/layers.md (with docs/provenance/layers.md): how flume builds a
document from layers, in the terms agreed on 2026-11-27. It is the one place the layers are
listed; other intent says "layered" and points here. Drafted for the human's review.

## Design

To draft (advisor with the human):

- The terms: layers, layer (built-in, workspace, project, in that order), overlay, layered
  document.
- Which documents are layered (workflow, project, role, guides, templates, start-up
  instructions), stated so the list can grow without editing other intent.
- The decisions and their why: merge by heading; an overlay can add, append, remove or replace;
  a missing overlay is not an error; an error names the file, the line and the heading, and
  explains the fix; identity lines are never layered (agents intent, i-8484).
- Sources: design/specs/workflow-layers.md (layers.md after fl-8g3x), fl-mv4r,
  fl-a5vb, fl-hq8k, fl-vpvk.

## Discussion (for reference, not authoritative)

The human, 2026-11-27, verbatim: "really this should be a named subsystem / module / solution
within flume and we don't repeat the details of it every place (b/c those details may change then
we have to update every place we list base, workspace, project). So, what is our single name for
this capability within flume. we will then have an intent folder that describes exactly how this
system capability works."
