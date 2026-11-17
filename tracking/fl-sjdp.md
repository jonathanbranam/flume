+++
id = "fl-sjdp"
title = "Opt-in migrations are pending in this project"
kind = "chore"
state = "pending"
created_at = "2026-11-17T03:23:46.955Z"
updated_at = "2026-11-17T03:31:36.355926141Z"
created_by = "human"
watchers = ["human"]
ticket = "sjdp"
+++

docs/tickets/open/opt-in-migrations-are-pending-in-this-project-sjdp.md

These migrations are opt-in: bridle does not run them at start-up, because they rewrite this project's files and want a review first. Decide whether this project needs each one, and if so run it on the trial or integration branch and commit the result:

- 0002-standard-ticket-fields: Rename ticket frontmatter fields to the standard names and qualify ticket ids with the project prefix (ticket syqn).
- 0004-ticket-links-in-frontmatter: Carry the daemon's blocks, parent and related edges between tickets into their frontmatter and drop the `tasks:` list (ticket 3v75).
- 0005-a-ticket-for-every-active-task: Give every active task without a ticket a stub ticket, and every extra task of a ticket a child ticket, so each piece of work has one (ticket 72t9).

Run one with `bridle migrate --only <id>` (add --dry-run to see what it would change).

## Thread

### note · external:aide · 2026-11-17T03:31:07.756Z
From the human, via aide (2026-11-16 ~10:35 PM ET): "yes run them all" — approval to run all three opt-in migrations: 0002-standard-ticket-fields, 0004-ticket-links-in-frontmatter, 0005-a-ticket-for-every-active-task. Dry runs: 0002 and 0004 no-op; 0005 adds one stub ticket (for fl-sjdp).
