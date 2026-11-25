---
id: fl-a5vb
title: Layer H1 errors explain the rule, the problem and the fix
kind: fix
created: 2026-11-25
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-mv4r]
---

## The ask

When a layer file breaks the one-H1 rule, flume's error should explain the rule, what is wrong in
this layer, and how to fix it, not only name the problem. Applies wherever layer errors are
reported: flume check, and prime, instructions and guide when they stop on a layer error.

## Design

### The messages

Each layer error about the H1 says three things, with file and line as today:

1. The rule: every layer file has exactly one H1, and it must match the H1 of the layer below
   (named, e.g. "# Flume workflow").
2. The problem in this layer: no H1; text or a heading before the H1; a second H1; or an H1 that
   differs from the one below (it would add another H1).
3. The fix, with both ways spelled out:
   - To change or add to the document: start the file with the same H1 as the layer below
     ("# Flume workflow") and put your sections under it as H2s, tagged @add, @append or @remove
     as needed.
   - To replace the whole document: put @replace on the H1 ("# Flume workflow @replace" or any
     title with @replace).

### Not in this ticket

- No migration and no --fix: there are no old files to migrate (the human).
- No change to the rules themselves (fl-mv4r).

## Discussion (for reference, not authoritative)

The human, 2026-11-25 (to advisor), verbatim: "there are no old files or things to migrate, don't
worry about that. Yes \"explain the fix\" explain the rule (one H1 per file), the problem in the
layer (adds another H1) and the fix: either replace the existing H1 (is this OK as a fix?) or use
only H2."

Advisor checked the merged code (2026-11-25) before writing the fixes:

- A file with only H2s (no H1) is an error today ("no H1; a document has exactly one"). So "use
  only H2" is written as: keep the lower layer's H1 line, then H2s under it.
- "# Anything @replace" replaces the whole document: a valid fix when that is what is meant.
- "# Flume workflow" with text right under it (no tag) is valid but replaces only the base's
  opening text, which holds "You are agent {name}, stored in $AGENT_NAME." That is a replace by
  design, not an error; the fix text should not suggest putting text directly under the H1.
