# Installing flume

Flume has no build step. It runs its TypeScript sources directly, so an install is a git checkout
plus one `npm ci`. You need Node 22.18 or later, and git.

At work, run the clone and `npm ci` outside the Claude Code sandbox: public package registries are
blocked there, and `npm ci` fetches through the Artifactory npm mirror.

## 1. Clone the public repo

```sh
git clone https://github.com/jonathanbranam/flume.git
cd flume
```

Optionally check out a release tag instead of staying on `main` (`git tag` lists them):

```sh
git checkout v<version>
```

## 2. Install the runtime dependencies

```sh
npm ci --omit=dev
```

This installs `commander`, `@commander-js/extra-typings` and `yaml`, the only runtime
dependencies. Run it again after every clone, checkout or update.

## 3. Put flume on your PATH

Link the program into a folder that is already on your PATH (here `~/bin`, which must exist). The
link points into the checkout, so updates need no relinking:

```sh
ln -s "$(pwd)/bin/flume.js" ~/bin/flume
```

An alias also works: `alias flume='node /path/to/flume/bin/flume.js'`.

## 4. Check it

```sh
flume --version
```

prints `<version> (<commit>)`. Put that line in any bug report (`flume bug` prints a template to
paste into an email).

## Updating

Updates arrive only by `git pull` from the public repo; nothing is built or pushed. From the
checkout:

```sh
git pull                          # or: git fetch --tags && git checkout v<version>
npm ci --omit=dev
```

Then restart the daemon so it runs the new code: `flume stop`, then `flume serve` (the human runs
`serve`). Flume's own text ships inside flume, so an update needs no refresh in your workspace.

## Next

`flume help setup` adopts flume for a project; `flume help usage` says what to run and when.
