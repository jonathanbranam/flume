+++
id = "fl-mvu7"
title = "flume project add without a git URL: allowed, with a warning"
kind = "feature"
state = "integrated"
created_at = "2026-11-18T03:37:52.508Z"
updated_at = "2026-11-18T04:01:49.006534929Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:projnourl",
]
branch = "bridle/projnourl"
commit = "65b95b53f62774f5167cf934d674791a35a376ff"
summary = "flume project add takes a git URL or a bare name. A URL (has ://, the user@host:path form, or a path separator) is cloned as before. A name adds the project to flume.yaml with no url, commits it, clones nothing, warns on stderr and exits 0; --branch or --name with a name exits 2. flume check no longer reports a missing url (bad name still reported). project clone reports 'no url' for such a project. Changed: src/cli/project.ts, src/core/projects.ts (isGitUrl, checkProjects), design/specs/cli.md (r-b6a8 rewritten, s-8d3e, s-f003 added), design/specs/task-files.md (r-686f, s-a386), test/project.test.ts, CHANGELOG. Caveat: local paths are URLs, so a name cannot contain a path separator. Check: just check exit 0, 230 tests passed."
ticket = "mvu7"
+++

docs/tickets/open/flume-project-add-without-a-git-url-allowed-with-a-warning-mvu7.md

## Thread

### note · external:advisor · 2026-11-18T03:49:02.554Z
readied by external:advisor

### note · external:advisor · 2026-11-18T03:49:02.567Z
human via advisor: go. The human, 2026-11-17: "Please ready the other tickets you asked about earlier as well. They all look good". Readied.

### note · agent:projnourl · 2026-11-18T04:00:35.485Z
assumed (worker projnourl): (1) a local path counts as a URL, not a name: the ask's rule (anything not a URL is a name) would refuse /path/to/repo, and the tests and local repos need it; a name never has a slash or backslash, so no ambiguity. (2) The no-URL warning drops the design's 'or re-running with the URL': a re-run refuses a name already in flume.yaml, so the warning says to add a url to flume.yaml by hand. Tradeoff: a small wording change from the design. (3) A bare name with --name is refused (exit 2) rather than silently picking one. (4) project clone's skip reason is now 'no url' or 'bad name' (was one combined reason). (5) task-files r-686f and its s-a386 scenario updated in place: check reports only a bad name.

### note · agent:projnourl · 2026-11-18T04:00:40.311Z
built: 5ab3364fbc9362ff2d06439f7dece472410ffd28 (branch bridle/projnourl)

### note · agent:projnourl · 2026-11-18T04:00:40.322Z
done: flume project add takes a git URL or a bare name (no url: warns, exit 0, clones nothing; --branch/--name with a name exit 2); flume check no longer reports a missing url (bad name kept); project clone skips with reason 'no url'. just check exit 0, 230 tests passed; merged main, 5ab3364

### note · agent:projnourl · 2026-11-18T04:01:35.383Z
main moved (fl-eg2q landed); merged main into bridle/projnourl, no conflicts. just check exit 0, 233 tests passed (was 230). Tip 56930006db78b64ca01c8936cf72d151b098a923; ticket re-marked built on that sha.

### note · agent:manager · 2026-11-18T04:01:37.007Z
integrated: 65b95b53f62774f5167cf934d674791a35a376ff (branch bridle/projnourl)

### note · agent:projnourl · 2026-11-18T04:01:44.479Z
correction to my last message: the ticket was NOT re-marked built (refused: claim already released). The ticket shows integrated at 5ab3364 from your landing. Branch bridle/projnourl is now 56930006db78b64ca01c8936cf72d151b098a923 = my 5ab3364 plus a no-conflict merge of main (fl-eg2q); just check exit 0, 233 tests. I made no further code change. If you need the new tip for a landing, use --checked-commit 56930006db78b64ca01c8936cf72d151b098a923; otherwise nothing is needed from me. Tell me if you want me to re-claim and re-mark.

### note · agent:manager · 2026-11-18T04:01:49.006Z
cleanup: removed agent projnourl, origin branch bridle/projnourl, branch bridle/projnourl
