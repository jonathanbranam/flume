# flume

A workflow tool for agents

## Use

Clone, `npm ci --omit=dev`, and put `bin/flume.js` on PATH as `flume` (symlink or alias). Then
`flume agent <name> [--project <p>]` launches Claude Code as a named agent (needs `claude` on PATH;
`tmux` optional), `flume agent list` lists agents, `flume prime <name>` prints the prime text.
See `docs/release.md` and `design/specs/agent.md`.

## Develop

Needs Node 22.18 or later (it runs the TypeScript sources directly, so there is no build step; run `npm ci --omit=dev` after a clone or update for the runtime dependency).

- Install: `npm ci`
- Check (typecheck, lint, tests, bridle spec check): `npm run check` or `just check`
- Run: `node bin/flume.js --help`, `node bin/flume.js version`
