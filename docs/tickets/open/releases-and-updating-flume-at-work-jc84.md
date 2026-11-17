---
id: fl-jc84
title: Releases and updating Flume at work
kind: feature
created: 2026-11-17
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-28pa]
---

## The ask

Make Flume easy to update at work, and make work bug reports traceable to a version.

How the human will work with Flume (2026-11-16, advisor session): "1. work on it using bridle 2. file bug reports at work 3. email those to you using bridle 4. when the update ships, then update at work. I do this with the meta-notes Vim plugin and it works pretty well". And on the work machine: "I can directly reach public github and clone, but I'm not allowed to push at all".

So the install route at work is a clone of the public repo (github.com/jonathanbranam/flume, public) and a pull to update; nothing flows back from work except the emailed bug reports.

What is wanted:

- `flume version`: the release number and git commit, printed in every bug report.
- Numbered releases as git tags, each with a short changelog entry, so the human can see what changed before updating at work.
- An install and update path from a clone: `git pull` (or checkout a tag), then one command. Keep the work machine's build small: prefer shipping the built output (CLI and UI) in the repo or the tag so work needs no build, only `npm install` of runtime deps from the Artifactory mirror, or none.
- `flume bug`: prints a bug-report template (version, command run, expected, actual) ready to paste into the email.

Stack: TypeScript on Node (fl-28pa).
