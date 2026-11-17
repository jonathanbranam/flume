# flume

A workflow tool for agents

## Develop

Needs Node 22.18 or later (it runs the TypeScript sources directly, so there is no build step; run `npm ci --omit=dev` after a clone or update for the runtime dependency).

- Install: `npm ci`
- Check (typecheck, lint, tests, bridle spec check): `npm run check` or `just check`
- Run: `node bin/flume.js --help`, `node bin/flume.js version`
