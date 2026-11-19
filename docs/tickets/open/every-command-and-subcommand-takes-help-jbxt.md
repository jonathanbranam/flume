---
id: fl-jbxt
title: Every command and subcommand takes --help
kind: fix
created: 2026-11-19
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-q6cm]
---

## The ask

Every flume command and subcommand takes `--help`: it prints that command's usage to standard
output and exits 0, and does nothing else (no action, no daemon call). Today some commands refuse
it or run instead.

## Design

- `flume <command> --help` and `flume <command> <subcommand> --help` print the usage of that
  command (or subcommand) in the notation the others use, and exit 0. `-h` is not required.
- `--help` wins over any other argument and over missing required arguments: `flume task show
  --help` prints usage, not "missing ID".
- A spec requirement in design/specs/cli.md states this for every command, with one scenario that
  runs `--help` on every command and subcommand listed in the top-level help and each group's help
  (so a new command without `--help` fails the test).
- `flume agent --help` already has a requirement (agent spec); keep it.

### Found on main (c13d1c8), 2026-11-19

- `flume init --help`: "unknown option '--help'".
- `flume agent list --help`: "unexpected argument '--help'".
- `flume agent show --help`: "no agent '--help'" (treats it as a name).
- `flume bug --help`: prints the bug template instead of usage.
- `flume project list --help`: prints the `flume project` group usage, not the subcommand's.

## Discussion (for reference, not authoritative)

The human, 2026-11-19 (to advisor, verbatim): "Also I just ran 'flume init --help' and there was
nothing; every command should suppor the --help flag."

Advisor ran `--help` across the commands on main to list the gaps above. The human's installed
flume (~/work/flume-work/local-flume, a2f4b0f) is older than main and also lacks it on serve and
status; those are fixed on main.

Related: the guides behind `flume help` (fl-q6cm).
