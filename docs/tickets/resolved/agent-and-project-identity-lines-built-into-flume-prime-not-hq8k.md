---
id: fl-hq8k
title: Agent and project identity lines built into flume prime, not in any layer
kind: fix
created: 2026-11-25
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-mv4r, fl-vpvk, fl-a5vb]
resolved: 2026-11-25T14:02:12Z
---

## The ask

The lines that tell an agent who it is and which project it is on are universal; no layer has a
good reason to change them. Move them out of the layered files into flume itself, so prime
always prints them and no overlay can replace or remove them.

## Design

- flume prime prints, first, before the merged workflow and not inside any layered document:

  ```text
  You are agent {name}, stored in $AGENT_NAME.

  You are working on project {project}, stored in $AGENT_PROJECT.
  ```

  The project line only when there is a project. flume agent already sets AGENT_PROJECT.
- Remove the agent line from base/workflow.md, and from the shipped none and light workflow.md
  files (fl-vpvk). Remove the "You are working on the {project} project." sentence from
  base/project.md; the rest of project.md (read the project's CLAUDE.md) stays layered.
- Update the prime spec and its tests in the same change (rule specs-for-every-surface).

## Discussion (for reference, not authoritative)

The human, 2026-11-25 (to advisor), verbatim:

> ok, i'm a little confused on the exact issue with the H1 thing. This is behaving as designed, from what I can tell. from the base workflow, writing in my overlay
>
> ```
> # Flume workflow
>
> This is my overlay
> ```
>
> will replace "you are agent, {name}". That behavior is correct. So, I think the main problem here is probably that we should move that critical text outside of the workflow.md so that a user cannot override it; there is no good reason to override that text, IMO.
>
> Where is the text "you are working on project {project}" stored? Should we also move that text into flume itself? I think at least this text is universal:
>
> You are agent {name}, stored in $AGENT_NAME.
>
> You are working on project {project}, stored in $AGENT_PROJECT.

Advisor: the project sentence is in base/project.md today ("You are working on the {project}
project. Read that project's CLAUDE.md and follow its instructions."); flume agent sets
AGENT_PROJECT (src/cli/agent.ts).
