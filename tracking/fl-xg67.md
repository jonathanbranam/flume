+++
id = "fl-xg67"
title = "Move the CLI to a TypeScript CLI package: --help everywhere, generated usage"
kind = "arch-revision"
state = "open"
created_at = "2026-11-19T18:53:33.168Z"
updated_at = "2026-11-19T18:57:48.830029176Z"
created_by = "external:advisor"
watchers = ["external:advisor"]
ticket = "xg67"
+++

docs/tickets/open/move-the-cli-to-a-typescript-cli-package-help-everywhere-gen-xg67.md

## Thread

### note · external:advisor · 2026-11-19T18:56:35.690Z
Research by advisor, 2026-11-19: both packages tried in a scratch project (Node 26, commander 15.1.0 with @commander-js/extra-typings 15.1.0, @stricli/core 1.3.0), with flume-shaped commands (init --root, task show <id> --json, agent).

Commander with extra-typings:
- --help on every command and subcommand, exit 0; also with a required argument missing (task show --help).
- help <command> and task help show built in, printing the same as --help; exit 0 once exitOverride maps commander.help to 0.
- Usage errors (unknown option, unknown command, missing argument) go to stderr with the usage after them; exitOverride gives exit 2.
- Types: opts.root is string | undefined; assigning it to a number fails tsc --strict.
- flume agent: commander's own pass-through loses where -- was and mixes unknown flags into the positionals. Working approach: commander routes and prints help (usage line and a note set by hand), and the action hands the raw arguments after "agent" to flume's existing agent parser (r-a2c0 unchanged). Tried: --project fl rook -- --model opus -p hi and rook "pick up" --model opus arrive intact.

Stricli:
- --help on every command and subcommand, exit 0; help text good.
- No help <command>: flume would write it.
- Usage errors exit 251 or 252; determineExitCode covers only errors thrown by a command, so exit 2 needs a wrapper that remaps the code after run.
- -- works with scanner.allowArgumentEscapeSequence.
- Unknown flags are always refused ("No flag registered for --model"), so flume agent rook --model opus (allowed by r-a2c0) fails; agent would have to bypass Stricli or the spec change.

Clipanion: out (latest is 4.0.0-rc.4 from 2024, and it depends on typanion).

Recommendation: Commander with extra-typings. It meets every requirement in the Design with configuration only; Stricli needs a help command, an exit-code wrapper and a way around it for flume agent. Stricli's edge (types from the function signature, an injected context for tests) does not outweigh that. The human, 2026-11-19: "I'm leaning commander though".

### note · external:advisor · 2026-11-19T18:57:28.742Z
readied by external:advisor

### note · external:advisor · 2026-11-19T18:57:28.762Z
Readied by human via advisor: the human chose Commander ("yes commander"); Design updated.

### note · external:orchestrator · 2026-11-19T18:57:48.830Z
From orchestrator: noted. fl-jbxt is already dropped (superseded by xg67, human via advisor). xg67 stays pending until the human's go is relayed; when it comes I'll plan it to run alone, Sonnet, with the Artifactory note in the brief.
