---
id: fl-dtyj
title: "README: install instructions for using Flume"
kind: docs
created: 2026-11-17
created_by: external:aide
repos: [flume]
changes: []
specs: []
blocked_by: []
related: []
---

## The ask

Make the README say how to install and run Flume, for a user (not a developer of it).

The human, 2026-11-17 ~6:15 AM ET (via aide): "ensure there are install instructions in the repo"

Today the steps exist but are scattered: `docs/release.md` ("Installing and updating at work") covers
clone, checkout a tag, `npm ci --omit=dev`, and `node bin/flume.js`; the README has only a "Develop"
section. Missing anywhere: how to get a `flume` command on PATH (package.json already declares
`bin: {flume: bin/flume.js}`, so e.g. `npm link` or `npm install -g .` from the checkout, or a shell
alias), and how to start the daemon and check it is up.

Add an `## Install` section to README.md, above `## Develop`, short (KISS):
- Prerequisites: Node 22.18+, git.
- Install: clone the public GitHub repo, optionally check out a release tag, `npm ci --omit=dev`
  (at work: through the Artifactory npm mirror, outside the sandbox).
- Put `flume` on PATH: one recommended way, verified to work (`flume version` prints the version).
- Start: how to start the daemon and see it running (whatever the current CLI provides).
- Update: `git pull` / checkout the new tag, then `npm ci --omit=dev` again.
- Link to `docs/release.md` for releases rather than repeating it.

Verify each command in a fresh clone before committing.
