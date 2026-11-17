---
id: built-for-the-work-sandbox
severity: must
roles: [orchestrator, project-manager, manager, worker, reviewer, advisor]
---
Flume runs on the human's work computers, under a Claude Code sandbox. Design for it:

- **No Claude Code hooks.** Flume must never depend on them. Reach agents through the CLI output,
  `flume prime`, skills that run the CLI, CLAUDE.md, and git hooks (git hooks are allowed; what
  they call must run inside the sandbox).
- **Localhost works**, so the daemon is fine. Public package registries are blocked; packages come
  through an Artifactory mirror, installed outside the sandbox.
- **Never start the daemon from Flume.** No command auto-starts or spawns it; only the human runs
  `flume serve`. A command that needs the daemon and finds none says so and tells the human to run
  `flume serve`. A daemon started by Claude would be refused or sandboxed.
- **Updates arrive by `git clone` / `git pull` from the public GitHub repo only.** Nothing is ever
  pushed from work. Each update must work from a pull with as little build as possible.
- **Bugs come back by email**: the human files them at work and sends them through bridle. Every
  report must be traceable to a version (`flume version`).
- **Rebase is likely blocked at work**: don't rely on destructive git operations in Flume's own
  workflow.

Why: the human, 2026-11-16: "1. work on it using bridle 2. file bug reports at work 3. email those
to you using bridle 4. when the update ships, then update at work." and "I can directly reach
public github and clone, but I'm not allowed to push at all". Sandbox facts from
`docs/brief/project-note.md`. (ticket fl-jc84) On the daemon, the human, 2026-11-17 (via advisor):
"don't start a daemon ever" and "a daemon started by claude would be refused or sandboxes"
(ticket fl-qgr7).
