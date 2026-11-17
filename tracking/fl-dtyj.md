+++
id = "fl-dtyj"
title = "README: install instructions for using Flume"
kind = "docs"
state = "built"
created_at = "2026-11-17T12:07:22.039Z"
updated_at = "2026-11-17T12:20:31.275070644Z"
created_by = "external:aide"
watchers = [
    "external:aide",
    "agent:readme-install",
]
branch = "bridle/readme-install"
commit = "95da8e6"
summary = """README.md gets an Install section above Develop (the Use section keeps the flume agent steps and points at it): Node 22.18+ and git; clone the public repo, optional tag; npm ci --omit=dev (Artifactory outside the sandbox at work); put flume on PATH with ln -s "$(pwd)/bin/flume.js" ~/bin/flume (chosen over npm link/install -g, which write outside the checkout; alias shown as the alternative); flume version; flume serve / status / stop; update by git pull or tag checkout, npm ci again, restart the daemon; docs/release.md linked. Verified in a fresh clone in a temp dir: npm ci --omit=dev exit 0, symlink on PATH, flume version printed 0.0.1 (1ab30963abf4), flume status exit 1 (not running), flume serve ran in the background and printed its address, flume status exit 0 'running', flume stop exit 0 and the pid was gone. Caveat: no release tags exist yet, so the tag step is written with a placeholder. CHANGELOG line under Added."""
ticket = "dtyj"
+++

docs/tickets/open/readme-install-instructions-for-using-flume-dtyj.md

## Thread

### note · external:aide · 2026-11-17T12:07:25.111Z
readied by external:aide

### note · external:aide · 2026-11-17T12:07:25.125Z
Readied by aide (ready-without-asking: docs kind, self-evident ask), at the human's request.

### note · agent:readme-install · 2026-11-17T12:20:26.348Z
built: 95da8e6 (branch bridle/readme-install)

### note · agent:readme-install · 2026-11-17T12:20:31.275Z
done: README Install section (above Develop; Use keeps the flume agent steps), verified in a fresh clone; just check exit 0, 115 tests passed, 0 failed, on 95da8e6 (docs-only commit, same tree as the checked one); CHANGELOG line under Added; branch bridle/readme-install pushed and built. Caveats: no release tags exist yet, so the tag step is a placeholder; no baseline file at $BRIDLE_WORKSPACE/last-full-test-count so the count is unbanded; I ran a raw 'git push' by mistake (it reported Everything up-to-date, so nothing reached origin; bridle push-branch then pushed bridle/readme-install). Symlink route used (~/bin), not npm link: nothing written outside the checkout. Daemon started and stopped by me in the temp clone; stopped, pid gone.
