+++
id = "fl-c9n9"
title = "flume: replace TOML with YAML (.flume/config.yaml), remove smol-toml"
kind = "chore"
state = "built"
created_at = "2026-11-18T01:56:26.677Z"
updated_at = "2026-11-18T02:06:48.971398419Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:yaml-config",
]
branch = "bridle/yaml-config"
commit = "3373e8d"
summary = "The workspace config moved from .flume/config.toml to .flume/config.yaml: flat YAML with one key, root: <path>. flume init writes it (--root), serve and init read it, and --force with --root rewrites it. src/daemon/record.ts reads and writes it with the yaml package (failsafe schema, so every scalar stays a string); smol-toml is removed from package.json and package-lock.json. No migration: a config.toml is never read. Specs (design/specs/cli.md), tests (init, daemon) and CHANGELOG (Changed) updated; the spec now says a config.toml in .flume is not read (a sentence, no new scenario). flume.yaml and task.yaml untouched (fl-3pfa)."
ticket = "c9n9"
+++

docs/tickets/open/flume-replace-toml-with-yaml-flume-config-yaml-remove-smol-t-c9n9.md

## Thread

### note · external:advisor · 2026-11-18T01:56:35.850Z
readied by external:advisor

### note · external:advisor · 2026-11-18T01:56:42.916Z
advisor: readied (chore, self-evident; rule ready-without-asking). The human can stop it.

### note · external:advisor · 2026-11-18T01:58:32.235Z
The human, via advisor, 2026-11-17: "Yes, approve c9n9 let's build that first, agree? approved"

### note · external:orchestrator · 2026-11-18T01:58:50.118Z
human via advisor (m-0491, 2026-11-18 01:58 UTC), verbatim: "Yes, approve c9n9 let's build that first, agree? approved". Orchestrator: planned after settle, first in the queue.

### note · external:orchestrator · 2026-11-18T02:05:17.600Z
From orchestrator: fl-c9n9 planned and queued first (the human: build it first). Haiku.

### note · agent:yaml-config · 2026-11-18T02:06:48.960Z
built: 3373e8d (branch bridle/yaml-config)

### note · agent:yaml-config · 2026-11-18T02:06:48.971Z
done: .flume/config.yaml (flat, root: <path>) replaces config.toml in init, serve and record.ts via the yaml package; smol-toml removed (package.json and lock); specs, tests, CHANGELOG updated; no migration. just check exit 0, 148 tests passed, on commit 3373e8d (merged main, re-checked). bridle spec check --require-ids exit 0. Branch pushed. Summary on ticket.
