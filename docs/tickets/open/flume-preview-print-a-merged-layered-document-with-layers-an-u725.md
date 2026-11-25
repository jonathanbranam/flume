---
id: fl-u725
title: "flume preview: print a merged layered document, with --layers and --json"
kind: feature
created: 2026-11-25
created_by: external:orchestrator
repos: [flume]
changes: []
specs: []
blocked_by: [fl-mv4r]
related: [fl-mv4r]
---

## The ask

Split from fl-mv4r (workflow layers) so the merge itself can land first; fl-vpvk needs the merge, not the preview. The human asked for this in fl-mv4r ("I definitely want the check method and a preview. Definitely need a preview."); readied with fl-mv4r, the human, 2026-11-25, verbatim (via the flume advisor): "We need to ship workflow layers now then."

Build the Preview part of fl-mv4r's Design, as written there:

- `flume preview workflow`, `flume preview phases`, `flume preview project`, `flume preview first-prompt`, `flume preview role R`, `flume preview guide G`, `flume preview template PART`, each with `--project P`. Prints the merged document.
- `--layers` marks which file each section came from.
- `--json` gives the sections with their source.
- A layer error prints file, line and heading to stderr and exits 1, the same as prime.

## Brief

- Use the merge library fl-mv4r adds. Don't change the merge rules here.
- Likely files: src/cli/program.ts (the command), a new src/cli/preview.ts, the merge module from fl-mv4r, and the CLI spec/help.
- Done when: each preview target prints the same text prime, instructions and guide use; `--layers` and `--json` show each section's source file; tests cover one example per flag and the error exit; `just check` (or the project's check) is green.
- Model: Sonnet is fine; Haiku would also do, since the merge already exists.
- Out of scope, not yet: anything fl-mv4r's Design doesn't name.
