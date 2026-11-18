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

### Example: a docs repo (flume/projects/docs/workflow.md)

```
# Workflow @replace

This repo is documents. When the human asks for an edit, make it directly on main.
No task, no worktree, unless the human asks for one.
```

(phases.md needs no override: with no tasks, no instructions are asked for.)

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
