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

Modeled on `openspec instructions` (its text output, `src/commands/workflow/instructions.ts`).

- Agent text is one root element with attributes, holding one child element per part. Each part's text inside is unchanged Markdown.
- Element names are lowercase with underscores, as OpenSpec's (`project_context`, `success_criteria`), and stable: they are part of the CLI's spec.
- An optional part with no text (missing file, no role, no guides) is left out, element and all.
- Layout as OpenSpec prints it: each tag on its own line, the part's text on the lines between, and one blank line between parts.
- A part may start with an XML comment telling the agent how to treat it, as OpenSpec does (`<!-- These are constraints for you to follow. -->`).
- Text from files is escaped so it cannot end its element early or forge another one: a closing tag of an envelope element inside the text is neutralized, and attribute values are escaped (quotes). Everything else, including Markdown and other tags, passes through as written.

### flume prime

Parts, in order (layers: fl-3pfa; guides: fl-x6xn):

```
<flume_prime agent="a" project="backend" role="reviewer">

<flume_base>
flume's built-in text
</flume_base>

<workspace_workflow>
base/workflow.md
</workspace_workflow>

<project_workflow project="backend">
projects/backend/workflow.md
</project_workflow>

<role name="reviewer">
base/roles/reviewer.md, then projects/backend/roles/reviewer.md
</role>

<guides>
<!-- Print one with: flume guide <name> -->
<guide name="testing" stage="build">its description</guide>
</guides>

</flume_prime>
```

- `project` and `role` attributes appear only when known.

### flume guide

- `flume guide <name>` prints `<guide name="..." stage="...">` around the guide's text (`stage` only when set).

### Assumed (advisor; change if wrong)

- The element names above. Both role layers go inside one `<role>`, base first.
- Scope is `flume prime` and `flume guide`. Other commands that print for agents (`flume task show`, the not-running message) are added when one needs it.
- No `--json` form for now (YAGNI); OpenSpec has one (the same data as JSON).

## Discussion (for reference, not authoritative)

### 2026-11-17, the human (verbatim)

> `flume prime` and other commands that list agent text should use the current best known formats for giving agents instructions. This can be a separate ticket from the layout. They should use XML sections to inform the agent what each section it. Refer to openspec.

### References

- OpenSpec PR #422 (merged Dec 2025) changed `openspec instructions` to XML-style output "for better AI parsing", with tags such as `<artifact>`, `<task>`, `<context>`, `<output>`, `<template>`: https://github.com/Fission-AI/OpenSpec/pull/422 . OpenSpec also keeps an `<openspec-instructions>` block in AGENTS.md. No official doc of the tag format was found; check OpenSpec's source before copying exact names.
- OpenSpec CLI reference: https://openspec.dev/docs/reference/cli
- Anthropic's prompting guidance recommends XML tags to separate the parts of a prompt (instructions, context, examples).

### OpenSpec's format (from the source the human linked, 2026-11-17)

The human: "https://github.com/Fission-AI/OpenSpec/blob/main/src/commands/workflow/instructions.ts"

Read via the raw file. `openspec instructions <artifact>` prints one root `<artifact id=".." change=".." schema="..">` whose children are flat siblings: `<warning>` (0..n), `<task>`, `<project_context>`, `<rules>`, `<dependencies>` (with `<dependency id status>` holding `<path>` and `<description>`), `<output>`, `<instruction>`, `<template>`, `<success_criteria>`, `<unlocks>`. Optional parts are left out when empty; `<task>`, `<output>`, `<template>` and `<success_criteria>` always appear. Some parts open with an XML comment addressed to the agent, e.g. `<!-- This is background information for you. Do NOT include this in your output. -->` in `<project_context>`. Text is escaped so content can't close the envelope's tags or forge attributes ("a quote in it would otherwise close the attribute and forge siblings on this tag"); templates keep their own `<!-- -->` and `<placeholder>` markers. Its `apply` and `archive` commands print Markdown headings instead, not XML. `--json` prints the same data as JSON.

### OpenSpec's real output (advisor ran it, 2026-11-17)

The human: "you can cd to ../openspec-demo and run some openspec commands". OpenSpec 2.1.0; advisor made a throwaway change (`openspec new change add-login`, removed afterwards) and ran `openspec instructions proposal|specs --change add-login`. Observed, matching the source:

```
<artifact id="proposal" change="add-login" schema="spec-driven">

<task>
Create the proposal artifact for change "add-login".
Initial proposal document outlining the change
</task>

<output>
Write to: /.../openspec/changes/add-login/proposal.md
</output>

<instruction>
... long Markdown how-to (sections, IMPORTANT notes, which openspec commands to run) ...
</instruction>

<template>
<!-- Use this as the structure for your output file. Fill in the sections. -->
# Proposal
...
</template>

<success_criteria>
<!-- To be defined in schema validation rules -->
</success_criteria>

<unlocks>
Completing this artifact enables: specs, design
</unlocks>

</artifact>
```

For `specs` (proposal not written yet) it adds `<warning>` ("unmet dependencies ... Missing: proposal") and `<dependencies>` with one `<dependency id="proposal" status="missing">` holding `<path>` and `<description>`, introduced by "Read the current contents of these files before creating this artifact (re-read them from disk even if you saw them earlier - they may have been edited)". The `<project_context>` and `<rules>` parts appear only when `openspec/config.yaml` sets `context` / `rules` (empty in the demo). Takeaways for flume: tags on their own lines with blank lines between parts; short fixed lead-ins and XML comments tell the agent how to use a part; the long how-to is plain Markdown inside one element.
