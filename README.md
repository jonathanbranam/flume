# flume

A workflow tool for agents

## Develop

Needs Node 22.18 or later (it runs the TypeScript sources directly, so there is no build step).

- Install: `npm ci`
- Check (typecheck, lint, tests, bridle spec check): `npm run check` or `just check`
- Run: `node bin/flume.js --help`, `node bin/flume.js version`
