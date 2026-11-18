---
id: fl-x6xn
title: "flume guides: guide files with front matter, flume guide, listed in prime"
kind: feature
created: 2026-11-18
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: [fl-3pfa]
related: [fl-3pfa]
resolved: 2026-11-18T03:15:16Z
---

## The ask

Build the Design below. Go given by the human, 2026-11-17: "flume-guides yes, go".

For whoever edits this ticket (the human, 2026-11-17): "the design at the top is the currently agreed-upon design; keep it current and DO NOT include narration or restatements in the design. The discussion section can include the discussion narrative with restatements as a reference."

## Design

### Guide files

- A guide is a Markdown file with YAML front matter, like an agent skill.
- Front matter is flat (no nesting):
  - `name`: the guide's name; matches the file name without `.md`.
  - `description`: what the guide covers, when it is relevant and when to use it.
  - `stage`: optional; the workflow stage the guide is scoped to (stages: ticket fl-fu3v).
- Guides live in `<flume-root>/base/guides/<name>.md` and `<flume-root>/projects/<project>/guides/<name>.md` (layout: ticket fl-3pfa). A project guide overrides the base guide of the same name.

### flume guide

- `flume guide <name>` prints the guide: the project's if it exists, else the base one. When neither exists it exits non-zero with an error naming the guide.
- Agents never read guide files; they run `flume guide`.

### Prime

- `flume prime` lists the guides available, each with its `name` and `description`, and says how to print one (`flume guide <name>`).

### Assumed (advisor; change if wrong)

- `flume guide <name>` prints the body without the front matter.
- A guide with missing or unparsable front matter is reported by `flume check` and left out of prime's list.
- How `stage` changes what prime lists (e.g. only the current stage's guides) waits on the workflow design (fl-fu3v); until then prime lists every guide and shows its stage.

## Discussion (for reference, not authoritative)

### 2026-11-17, the human (verbatim)

> roles are a folder inside base/ and projects/<name>; so are guides.

On the advisor's question whether guides reach agents through a `flume guide <name>` command with prime listing them: "yes. that's right"

> Start a new ticket to work on guides ... to start with: guides will have yaml frontmatter similar to agent skills that explain when a guide is relevant and when it should be used. A guide can be scoped to a workflow stage as well.

> I really like yaml frontmatter; so, we're going to have yaml parsing; I think we bite the bullet and just make everything yaml now and it's totally fine.

### Advisor notes

- Agent skills use `name` and `description`, with "when to use it" written into the description; the Design follows that rather than adding a separate `when` field.
- Split out of fl-3pfa, whose Guides section now points here.
