---
id: fl-na9m
title: "Epics: exempt from the workflow; closing an epic refused while a child is open"
kind: feature
created: 2026-11-18
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-fu3v, fl-4tx8]
---

## The ask

Two small rules for epics, from the human (2026-11-18, to advisor): "An epic is exempt from the workflow, and you can't resolve or close an epic unless all the tickets are resolved. That's basically it for now." The wider epic design (its own workflow, its body, the roadmap) stays open in docs/design/epics.md and is not built here.

## Design

### An epic is exempt from the workflow

- A task of kind epic has no phase: a new epic's task.yaml has no phase field, and flume task show, flume task list (phase column empty) and the API (phase null) show none.
- The workflow commands refuse an epic (exit 1, nothing changed, message: epics have no workflow): flume task phase, flume task instructions, flume task next, flume task done, flume task skip. The API answers 400 for the same requests.
- flume task claim and assign still work on an epic (an epic may have an owner); claim prints no instructions for an epic, only a line saying epics have no workflow.
- The rule that an agent must fetch instructions before advancing (fl-4tx8) never applies to an epic, since it has no phase to advance.

### Closing an epic needs every child resolved

- flume task close on an epic with any open child is refused (exit 1, nothing changed); the message names the open children's IDs and says to close each one first. The API answers 409 with the same message.
- An epic with no children, or with every child resolved, closes as before.
- No automatic closing of children. To close them all, loop over flume task list --parent ID --json (an agent or a script).

### Listing an epic's children

- Exists: flume task list --parent ID (open), with --all for resolved too, and --json. Add a scenario binding --parent with --all and --json if none does.

### Assumed (advisor; change if wrong)

- An existing epic with a phase field: the field is ignored (shown as none) and flume check does not report it; changing a task's kind to epic removes its phase, and changing an epic to another kind sets phase proposal. Alternative: refuse kind changes to and from epic. Chosen because it keeps update simple and the data honest.
- Reopening an epic is not gated. Adding a child to a resolved epic is not refused here (YAGNI).
- An epic's parts (flume task write/read) are allowed: the body is where an epic's outcome and "Done when" go for now.
- The human is gated by the close rule like anyone else: it is about the data, not about agents.

## Discussion (for reference, not authoritative)

The human, 2026-11-18 (to advisor), verbatim:

> Okay, I don't think we need to build any of this now, but let's make a ticket for epics and talk through how they should work. Don't build it yet. I'm not sure, but the epics should have a different workflow, but we're not going to decide what that is right now.
>
> I think, for maybe one thing, we could build just that: we could say that epics don't have a workflow. In any case, they don't follow the same workflow. What I'm not sure is if we make a workflow for them, or if we just wait until we have customizable workflows and then use that functionality to design a proper workflow for an epic.
>
> [...] There's a product manager role definition that talks about what an epic should look like, like what the body and the epic ticket task itself should look like. I would use that as a starting point here.
>
> The main thing I think we could say is that they don't go through this workflow, and then they shouldn't be able to close an epic if it has tickets on it. All the tickets would need to be resolved in some way to close the epic. Closing an epic or resolving an epic should be refused unless the tickets are all resolved. I think that's it for now. It'll just refuse, and then you have to resolve the ticket separately. There's no automatic way to resolve them all. Just loop through them.
>
> You should be able to, if you can't, list all the tickets for an epic, and that should support JSON as well. The agent can loop through it, or I could loop through it in a script even.
>
> Let's make a design document for epics and put all of this in there, and then make a ticket that just does these small things. An epic is exempt from the workflow, and you can't resolve or close an epic unless all the tickets are resolved. That's basically it for now. I think that's fine. I think that's enough.

Advisor: listing already exists (flume task list --parent ID --all --json). Bridle's product manager role definition was not in the installed workflow; asked bridle's aide for it. Its epic shape goes into docs/design/epics.md, not this ticket.

The human said "Don't build it yet": this ticket stays pending until they say go.
