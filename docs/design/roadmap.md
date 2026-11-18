# Roadmap

Status: design notes, started 2026-11-18. Decided so far: keep what we have for now, and the
items under "Decided" below. The human (2026-11-18): "I don't think what we have is okay for now, but it'll probably
change pretty significantly. I was about to say we could just tear out everything we have. I'm not
too concerned about having roadmaps in there right now, but I do want to." (Read with the rest of
the talk: what exists stays for now; the roadmap is to be revised based on bridle's product
manager work.) Epics: docs/design/epics.md.

## What flume has today (ticket fl-s52x, roadmap spec)

- One hand-edited file, `roadmap.md` in the flume root. Flume reads and checks it, never writes it.
- Each Markdown heading is a section (Now, Next, Later, Done are usual; any heading works). Each
  list item with a wiki link to a task file is an entry; text after the link is a note. The order
  written is the plan.
- `flume roadmap show` (and `GET /api/roadmap`, `--json`) prints sections with each task's ID,
  state, title and note. `flume roadmap check` (also in `flume check`) reports links to no task and
  resolved tasks outside Done without a note.
- Any task may be listed; nothing ties the roadmap to epics, projects or themes.

## The brief (docs/brief/project-note.md)

- The roadmap is universal: one per tasks repository, shared by its projects, "broken up by
  module" (`roadmap [show|check]`: "shared; one section per project or module").
- Only epics go on the roadmap; the UI shows "my roadmap".

## Bridle's product manager work (the starting point)

From bridle's trial (its docs/notes/roadmap.md and docs/notes/product-manager-trial.md, and
bridle's aide, 2026-11-18). It lives only on the main bridle project.

- **Terms** (the human, 2026-10-09): the roadmap **orders epics**, grouped by **theme** for
  reading. An epic has an outcome and a "Done when", tagged to one theme. A theme is a lasting area
  (a slug, no ID, may never finish); epics and loose tasks are tagged to one.
- **Membership** (the human, 2026-10-10): a ticket is in an epic only if it is on the path to the
  epic's "Done when"; uncommitted ideas and investigations stay in the theme.
- **Order binds the work**: "a roadmap no tool reads is advice, not a plan" (trial lesson 14). The
  queue is ordered by epic rank, then priority; a task outside the current epic waits unless the
  human says otherwise.
- **Status per epic**: bridle's roadmap kept an epic status table, in the human's order: epic,
  status, and what it needs from the human (a decision, or hands-on).
- **Products** (the human, 2026-10-09): "a collection of projects (1:1 with github repos) that share
  a single roadmap and product manager". A product manager's scope is a product, not a project or
  the machine.
- The roadmap was a notes file kept by hand by the product manager, "treated as a database".

### Bridle's tickets-lite proposal (local copy: docs/brief/tickets-lite.md; bridle main d61fb607 docs/portable/tickets-lite.md)

A proposal for other tools, not how bridle works; flume's roadmap today follows it, minus the
epic rules. Its roadmap section:

- One file that sequences epics; the list order is the plan; edited by hand (or the CLI) and
  reviewed like any change.
- **Only epics** go on it; "a lone ticket that matters enough becomes an epic of one".
- Now / Next / Later / Done are enough. **Numbers in Now and Next are the sequence; Later is
  unordered on purpose.**
- A checker verifies: every entry is an epic that exists; **every open epic appears exactly once**;
  Done entries are resolved.
- For machine-readable order without the file, add `blocked_by` between epics; keep the file as
  the human view.
- Its epics: "An epic resolves when its children are resolved and its goal is met; resolving it is
  a person's decision, not automatic." Order inside an epic is `blocked_by` between children, only
  where it matters. Too big: split into two epics and order them on the roadmap.

Differences from flume today: flume's roadmap takes any task, does not require every open epic to
be listed, and has no numbered-sequence rule.

## Decided (the human, 2026-11-18)

- **The roadmap lists epics.** In general it organizes epics (80-90% of entries), but it is not
  strict: a single task on it is fine. The human: "I'm not convinced that it has to be an epic
  ... I don't think I care. That's fine, but in general, we're organizing epics on the roadmap."
  (So not tickets-lite's "only epics" rule, and no "every open epic listed" check for now.)
- **Not organized by project.** The roadmap is not ordered or sectioned by project; drop that
  idea from the brief. Projects come in through epics, which may span them
  (docs/design/epics.md).

## The problem the roadmap must solve (the human, 2026-11-18)

Verbatim:

> with the agents, we tend to get very short-sighted and get distracted on recent issues
> (following and making new tickets for things that came up during the last issue). We then lose
> sight of the overall picture, the bigger picture of where we're going. I end up with an epic
> that languishes for a few weeks, never gets done, because these side tickets come up, and then
> they go in the queue in front of the epic that should be worked on. The other thing that happens
> is that epics end up getting blocked waiting for me, and my attention is very limited compared
> to the number of projects I have. [...] An epic will stall out completely while I work on other
> things that are easier to decide.
>
> The whole idea of getting the roadmap system in was to help focus and finish things. The main
> thing here is I want at least the main agents that I'm planning with to focus really closely on
> the roadmap, not on what I said last or the individual tickets or things like that. To say,
> "Hey, this is the highest priority epic in the roadmap, and it's blocked on these three things.
> That's what we should work on: not this side ticket, not this bug, not these tickets that are on
> some epic that aren't even in the roadmap or are way low priority."

Two failures: side tickets jump ahead of the epic; the epic stalls waiting on the human, whose
attention goes to what is easiest to decide instead of what is most important.

The human's questions (same day): how do roadmap order, epic order and priorities decide the work
actually done? With an order of epics and an order of tasks within each, how are the two compared?
With P0-P3, when do the P3s get done, and do priorities compare across epics?

## Proposal (advisor, 2026-11-18; not agreed)

### Order decides the work; flume derives "what's next"

- Epics are ranked on the roadmap; tasks are ranked within their epic. Ranks compare only within
  their level: the epics' order settles any comparison between tasks of different epics.
- The work order is derived, never kept by hand: the Now epics in roadmap order, each epic's tasks
  in their order; skip what is blocked, already held, or not in the asking agent's project; take
  the first left. (Close to bridle's "epic rank, then priority".)
- With several agents on several projects, an agent with nothing it can take in the top epic falls
  through to the next epic. Epic 2 does not wait for epic 1 to be done, only for it to have
  nothing that agent can take. (Choice for the human: this, or strict finish-first.)
- Now limits what is in flight: Now epics run side by side in rank order; Next and Later do not
  start. Focus means keeping Now short.

### Priority is an exception, not a sort key

- No P0-P3: under strict order, low levels are never done, and levels mean different things in
  different epics. One flag instead: **urgent**, which goes ahead of every epic (a real breakage,
  something blocking the human). Everything else is its position; work that does not matter yet
  is unplaced, honestly "not now".
- A task with no epic goes on the roadmap like an epic of one, or waits until the Now epics have
  nothing an agent can take, unless urgent.

### Side tickets do not jump the queue

- A ticket filed during other work lands **unplaced**: in no Now epic, not urgent. It waits.
- Only the human places a ticket into a Now epic or marks it urgent. An agent may propose it, with
  a reason, on the ticket.
- Planning agents, when the human raises a side issue: file it unplaced and say where it sits
  against the top epic ("filed; it waits behind epic X unless you place it").

### The top epic's blockers on the human come first

- A task can be marked as waiting on the human (a decision, a review, a go), with the ask written
  so it can be answered quickly: the question, the options, a recommendation.
- `flume roadmap focus` (with `--json`): the Now epics in order, each with its "Done when", its
  progress (resolved of all children), what waits on the human (in roadmap order) and what agent
  work can be taken now. `flume prime` for planning roles opens with it.
- The human's queue is ordered by the roadmap, not by ease or recency: the top epic's decisions
  first.
- An epic in Now with no progress for some days is called out in the focus view. If the human
  cannot attend to it, it moves out of Now, rather than stalling there.

### Planning agents lead with the roadmap

- A rule for the roles the human plans with: open with the focus view ("the top epic is X; it is
  blocked on these three things"), steer back to it, and never ready side work ahead of the top
  epic without the human placing it.

## Open (to talk through)

- **Where order lives**: a hand-edited file (today), or a rank on each epic that flume keeps, so
  tools can read and change it (`roadmap move`, the UI dragging).
- **Themes**: whether flume adds a theme field, and whether the roadmap groups by it.
- **One roadmap or several**: one per tasks repository, or per product. (Sections per project
  are dropped, above.)
- **Does the order bind the work**: whether `flume task list` or the next-task choice follows epic
  rank, as bridle's lesson asks.
- **Status from the tasks**: an epic's progress and what it needs from the human, derived from its
  children instead of written by hand.
- **Who keeps it**: a product manager role (bridle's trial) or the human by hand.
