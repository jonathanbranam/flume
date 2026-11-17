# Releases and updating

Flume has no build step: `bin/flume.js` runs the TypeScript in `src/` directly (Node type stripping,
Node 22.18 or newer). A git checkout of a tag plus `npm ci --omit=dev` (for the one runtime
dependency, `yaml`) is the whole install.
Updates reach the work machine by `git clone` / `git pull` from the public GitHub repo only.

## Cutting a release (human or orchestrator)

1. On `main`, bump `version` in `package.json` (and run `npm install --package-lock-only` so
   `package-lock.json` agrees).
2. In `CHANGELOG.md`, move the `## Unreleased` entries under a new `## <version> - <date>` heading
   and leave an empty `## Unreleased` above it.
3. Commit, then tag the commit: `git tag v<version>` and push `main` and the tag.

## Installing and updating at work

- First install: `git clone <public flume repo>`, then `git checkout v<version>` (or stay on `main`).
- Update: `git fetch --tags`, then `git checkout v<new version>` (or `git pull` on `main`).
- After each clone or update, run `npm ci --omit=dev` (from the Artifactory mirror, outside the
  sandbox) to install the runtime dependencies (`yaml`).
- Run: `node bin/flume.js` (or `npm run flume`). `flume version` prints `<version> (<commit>)`.

## Using `flume agent`

After the install above, no daemon is needed. Put a `flume` shim on PATH, e.g. `alias flume='node <checkout>/bin/flume.js'`
(or `ln -s <checkout>/bin/flume.js ~/bin/flume`), with `claude` and (optionally) `tmux` on PATH.
Then `flume agent --name <name> [--project <p>] [<prompt>]` starts Claude as that agent; `flume agent list` shows them.
Optional template overrides go in `~/.flume/templates/base.md` and `project.md`.
Spec: `design/specs/agent.md`.

## Bug reports

`flume bug` prints a template that starts with the version line. Fill it in and email it; the
version and commit say which code produced the bug. See `design/specs/releases.md`.

## Deferred

No UI build pipeline: there is no UI yet (YAGNI). When one exists, ship its built output in the
repo or the tag so the work machine needs no build.
