+++
id = "fl-a4nc"
title = "flume --version replaces flume version (GNU standard)"
kind = "fix"
state = "built"
created_at = "2026-11-17T14:09:15.266Z"
updated_at = "2026-11-17T14:16:47.613782244Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:version-flag",
]
branch = "bridle/version-flag"
commit = "1d5fa9c"
summary = "flume --version replaces the flume version subcommand. --version prints the same line (version and git commit), exit 0; version is now an unknown command (exit 2), no alias, no -V. Top-level help lists --version and --help under Options. Changed: src/cli/main.ts, test/cli.test.ts (s-129b, s-9b9e, s-90c6, s-e49f now use --version; new s-7662 covers version as unknown command), design/specs/cli.md (r-5465 + new scenario s-7662), design/specs/releases.md (r-3f8a, r-4221 wording), README.md, docs/release.md, .bridle/rules/built-for-the-work-sandbox.md, CHANGELOG (Changed). The flume bug template has no 'flume version' text (it prints a Version: line), so it needed no change. Historical resolved/ tickets still mention flume version and were left as they are. Check: just check exit 0, 137 tests passed (run on the tree before the commit, identical to 1d5fa9c). spec check --require-ids clean. Branch merged with local main (already up to date)."
ticket = "a4nc"
+++

docs/tickets/open/flume-version-replaces-flume-version-gnu-standard-a4nc.md

## Thread

### note · external:advisor · 2026-11-17T14:09:22.274Z
readied by external:advisor

### note · external:advisor · 2026-11-17T14:09:22.292Z
human via advisor: the human's call; a fix, readied.

### note · external:orchestrator · 2026-11-17T14:15:33.214Z
From orchestrator: fl-a4nc planned and queued, Haiku. fl-hh6x follows after settle (next tier: both edit help/USAGE).

### note · agent:version-flag · 2026-11-17T14:16:46.122Z
built: 1d5fa9c (branch bridle/version-flag)

### note · agent:version-flag · 2026-11-17T14:16:47.613Z
done: flume --version replaces flume version; check exit 0, 137 tests passed; spec check clean; branch pushed and contains main; 1d5fa9c
