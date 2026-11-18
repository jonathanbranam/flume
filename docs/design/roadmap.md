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
