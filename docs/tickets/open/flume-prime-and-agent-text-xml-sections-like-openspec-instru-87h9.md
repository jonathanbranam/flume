---
id: fl-87h9
title: "flume prime and agent text: XML sections, like OpenSpec instructions"
kind: feature
created: 2026-11-18
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-3pfa, fl-x6xn]
---

## The ask

Text flume prints for agents (`flume prime`, `flume guide`, and any other command whose output is meant for an agent) uses the current best-known format for agent instructions: each part wrapped in a named XML section, so the agent knows what each part is. On hold until the human says build.

For whoever edits this ticket (the human, 2026-11-17): "the design at the top is the currently agreed-upon design; keep it current and DO NOT include narration or restatements in the design. The discussion section can include the discussion narrative with restatements as a reference."

## Design

- Each part of agent text is wrapped in an XML element whose name says what the part is. The part's text inside is unchanged Markdown.
- `flume prime` output, in order (layers: fl-3pfa; guides: fl-x6xn):

```
<flume-instructions>
<base> flume's built-in text </base>
<workspace-workflow> base/workflow.md </workspace-workflow>
<project-workflow project="backend"> projects/backend/workflow.md </project-workflow>
<role name="reviewer"> base/roles/reviewer.md, then projects/backend/roles/reviewer.md </role>
<guides>
<guide name="testing" stage="build"> its description </guide>
</guides>
</flume-instructions>
```

- A part with no text (missing file, no role) is left out, element and all.
- `flume guide <name>` prints `<guide name="..." stage="...">` around the guide's text.
- Element and attribute names are lowercase with hyphens, and stable: they are part of the CLI's spec.

### Assumed (advisor; change if wrong)

- The element names above (`flume-instructions`, `base`, `workspace-workflow`, `project-workflow`, `role`, `guides`, `guide`). Two role layers go inside one `<role>`, base first.
- Scope is `flume prime` and `flume guide`. Other commands that print for agents (`flume task show`, the not-running message) are added when someone finds they need it.
- No `--json` form for now (YAGNI).

## Discussion (for reference, not authoritative)

### 2026-11-17, the human (verbatim)

> `flume prime` and other commands that list agent text should use the current best known formats for giving agents instructions. This can be a separate ticket from the layout. They should use XML sections to inform the agent what each section it. Refer to openspec.

### References

- OpenSpec PR #422 (merged Dec 2025) changed `openspec instructions` to XML-style output "for better AI parsing", with tags such as `<artifact>`, `<task>`, `<context>`, `<output>`, `<template>`: https://github.com/Fission-AI/OpenSpec/pull/422 . OpenSpec also keeps an `<openspec-instructions>` block in AGENTS.md. No official doc of the tag format was found; check OpenSpec's source before copying exact names.
- OpenSpec CLI reference: https://openspec.dev/docs/reference/cli
- Anthropic's prompting guidance recommends XML tags to separate the parts of a prompt (instructions, context, examples).
