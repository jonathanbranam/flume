---
id: fl-up3r
title: "Guides: remove the stage field"
kind: fix
created: 2026-11-27
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-4k35]
---

## The ask

Remove the optional stage field from guides. Nobody can say what a stage is (the human: "I don't
know what a stage is. I thought we had workflow steps, workflow stages, workflow phases"); it is a
leftover of the phases fl-94yx removed. How guides relate to workflow steps is revisited later in
fl-4k35.

## Design

- A guide's front matter holds name and description only. A stage key in an existing guide is
  ignored (not an error, not printed).
- Remove stage everywhere it shows:
  - flume guide NAME: the guide element has the attribute name only.
  - flume guide (list): one line per guide, name and description, tab separated; --json objects
    hold name and description.
  - The prime text's guides element: guide elements with the attribute name only.
  - flume task next and GET /api/tasks/{id}/plan/next: guide elements and the JSON guides list
    without stage.
  - GET /api/prime: guides without stage.
- Specs edited in place, same change as code and tests: design/specs/agent.md (r-c7a5, r-9a01 with
  s-9a02, r-5dfe), design/specs/workflow.md (r-4c05 with s-0b7c), design/specs/api.md (the guides
  of GET /api/prime and its scenario). Add a scenario that a guide with a stage key is listed and
  printed without it.
- Shipped guides (base/guides, workflows/) lose any stage key.

## Discussion (for reference, not authoritative)

Advisor's spec review, 2026-11-27, item 7. The human, verbatim: "I don't know about guides and
stages, and I'm surprised. I don't know what a stage is. I thought we had workflow steps, workflow
stages, workflow phases. Let's go ahead and take that out of the guides for now, and please update
the workflow as config ticket to indicate that. Guides will need to be revisited later and explain
what we took out here."
