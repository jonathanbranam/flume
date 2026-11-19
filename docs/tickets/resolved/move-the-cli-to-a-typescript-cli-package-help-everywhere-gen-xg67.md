---
id: fl-xg67
title: "Move the CLI to a TypeScript CLI package: --help everywhere, generated usage"
kind: arch-revision
created: 2026-11-19
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-jbxt, fl-q6cm]
resolved: 2026-11-19T19:21:02Z
---

## The ask

Replace flume's hand-rolled argument parsing with a good TypeScript CLI package, so every command
and subcommand gets `--help`, generated usage text and consistent errors for free, instead of each
command remembering to add them. Takes over fl-jbxt (every command takes --help).

## Design

### Package

Commander with `@commander-js/extra-typings` (commander 15, Node 22.12 or later; flume needs
22.18). Both are runtime dependencies with no dependencies of their own.

- `exitOverride`: help and version exit 0; every usage error exits 2, with the message and the
  usage after it on standard error (`showHelpAfterError`).
- Commander's help command gives `flume help <command> [<subcommand>]`, printing exactly what
  `--help` prints, with exit 0.
- `flume agent`: commander routes it and prints its help (usage line and a note that unknown
  options and everything after `--` go to claude), and its action passes the raw arguments after
  `agent` to flume's own agent parser, unchanged (agent spec, r-a2c0). Commander's
  `passThroughOptions` is not used: it loses where `--` was.

### Scope

- Every command in `src/cli/` moves to the package: its arguments and options are declared in
  Commander and the hand-rolled parsing loops, usage strings and per-command `--help` code are
  removed. What each command does does not change.
- `flume agent` passes arguments it does not recognize through to `claude`, in order, and `--`
  stops consumption (agent spec, r-a2c0). This must still work; check it first, before the other
  commands move.
- Specs that pin usage text change to the generated text where needed, in the same change.
- A cli.md requirement and one scenario: `--help` on every command and subcommand listed in the
  top-level help and each group's help prints that command's usage and exits 0, doing nothing
  else (so a new command without it fails the test). The gaps found on main are listed on
  fl-jbxt.
- `flume help <command> [<subcommand>]` and the help topics are fl-q6cm, built on this.

## Discussion (for reference, not authoritative)

### The human's words, 2026-11-19 (to advisor, verbatim)

"I can't beleive --help isn't normal here - are we using a good CLI package or hand-rolling all of
this??"

"we should use a nice typescript CLI package"

### What flume has today

Hand-rolled: each file in `src/cli/` (about 1,600 lines) walks its own args array and prints its
own usage string, so `--help` exists only where a worker added it. The only runtime dependency is
`yaml`. No decision was ever recorded on a CLI library (docs/design/stack.md chose Node only).

### Decision

The human, 2026-11-19: "yes commander", after the advisor's trial of both (comment on the
thread).

### Candidates (advisor, 2026-11-19, from a web search)

- Stricli (`@stricli/core`, Bloomberg): TypeScript-first; flag types inferred from the command's
  function; zero dependencies; generated help; route maps for subcommands. Smaller and newer
  community. Strict about unknown flags, so `flume agent` pass-through needs checking.
  https://bloomberg.github.io/stricli/docs/getting-started/overview
- Commander with `@commander-js/extra-typings`: the most used Node CLI library, zero
  dependencies, types inferred from option definitions via the extra-typings package; built-in
  `help <command>` and pass-through options (`passThroughOptions`, `allowUnknownOption`). Less
  strictly typed than Stricli; exit code for usage errors needs `exitOverride` to stay 2.
- Clipanion (Yarn's): type-safe, no runtime dependencies, class-based commands; heavier style.
- Ruled out: `util.parseArgs` (Node built-in) parses flags only, with no subcommands or help, so
  the failing part would stay hand-rolled; yargs and oclif bring dependencies.

Advisor recommends Stricli, if a quick check shows `flume agent` pass-through works with it
(everything after `--`, and unknown flags, to claude); else Commander with extra-typings.
