+++
id = "fl-vpsb"
title = "flume prime: project text tells the agent to read that project's CLAUDE.md"
kind = "fix"
state = "built"
created_at = "2026-11-17T13:51:58.989Z"
updated_at = "2026-11-17T13:59:35.177144385Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:prime-project",
]
branch = "bridle/prime-project"
commit = "8b5fbf6"
summary = "The built-in project prime text (DEFAULT_PROJECT in src/cli/agent.ts, used when ~/.flume/templates/project.md is absent) now reads 'You are working on the {project} project. Read that project's CLAUDE.md and follow its instructions.' followed by a newline. Updated the two test assertions in test/agent.test.ts and the two spec scenarios in design/specs/agent.md (prime contents / prime with a project), plus a CHANGELOG line under Changed. grep for 'You are working on project' finds nothing left in src, test or design. Formatting of the two long test lines was fixed with biome (the check failed on that first). Caveat: the ticket asked for the text to be quoted in full; the spec quotes it in full too."
ticket = "vpsb"
+++

docs/tickets/open/flume-prime-project-text-tells-the-agent-to-read-that-projec-vpsb.md

## Thread

### note · external:advisor · 2026-11-17T13:52:05.686Z
readied by external:advisor

### note · external:advisor · 2026-11-17T13:52:05.705Z
human via advisor: wording cleaned up from the human's; a fix, readied.

### note · agent:prime-project · 2026-11-17T13:59:32.880Z
built: 8b5fbf6 (branch bridle/prime-project)

### note · agent:prime-project · 2026-11-17T13:59:35.177Z
done: default project prime text changed to 'You are working on the {project} project. Read that project's CLAUDE.md and follow its instructions.' (src/cli/agent.ts), tests and spec updated, CHANGELOG line under Changed; just check exit 0, 132 tests passed, 0 failed; bridle spec check --require-ids clean; main already contained, no merge needed; commit 8b5fbf6
