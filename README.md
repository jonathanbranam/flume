# flume

A workflow tool for agents

## Install and use

Needs Node 22.18 or later, and git. First steps (at work, outside the sandbox):

```sh
git clone https://github.com/jonathanbranam/flume.git
cd flume && npm ci --omit=dev
ln -s "$(pwd)/bin/flume.js" ~/bin/flume    # a folder on your PATH
flume --version
```

Then `flume --help` says what flume is, and `flume help` lists the guides: `flume help install`,
`flume help setup` (adopt a project, run the daemon) and `flume help usage` (what to run when).
The guides live in `docs/help/`. Releases and how they are cut are in `docs/release.md`.

## Develop

Needs Node 22.18 or later (it runs the TypeScript sources directly, so there is no build step; run `npm ci --omit=dev` after a clone or update for the runtime dependency).

- Install: `npm ci`
- Check (typecheck, lint, tests, bridle spec check): `npm run check` or `just check`
- Run: `node bin/flume.js --help`, `node bin/flume.js version`
