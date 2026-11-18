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

A project's workflow must be able to replace the base workflow, not only add to it. Today flume's base text is built into the code and every layer (workspace, project, role) is appended, so a docs repo still tells agents to make a task and use a worktree for a one-line doc edit. Make the base workflow a Markdown file, and let each layer's workflow.md merge into the layers below it by heading: replace a section, add one, append to one, remove one, or replace the whole file. Keep it really simple. Pending: the human asked for the ticket and feedback, not a build.

## Design

### The base workflow is a Markdown file

- Flume ships its base workflow as one Markdown file (today's DEFAULT_BASE overview, plus PHASE_STEPS and COMMON_STEPS, word for word), read at run time, no build step.
- Shape: one H1; H2 sections for the overview parts; an H2 Phases with one H3 per phase (proposal, design, specs, plan, implement) holding that phase's steps; an H2 for the steps of every phase.
- flume prime prints the merged document minus the Phases detail (the overview); flume task instructions ID prints the merged Phases section for the task's current phase plus the every-phase section, the template and pushed guides (fl-4tx8 unchanged otherwise). A phase with no section left prints a line saying the workflow has no steps for it.
- Placeholders ({name}, {project}) work as today.

### Layers, in order

base (shipped) -> workspace (flume/base/workflow.md in the tasks repo) -> project (flume/projects/P/workflow.md) -> role (base/roles/R.md, then projects/P/roles/R.md). Each merges into the result of the ones before it.

### Merging by heading

- Sections are matched by heading path: the H2 text, then the H3 text under it, and so on; case-insensitive, surrounding spaces ignored. The H1 is the document root; its text is not matched.
- Default (no tag), "replace at the level with content": a matched section's own text (between its heading and its first sub-heading) replaces the lower layer's own text when the override has any; with none, the lower text stays. Sub-sections merge the same way, one by one. So an override with an empty "## Phases" and a filled "### implement" changes only implement.
- A section that matches nothing is added, at the end of its parent section, in the override's order.
- Order otherwise follows the lower layer.

### Tags (a word in braces at the end of a heading, stripped from the output)

- {append}: the section's own text is added after the lower layer's text instead of replacing it.
- {replace}: the whole section, with all its sub-sections, replaces the lower one; lower sub-sections not repeated are dropped.
- {remove}: the section and its sub-sections are dropped; any text under it is ignored.

### Replacing the whole file

- Front matter `replace: true` at the top of a layer's file: the file replaces everything below it; lower layers are not read.

### Seeing and checking the result

- flume workflow show [--project P] [--role R] prints the merged document; --layers marks which layer each section came from.
- flume check reports a {append}, {replace} or {remove} heading that matches no section in the layers below (a typo, or a base heading that was renamed), naming the file and heading.
- Prime's XML (fl-87h9) changes: the merged workflow is one element instead of flume_base plus workspace_workflow, project_workflow and role (spec updated in the same change).

### Example: a docs repo

```
# Workflow

## Working a task {replace}

This repo is documents. When the human asks for an edit, make it directly on main.
No task, no worktree, unless the human asks for one.

## Phases {remove}
```

### Assumed (advisor; change if wrong)

- Default is replace-at-content, not append: the human leaned that way ("it would only replace at the level that has distinct content"), and append is one tag away.
- Tags in braces at the heading's end: visible in the file and easy to type. Alternative: an HTML comment after the heading (<!-- flume: remove -->), invisible when rendered but easy to miss.
- No prepend, no section moves, no per-paragraph edits (YAGNI).
- Templates keep their own rule (a project template replaces the base one, fl-fu3v).
- Markdown, not XML, for the files; prime still wraps the result in its XML elements.

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
