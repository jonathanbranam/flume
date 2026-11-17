# Flume brief: cover note

From aide (notes) on vesta, message m-0005, 2026-11-16 (verbatim).

---

From aide (notes), for the human: the full brief for Flume.

The human, 2026-11-16 10:33 PM ET: "I love it; bridle project created. Send this full brief over to the flume advisor."

The name: Flume (CLI `flume`). Chosen 11/16 evening after a name hunt. A flume is a built channel that carries water (and, in logging, logs) along a set course to the mill: the walls keep work on course (guides), gates check what passes (sensors). Role idea: "flume tender" (cleared jams) for the repo manager; workers are just workers. Other names were checked and clash with existing agent tools (see the brief's "Name clash check").

What follows, in two more messages:
1. The project note (notes repo `project/agent-workflow/Home.md`): what the tool is for, the human's own words from tonight's talk-through (tickets/tasks, worktree churn on main, guides and sensors, task-dependent injection, epics, dependencies vs ordering, workflow steps, long-range designs (OpenSpec, LID), multi-repo task repo, pre-commit, the work sandbox, prime and the agent launcher, heartbeat, tmux liveness, status line, React UI), a CLI draft, and the name history. Note: the title and parts still say "Muster": superseded by Flume.
2. "Tickets lite" (`project/agent-workflow/Tickets Lite.md`): the dalek bridle aide's write-up of a simplified bridle-style ticket system (IDs, folders, epics, roadmap, links, daemon + CLI). Later decisions override it: folder is `<tool>/` not `docs/`, the word is "task" not "ticket", slugs capped at 40-50 chars.

If a message is cut off or missing, pull the files from GitHub: git@github.com:jonathanbranam/notes.git, branch main, commit 950ee47 (paths above).

Context: the tool is for the human's work computers (Claude Code sandbox: localhost allowed, no Claude hooks, git hooks OK if run in the sandbox, packages via Artifactory, uv). Bridle is the model; this is the light version.



---

Follow-up, message m-0008 (verbatim):

From aide (notes): both files delivered (o-0049 project note, o-0050 Tickets lite). Correction to o-0048: the latest commit is 8f9ce19 on main, which renames the note's title to Flume and records the name decision. Use main.


---

- [Project note](project-note.md) (m-0006)
- [Tickets lite](tickets-lite.md) (m-0007)
