---
id: fl-mv4r
title: "Workflow layers: the base workflow as a Markdown file; workspace, project and role files merge into it by heading, and can replace or remove"
kind: feature
created: 2026-11-18
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-fu3v, fl-4tx8, fl-87h9]
---

## The ask

A project's workflow must be able to replace the base workflow, not only add to it. Today flume's base text is built into the code and every layer (workspace, project, role) is appended, so a docs repo still tells agents to make a task and use a worktree for a one-line doc edit. Make the base workflow a Markdown file, and let each layer's workflow.md merge into the layers below it by heading: replace a section, add one, append to one, remove one, or replace the whole file. The same rule for roles, guides and templates. Keep it really simple and hard to get wrong. Pending: the human asked for the ticket and feedback, not a build.

## Design

One rule for every layered document in flume: the workflow, roles, guides and templates. It should be hard to get wrong: anything flume cannot place exactly is an error, never a silent guess.

### Documents are Markdown files that pass the linter

- Flume ships its base workflow as two Markdown files, read at run time, no build step:
  - workflow.md: the overview flume prime prints (today's DEFAULT_BASE, word for word).
  - phases.md: the steps per phase, one H2 per phase (proposal, design, specs, plan, implement), and an H2 for the steps of every phase (today's PHASE_STEPS and COMMON_STEPS, word for word). flume task instructions ID prints the merged H2 for the task's current phase and the every-phase H2, then the template and pushed guides (fl-4tx8 otherwise unchanged). A phase with no H2 left prints a line saying the workflow has no steps for it.
- Base roles, guides and templates are Markdown files too.
- Every layered file passes rumdl (markdownlint rules): in particular exactly one H1 per document.
- Placeholders ({name}, {project}) work as today.

### Layers, in order

base (shipped with flume) -> workspace (flume/base/ in the tasks repo) -> project (flume/projects/P/). For each document (workflow.md, phases.md, roles/R.md, guides/G.md, the templates), each layer's file of the same name merges into the result of the layers before it. The role layer is the role file in base, then in the project, merged the same way.

### Merging: replace is the default

- Headings are matched by path: the H1, then the H2 under it, then the H3, and so on. Matching ignores case and surrounding spaces, and ignores the tag.
- A heading with no tag is a replace: it must match a heading in the layers below, or it is an error. Its own text (between it and its first sub-heading) replaces the lower section's own text. Its sub-headings are then handled one by one, each by the same rule; lower sub-headings it does not mention stay.
- A heading with no tag, no text and sub-headings is only a path to them: the lower text stays.
- A heading with no tag, no text and no sub-headings is an error (use @remove).

### Tags: an @ word at the end of the heading, stripped from the output

- `## Name @add`: a new section, added at the end of its parent, in the file's order. Error if it matches a lower heading.
- `## Name @append`: its text is added after the lower section's text. Error if it matches nothing. Sub-headings follow the usual rules.
- `## Name @remove`: drops the lower section and all its sub-sections. Error if it matches nothing, or if it has any text or sub-headings of its own.
- `## Name @replace`: the whole section, sub-sections and all, replaces the lower one; lower sub-sections it does not repeat are dropped. Error if it matches nothing.
- On the H1, `# Workflow @replace` replaces the whole document: the file stands alone and lower layers are not read. No front matter.
- An unknown @ word at the end of a heading is an error.

### Preview and check

- Preview: `flume preview workflow`, `flume preview phases`, `flume preview role R`, `flume preview guide G`, `flume preview template PART`, each with --project P; prints the merged document. `--layers` marks which file each section came from. `--json` gives the sections with their source.
- `flume check` checks every layered file in the tasks repo by the rules above and reports each error with file, line and heading.
- When a layer has an error, prime, instructions and guide print the error (file, line, heading) to standard error and exit 1, instead of guessing.
- Prime's XML (fl-87h9) changes: the merged workflow is one element instead of flume_base plus workspace_workflow, project_workflow and role (spec updated in the same change).

### Draft: the two base documents

Exactly what flume would ship, for the human's review. The words are today's built-in text
(DEFAULT_BASE in src/cli/agent.ts; PHASE_STEPS and COMMON_STEPS in src/core/instructions.ts),
split into sections, with commands in backticks and lines wrapped at 80 for rumdl. The
project line (DEFAULT_PROJECT) is not in a file: flume adds it when a project is known.

---

**workflow.md** (printed whole by `flume prime`):

````markdown
# Flume workflow

You are agent {name}, stored in $AGENT_NAME.

## Using flume

- Use the flume CLI to work with tasks; run `flume --help` to learn it.
- Never start `flume serve` yourself; only the human does. If flume says the
  server is not running, ask the human to start it.
- Read and change tasks only with flume commands. Never read or edit task
  files directly.

## The human is in control

They may move a task to any phase, forwards or backwards, or skip phases
("write design and specs", "remove the specs and start over on the design",
"the ticket is simple, skip specs and plan, just implement"). Do what they ask.

## Working a task

1. Claim the task (`flume task claim ID`); it prints your instructions for the
   task's current phase. Follow them. To see them again, run
   `flume task instructions ID`, not `flume task show` (that prints the task's
   data, not what to do). Flume will not move a task forward for you until you
   have read the instructions for its current phase.
2. When your phase is done, set the next phase (`flume task phase ID PHASE`).
   One agent will likely not do the whole workflow: another may take the next
   phase, or finish the plan. If you are waiting on the human, assign the task
   back to them (`flume task assign ID human`).
3. In every phase, record important conversations with the human as comments
   (`flume task comment ID`), quoting the human verbatim.

## Phases

In order. The specific steps for each are in the instructions. Read a part with
`flume task show ID PART`; write one with `flume task write ID PART`, starting
from its template (`flume task template PART`).

- proposal: check that the task has a clear proposal, goal and scope. If not,
  ask the human. Write them in the body.
- design: when goal and scope are clear, think through the design questions
  and write the design.
- specs: when the design is clear, write the spec: clear requirements in EARS
  form ("When <trigger>, the system SHALL <response>").
- plan: read the body, design and spec, then write the plan: how to implement
  the task, step by step, in numbered groups. Decide which guides apply to each
  group. Then mark the task ready: `flume task phase ID implement`.
- implement: do the plan one group at a time, report each item, and close the
  task when done.

## Guides

Guides are how-to notes. In every phase: if you see guides (`flume guide`) that
matter for a later phase of this task, push them
(`flume task guide ID NAME --phase PHASE`); they are printed with that phase's
instructions. Read any guide that matters for your own work now
(`flume guide NAME`).
````

---

**phases.md** (`flume task instructions ID` prints the H2 of the task's current
phase, then "Every phase", then the template and pushed guides):

````markdown
# Phases

## Proposal

Check that the task has a clear proposal, goal and scope.

- Read the task: `flume task show ID body`.
- If the proposal, goal or scope is unclear, ask the human (assign the task to
  them: `flume task assign ID human`).
- Write them in the body: `flume task write ID body`, starting from the
  template below (or the existing text).
- When they are clear, move on: `flume task phase ID design`.

## Design

Think through the design questions and write the design.

- Read the body: `flume task show ID body`.
- Write the design: `flume task write ID design`, starting from the template
  below.
- Record each decision, the alternatives and why this one. Ask the human about
  anything open.
- When the design is clear, move on: `flume task phase ID specs`.

## Specs

Write the spec, clear requirements in EARS form.

- Read the body and design: `flume task show ID body`,
  `flume task show ID design`.
- Write the spec: `flume task write ID spec`, starting from the template below.
- A requirement is one EARS sentence ("When <trigger>, the system SHALL
  <response>") with Given/When/Then scenarios.
- When the spec is clear, move on: `flume task phase ID plan`.

## Plan

Write the plan, how to implement the task step by step.

- Read the body, design and spec: `flume task show ID PART`.
- Write the plan: `flume task write ID plan`, starting from the template below.
  Numbered groups of numbered items.
- Decide which guides (`flume guide`) apply to each group and name them with
  Guide: lines under the group's heading, before its items. The guides are
  printed with the group when an agent runs `flume task next`.
- Then mark the task ready: `flume task phase ID implement`.

## Implement

Do the plan, one group at a time.

- Read the body, design and spec for context.
- Get the current group of plan items and its guides: `flume task next ID`.
- Do the items, and report each one: `flume task done ID ITEM`, or
  `flume task skip ID ITEM --reason TEXT` if it should not be done. Repeat
  until the plan is complete.
- When writing code, enter a git worktree to make the changes; when done, merge
  main into it, then exit the worktree and merge it into main.
- Close the task when done: `flume task close ID`.

## Every phase

- If you see guides (`flume guide`) that matter for a later phase of this
  task, push them: `flume task guide ID NAME --phase PHASE`. Read any guide
  that matters for your own work now: `flume guide NAME`.
- Record important conversations with the human as comments
  (`flume task comment ID`), quoting the human verbatim.
- When your phase is done, set the next phase (`flume task phase ID PHASE`).
  Another agent may take the next phase. If you are waiting on the human,
  assign the task back to them (`flume task assign ID human`).
````

---

**Example override, a docs repo** (flume/projects/docs/workflow.md):

````markdown
# Flume workflow @replace

You are agent {name}, stored in $AGENT_NAME.

This repo is documents. When the human asks for an edit, make it directly on
main. No task, no worktree, unless the human asks for one.
````

**Example override, one phase changed** (flume/projects/web/phases.md):

````markdown
# Phases

## Implement

Do the plan, one group at a time. Run `npm test` before reporting each item.

## Review @add

Before closing, ask the human to review the change in the browser.
````

---


### Assumed (advisor; change if wrong)

- The @ word goes at the end of the heading (`## Phases @remove`), so the heading reads first and matches by its words. Alternative: at the start (`## @remove Phases`).
- No tag means "replace this section's own text, then go through its sub-sections"; @replace means "replace the whole section". Both are replaces; @replace is the one that drops unmentioned sub-sections, and on the H1 it is the whole file.
- @add of a heading that already exists, and @remove with content under it, are errors: they are almost always mistakes.
- Templates follow the same rule: a project template now merges by heading, and `# ... @replace` gives today's whole replacement (fl-fu3v).
- A broken layer stops prime and instructions (exit 1) rather than being skipped: a skipped layer would silently give agents the wrong instructions. Alternative: warn and skip that layer.
- No prepend, no moving sections, no per-paragraph edits (YAGNI).

## Discussion (for reference, not authoritative)

The human, 2026-11-18 (to advisor), verbatim:

> Okay, that was really helpful. What I'm trying to think through is: how can we have a project's workflow override the base workflow?
>
> I ran into this today with my existing solution. I have a couple of code repos, and then I have a docs repo. My documentation repo has the same workflow as my coding repos, so it says when you're doing work, create a ticket, and when you're changing files, use a work tree or something. Although it says you don't have to do that for documents, I said, "Hey, can you update this document with these words on it?" He said, "Oh yeah, but first I'll create a ticket, blah blah blah." Well, that's just silly.
>
> I need to not only add instructions, but I really need the workflow layering to be able to replace instructions. I want something really, really simple in the first place.
>
> What I'm thinking is that the workflow that we have should be a Markdown file, or we can use XML. I'm fine with either, but I think it should have Markdown headings in it, probably. When you supply your own workflow, you can have some special instructions in there, in your file. We'll invent some syntax or something like that, just write in the file itself, and then the file would indicate that.
>
> Either the whole file completely replaces the existing file, with some heading at the top that could be front matter maybe, or for each heading within the file, each H1, H2, it is usually only one H1, so there should be only one H1. For each H2, H3, whatever, we should have a little tagging syntax, and I think the default would be to replace them.
>
> Actually, I'm not sure. The default's either going to be to replace or to add if the heading matches. We would match all the headings up, and then we need a default. I feel like it would only replace at the level that has distinct content, if that makes sense. Write a ticket up for this, think through it, and give me some feedback.

Context: advisor had just given the human the base workflow as Markdown (DEFAULT_BASE in src/cli/agent.ts, PHASE_STEPS and COMMON_STEPS in src/core/instructions.ts); the tasks repo's workflow.md files are only appended today.

Advisor's first draft used {replace}-style tags, front matter for whole-file replace, and an untagged unmatched heading as an addition. The human, 2026-11-18, verbatim:

> Yeah, the markdown files should all pass the rumdml (whatever that is) linting, and that's 1H1 per document. Yeah, I think so. The curly braces, to me, look like a substitution, so I don't like that. I use a lot of Python, and other languages use that too, with the dollar sign curly braces.
>
> I'm thinking either an @ sign at the beginning, or that's probably my preference: the @ sign. My other thought would be a colon and then the word replace.
>
> Let's drop the front matter. We can have replace at the H1, right? If the first line of the file is replace, then we replace it. I think that makes sense
>
> yeah, I agree that replace should be the default, and I definitely want the check method and a preview. Definitely need a preview.
>
> By the way, this is the same for roles. This is the same for guides. This is just going to be one rule that's applied to every document in the system, and I want it to be kind of hard to mess it up.
>
> Let's do replace as the default, and anything that isn't a replace, you have to give it a tag. If you have a header and you're not going to replace the header, then you have to put a tag: either add, append, or remove. If you remove a header and then have subheaders below it, that's an error. Any header that doesn't have an add tag must be a replace. If there's a header that doesn't match and it doesn't say add, remove, or append, then that's an error.

("rumdml" read as rumdl, the Markdown linter.)

The human, 2026-11-18, verbatim: "Why not have two Markdown files, a different one for Prime and a different one for Phases? I'm not sure I understand that part." Advisor: no good reason for one file; two files means prime prints its file whole and instructions picks one H2, with nothing to cut out. Design changed to workflow.md and phases.md.

The human, 2026-11-18, verbatim: "Can I just see the two documents in the task? I just don't know why not. Why wait for a worker to build it and then review it and then not like the outcome? I just want to see exactly what it looks like. Put some HRs between it and show me each of the documents that should be created so I can review them." Advisor added "Draft: the two base documents" to the Design.
