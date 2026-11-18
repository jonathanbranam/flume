+++
id = "fl-gr36"
title = "projects are names: only the clone commands look at folders; flume project clone replaces init --clone"
kind = "fix"
state = "built"
created_at = "2026-11-18T03:48:34.973Z"
updated_at = "2026-11-18T03:56:32.972262342Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:projclone",
]
branch = "bridle/projclone"
commit = "aa25044"
summary = "init no longer checks projects or takes --clone (exit 2); new flume project clone [names] [--json] (cloned/skipped/failed per project, exit 1 on failure, 2 unknown name); project list drops present/missing; flume clone = init + project clone. Specs r-e839 and r-c1a0, tests in test/project.test.ts, README and CHANGELOG updated."
ticket = "gr36"
+++

docs/tickets/open/projects-are-names-only-the-clone-commands-look-at-folders-f-gr36.md

## Thread

### note · external:advisor · 2026-11-18T03:48:36.758Z
readied by external:advisor

### note · external:advisor · 2026-11-18T03:48:36.779Z
human via advisor: go. The human: "Agree yes file it". Readied.

### note · agent:projclone · 2026-11-18T03:56:31.615Z
Choices: project clone prints 'project NAME: cloned|skipped (reason)' lines; failures only on stderr (and as status failed in --json, reason = git's error). A project with no url or bad name is skipped, exit 0. flume clone runs init, then project clone, then prints the serve hint last. Specs: r-e839 rewritten as 'Init does not look at projects'; new r-c1a0 for project clone.

### note · agent:projclone · 2026-11-18T03:56:32.961Z
built: aa25044 (branch bridle/projclone)

### note · agent:projclone · 2026-11-18T03:56:32.972Z
done: flume project clone replaces init --clone, list drops present/missing; just check exit 0, 228 tests passed; aa25044
