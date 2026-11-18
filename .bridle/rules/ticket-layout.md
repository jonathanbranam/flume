---
id: ticket-layout
severity: must
roles: [orchestrator, project-manager, manager, advisor, aide]
---
Every flume ticket body has three sections, in this order, after the front matter:

1. `## The ask`: short. What is wanted and why, in a few lines.
2. `## Design`: the currently agreed design, and only that. Keep it current: when a decision
   changes, edit the design in place. No narration, no history, no restatements ("the human then
   said...", "as above"). Subsections (`###`) as needed, e.g. assumptions or what is not in the
   ticket.
3. `## Discussion (for reference, not authoritative)`: the narrative: the human's words verbatim,
   drafts, open points, decisions as they were made. Restatements are fine here. When it and the
   design disagree, the design wins.

A worker builds from The ask and Design; Discussion is background.

Examples: fl-3pfa, fl-x6xn, fl-fu3v.

Why: the human, 2026-11-17 (via advisor, verbatim): "the design at the top is the currently
agreed-upon design; keep it current and DO NOT include narration or restatements in the design.
The discussion section can include the discussion narrative with restatements as a reference."
And: "make this ticket structure the standard for this repo."
