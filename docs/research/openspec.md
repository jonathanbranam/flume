# OpenSpec: research notes

Notes from exploring OpenSpec on 2026-11-17, for designing flume's workflows, agent text and
spec artifacts. Written by the advisor at the human's request: "create a docs/research/ folder and
openspec.md in there and make detailed notes on your exploration of openspec for later reference".

Related tickets: fl-fu3v (workflow), fl-87h9 (agent text in XML sections), fl-x6xn (guides),
fl-3pfa (layout; spec artifacts in task folders).

## Sources

- OpenSpec CLI 2.1.0, installed on the human's machine, run in a scratch project
  (`../openspec-demo`, an `openspec init` folder; not a git repo). Throwaway changes made there
  were deleted afterwards.
- The source of `openspec instructions`, `apply` and `archive`:
  https://github.com/Fission-AI/OpenSpec/blob/main/src/commands/workflow/instructions.ts
  (read via the raw file).
- The Claude Code skills OpenSpec installs, in `~/.claude/skills/openspec-*/SKILL.md`.
- The built-in schema, `spec-driven`, at
  `~/.local/share/openspec/binary-schemas/<hash>/spec-driven/` (`schema.yaml`, `templates/`).
  `openspec schema which spec-driven` prints the path.
- PR #422 (merged Dec 2025) that made `openspec instructions` print XML-style text "for better AI
  parsing": https://github.com/Fission-AI/OpenSpec/pull/422
- CLI reference: https://openspec.dev/docs/reference/cli

## The model in one paragraph

A **schema** (a workflow) lists **artifacts**: files a change needs, each with what it requires
first, an instruction and a template. A **change** is a folder under `openspec/changes/<name>/`
that holds those artifacts. The CLI computes each artifact's status from which files exist
(done / ready / blocked by ...). Generic skills drive it: **new** makes the change folder,
**continue** asks the CLI for the next ready artifact and its instructions and writes that one
artifact, **apply** works through `tasks.md`, **archive** merges the change's delta specs into
`openspec/specs/` and moves the change to `changes/archive/`. The skills hold no
workflow-specific text: the schema does, and the CLI generates the prompt from it.

## Project layout

```
openspec/
|-- config.yaml              schema: spec-driven; optional context, rules, operations
|-- specs/                   the current specs, one folder per capability
|   `-- <capability>/spec.md
`-- changes/
    |-- <change>/
    |   |-- .openspec.yaml   schema: spec-driven, created: 2026-11-17 (skip_specs: true opt-out)
    |   |-- proposal.md
    |   |-- specs/<capability>/spec.md   delta specs
    |   |-- design.md
    |   `-- tasks.md
    `-- archive/
```

`config.yaml` (all optional beyond `schema`):

- `context: |` project constraints an agent cannot infer from the code (e.g. "Designs and tasks
  must cover Windows, macOS, and Linux"). Shown to the agent in every artifact's instructions.
- `rules:` per artifact, a list of extra rules (e.g. `proposal: [Keep proposals under 500 words]`).
- `operations:` per operation (`apply`, `archive`), `guidance:` bullets, advisory.

## The schema (workflow definition)

`spec-driven/schema.yaml`, shape (instructions trimmed):

```yaml
name: spec-driven
version: 1
description: Default OpenSpec workflow - proposal -> specs -> design -> tasks
artifacts:
  - id: proposal
    generates: proposal.md
    description: Initial proposal document outlining the change
    template: proposal.md          # file in templates/
    instruction: |
      Create the proposal document that establishes WHY this change is needed. ...
    requires: []
  - id: specs
    generates: "specs/**/*.md"     # a glob: the agent picks concrete paths
    template: spec.md
    requires: [proposal]
  - id: design
    generates: design.md
    template: design.md
    requires: [proposal]
  - id: tasks
    generates: tasks.md
    template: tasks.md
    requires: [specs, design]
apply:
  requires: [tasks]
  tracks: tasks.md
  instruction: |
    Read context files, work through pending tasks, mark complete as you go.
    Pause if you hit blockers or need clarification.
```

- Artifacts form a dependency graph, not a strict line: specs and design both unlock after the
  proposal.
- Instructions are long, careful Markdown: what sections to write, which `openspec` commands to
  run for research, what not to do, why. Templates are Markdown with `<!-- -->` guidance comments
  and `<placeholder>` markers that the agent fills in.
- `openspec schema fork <source> [name]` copies a schema into the project to customise it;
  `schema init`, `schema validate`, `schema which`. `openspec schemas --json` lists schemas
  (name, description, artifacts, source).

## CLI commands the agent uses

| command | what it gives |
|---|---|
| `openspec list --json` | changes (most recent first) and `root` (null = project not set up) |
| `openspec new change "<name>"` | makes `changes/<name>/` with `.openspec.yaml` |
| `openspec status --change "<name>" --json` | each artifact's status, paths, next steps |
| `openspec instructions <artifact> --change "<name>" [--json]` | the prompt for one artifact |
| `openspec instructions apply --change "<name>" [--json]` | the prompt for implementing |
| `openspec instructions archive --change "<name>"` | inputs for archiving |
| `openspec validate [--specs]` | checks changes and specs |
| `openspec archive "<name>"` | merges delta specs, moves the change to archive |
| `openspec show "<spec-id>" --type spec [--json --no-scenarios]` | a spec, or just its requirements |

`openspec status --change tmp-y --json` (fresh change), key fields: `changeName`, `schemaName`,
`changeRoot`, `artifactPaths.<id>.{outputPath, resolvedOutputPath, existingOutputPaths}`,
`isPlanningComplete`, `isComplete`, `applyRequires: ["tasks"]`, `nextSteps: ["Run openspec
instructions proposal --change \"tmp-y\" --json before writing that artifact."]`, `actionContext`
(mode, `allowedEditRoots`, constraints), and `artifacts` with each one's status. Text form:

```
Change: add-login
Schema: spec-driven
Progress: 0/4 artifacts complete

[ ] proposal
[-] specs (blocked by: proposal)
[-] design (blocked by: proposal)
[-] tasks (blocked by: specs, design)

Next: openspec instructions proposal --change "add-login" --json
```

Every command ends by telling the agent the next command to run.

## Agent text: the XML form

`openspec instructions proposal --change add-login` (text, no `--json`):

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
Create the proposal document that establishes WHY this change is needed.
... (the schema's instruction, verbatim Markdown) ...
</instruction>

<template>
<!-- Use this as the structure for your output file. Fill in the sections. -->
# Proposal

## Why
<!-- Explain the motivation for this change. ... -->
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

For `specs` before the proposal exists, two more parts appear:

```
<warning>
This artifact has unmet dependencies. Complete them first or proceed with caution.
Missing: proposal
</warning>

<dependencies>
Read the current contents of these files before creating this artifact (re-read them from disk
even if you saw them earlier - they may have been edited):

<dependency id="proposal" status="missing">
  <path>/.../changes/add-login/proposal.md</path>
  <description>Initial proposal document outlining the change</description>
</dependency>
</dependencies>
```

All parts, in order (from the source): `<warning>` (0..n), `<task>` (always), `<project_context>`
(when `context` is set; opens with `<!-- This is background information for you. Do NOT include
this in your output. -->`), referenced stores, `<rules>` (when set; opens with `<!-- These are
constraints for you to follow. Do NOT include this in your output. -->`, one `- rule` per line),
`<dependencies>`, `<output>` (always), `<instruction>`, `<template>` (always), `<success_criteria>`
(always; a placeholder today), `<unlocks>`.

Format rules worth copying:

- One root element whose attributes identify the request; flat child elements, one per part;
  tags on their own lines; a blank line between parts.
- Element names are lowercase with underscores (`project_context`, `success_criteria`).
- Optional parts are left out entirely when empty.
- Short fixed lead-ins and XML comments tell the agent how to use a part ("constraints for you",
  "do NOT include this in your output", "re-read them from disk").
- Escaping: text from files can't close the envelope's tags (closing tags are neutralised) and
  attribute values are escaped ("a quote in it would otherwise close the attribute and forge
  siblings on this tag"). Template comments and `<placeholder>` markers pass through.
- Rules are flattened to one line each so a newline can't forge another bullet, "but never
  truncated: these are instructions an agent has to follow in full".
- A skipped artifact (`skip_specs: true`) gets no task or template at all, so the agent isn't
  told to write files that validation would then reject.

`openspec instructions apply` and `archive` print **Markdown headings**, not XML (`## Apply:
<change>`, `### Blocked`, `### Context Files`, `### Progress` (`N/M complete`), `### Tasks` with
`- [ ]` / `- [x]`, `### Instruction`, `### Project Context (required instruction input)`,
`### Operation Guidance (advisory)`). Example on a fresh change:

```
## Apply: tmp-x
Schema: spec-driven

### Blocked

Missing artifacts: tasks
Not created yet, in build order: proposal, specs, design, tasks

### Instruction
Cannot apply this change yet. Missing artifacts: tasks.
...
Create each with `openspec instructions <artifact> --change tmp-x` (`openspec status --change tmp-x` shows what is left).

No project context or operation guidance configured.
```

## Agent text: the JSON form

`--json` prints the same data as one JSON object plus `root`. For `instructions proposal`:
`changeName`, `artifactId`, `schemaName`, `changeDir`, `planningHome`, `outputPath`,
`resolvedOutputPath`, `existingOutputPaths`, `description`, `instruction`, `template`,
`dependencies`, `unlocks`, `root` (and `context`, `rules` when configured).

## How the skills use it

OpenSpec installs eight Claude Code skills: openspec-new-change, -continue-change, -ff-change
(fast-forward: all artifacts in one go), -apply-change, -verify-change, -sync-specs,
-archive-change, -update-change. (Also -explore and -propose in some installs.)

- **They call the CLI with `--json`** almost everywhere: `openspec list --json`, `openspec status
  --change "<name>" --json`, `openspec instructions <artifact-id> --change "<name>" --json`,
  `openspec store list --json`. The one text call: openspec-new-change shows the first artifact's
  instructions with `openspec instructions <first-artifact-id> --change "<name>"`.
- **The skill documents the JSON fields**, e.g. openspec-continue-change: "`context`: Project
  background (constraints for you - do NOT include in output)", "`rules`: Artifact-specific rules
  (constraints for you - do NOT include in output)", "`template`: The structure to use for your
  output file", "`instruction`: Schema-specific guidance", "`resolvedOutputPath`", "`dependencies`:
  Completed artifacts to read for context (entries with `skipped: true` have no files - do not look
  for them)".
- **continue does one artifact per run**: pick the first artifact with `status: "ready"` from
  status, get its instructions, write it from `template` with `context` and `rules` as constraints
  (not copied into the file), verify the file exists, show what is now unlocked, STOP. When
  planning is complete (`isPlanningComplete: true`) it says "Planning is complete! Review the plan
  before starting implementation." and stops.
- **Guard rails in the skills**: check the project has a root (`openspec list --json`, `"root":
  null` = not set up) and never create one as a side effect; if the skill was auto-selected and
  there is no root, drop OpenSpec silently; if the user asked for OpenSpec, ask whether to `init`.
  Resolve output paths and refuse any that leave `changeRoot` (symlinks included). If the change
  is ambiguous, offer the 3-4 most recent. A `--store <id>`, once chosen, is "sticky" for the rest
  of the workflow.

So there are two audiences: the XML text explains itself (for an agent or person with no skill),
and the JSON is for an agent driven by a skill that explains the fields.

## Takeaways for flume

The human, 2026-11-17: "I really like the openspec flow of new-change -> continue-change ->
continue-change -> apply. the workflow itself defines the flow through artifacts. "continue" is a
generic skill that uses `openspec` cli to dynamically generate the prompts for the agent. this is
the model for flume workflows." And: "we don't have to copy openspec exactly, we should improve on
it, but the overall design is sound."

- **Workflow = schema.** A flume workflow defines its steps, each step's artifact, what it
  requires, its instruction and template. Status is derived from which artifact files exist in
  the task folder. (fl-fu3v)
- **Generic skills, CLI-generated prompts.** One continue skill; flume prints the next step's
  instructions from the workflow. (fl-fu3v)
- **Agent text format.** For text read with no skill around it (`flume prime`, injected via
  `--append-system-prompt`), the XML form fits. For commands a skill calls repeatedly, a `--json`
  form plus a skill that documents the fields is OpenSpec's pattern. (fl-87h9)
- **Every output names the next command.** Cheap and keeps agents on the path.
- **Context and rules are marked as constraints, not content.** Worth copying for flume's
  workspace and project layers.
- **Places to improve on OpenSpec** (advisor's observations, not decided):
  - The instructions are very long and partly repeat across artifacts and skills; flume's layering
    (base, workspace, project) could keep each piece in one place.
  - Two formats for the same kind of output (XML for artifacts, Markdown for apply/archive); flume
    could use one.
  - `success_criteria` is an empty placeholder; flume could check a step's artifact (e.g. a
    validator per step) and say what "done" means.
  - Skills carry a lot of guard-rail prose (roots, stores, symlinks); flume's CLI could enforce
    more of that itself and keep the skills short.
  - OpenSpec has no notion of a task tracker; in flume the change folder *is* the task folder
    (`task.yaml`, `body.md`, `comments.md` plus the step artifacts), so status, comments and the
    workflow live together.
