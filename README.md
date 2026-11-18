# flume

A workflow tool for agents

## Install

You need Node 22.18 or later, and git. At work, run these outside the sandbox; `npm ci` fetches
through the Artifactory npm mirror.

1. Clone the public repo and, optionally, check out a release tag (`git tag` lists them; stay on
   `main` if you prefer):

   ```sh
   git clone https://github.com/jonathanbranam/flume.git
   cd flume
   git checkout v<version>   # optional
   ```

2. Install the runtime dependency:

   ```sh
   npm ci --omit=dev
   ```

3. Put `flume` on PATH. From the checkout, link the program into a folder on your PATH (here
   `~/bin`, which must exist and be on PATH). The link points into the checkout, so updates need no
   relinking. An alias also works: `alias flume='node /path/to/flume/bin/flume.js'`.

   ```sh
   ln -s "$(pwd)/bin/flume.js" ~/bin/flume
   ```

   Check it: `flume --version` prints `<version> (<commit>)`.

4. Set up your workspace folder once (a git repo with its tasks, or a folder of repos with `flume init --root <task-repo>`; this creates `.flume/` and writes `flume.yaml` at the top of the task repo, naming the flume-root folder (`flume` by default, `--dir .` for the repo top), and commits it), then start the daemon and check it is up. Flume commands find it from any folder below. Workflow, roles and guides live in the task repo under `<flume-root>/base/` and `<flume-root>/projects/<project>/`; agents get them through `flume prime`, never by reading files. `flume serve` without `flume init` fails:

   ```sh
   flume init --root <task-repo>   # once; omit --root inside a git repo
   # or, from a tasks repo's git URL: flume clone <git-url> [<workspace>]
   # (clones the tasks repo and the projects listed in its flume.yaml; flume project list|add|clone|clone)
   flume serve     # runs in the foreground and prints its address; leave it running
   flume status    # in another terminal: "running at <address>" and the root; exit 1 if not running (--json for jq)
   flume stop      # stops the daemon
   ```

5. Update: from the checkout, pull `main` (or fetch tags and check out the new `v<version>`), then
   install the dependency again. Restart the daemon (`flume stop`, then `flume serve`) to run the
   new code.

   ```sh
   git pull        # or: git fetch --tags && git checkout v<version>
   npm ci --omit=dev
   ```

Releases and how they are cut are in `docs/release.md`.

## Use

`flume agent --name <name> [--project <p>] [<prompt>]` launches Claude Code as a named agent (needs `claude` on PATH;
`tmux` optional), `flume agent list` lists agents, `flume prime --name <name>` prints the prime text.
See `docs/release.md` and `design/specs/agent.md`.

## Develop

Needs Node 22.18 or later (it runs the TypeScript sources directly, so there is no build step; run `npm ci --omit=dev` after a clone or update for the runtime dependency).

- Install: `npm ci`
- Check (typecheck, lint, tests, bridle spec check): `npm run check` or `just check`
- Run: `node bin/flume.js --help`, `node bin/flume.js version`
