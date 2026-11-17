---
id: fl-zdqr
title: "flume agent: only flume options before --, claude options must follow --"
kind: fix
created: 2026-11-17
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-xv3z]
---

## The ask

Before `--`, `flume agent` accepts only flume's own options and the prompt. Every Claude option goes after `--`.

The human, 2026-11-17 (verbatim): "flume agent only accepts options for flume, not claude, EXCEPT the interaactive prompt which we handle ourselves: `flume agent --add-dir ../lib "fix the bug"` should error with a message: --add-dir is not a flume option, pass claude options after --"

As built by fl-xv3z (5e072f1), flume passes unknown options before `--` to claude (agent.md: "SHALL pass every other argument to claude unchanged"), so `--add-dir ../lib "fix the bug"` sends the prompt to claude as a directory.

## Change

1. Before `--`, flume accepts only: `--name <n>` / `--name=<n>`, `--project <p>`, `--force`, `-h` / `--help`, and one bare argument (the prompt).
2. Any other argument starting with `-` before `--` is an error, exit 2, claude not started. The message, exactly (on stderr; `<arg>` is the option as typed, without any `=value`):

   ```
   flume: unknown option <arg>
   Claude options go after --, as in: flume agent "<prompt>" -- <arg> ...
   ```

   Example, for `flume agent --add-dir ../lib "fix the bug"`:

   ```
   flume: unknown option --add-dir
   Claude options go after --, as in: flume agent "<prompt>" -- --add-dir ...
   ```

   Wording by advisor at the human's request, 2026-11-17: "no, you word it now".
3. After `--`: unchanged from fl-xv3z. Claude's arguments, parsed by Claude's rules only to find the listed conflicts, passed to claude unchanged.
4. Usage: `flume agent [--name <name>] [--project <p>] [--force] [<prompt>] [-- <claude-arg>...]`.
5. Spec (design/specs/agent.md) and tests updated in the same change.

## Assumptions (assume-and-record)

- The prompt may still come after `--` when none was given before it (as built); two prompts in total stay an error. Alternative: prompt only before `--`. Change if the human wants it stricter.
- The -n/--name-before-`--` conflict check from fl-xv3z becomes this general error (`-n is not a flume option ...`).
