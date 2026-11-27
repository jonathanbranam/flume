---
id: fl-tf7c
title: "Workspace versus single-project setup: investigate today's support and propose the approach"
kind: research
created: 2026-11-27
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-xp8s]
---

## The ask

Decide how flume supports a workspace (several related projects, flume's files in a repository the
user chooses) versus a single project with no separate workspace or flume repository. First
investigate what flume does today, then propose the right approach. The workspace is the workhorse:
it is fine if the current version supports only the workspace.

## Design

Not designed yet. To find out:

- What flume does today for each setup: flume init, flume project add, flume clone, flume project
  clone, where the tasks and the flume root live, what prime says when flume is not set up.
- What a single-project setup would need: where flume's files go (the project's own repository,
  per docs/flume.md: "which can be the project's own repository when there is no workspace"),
  what changes in the CLI and the daemon.
- The proposal, brought to the human before any build ticket.

Includes the flume_not_set_up prime text, which still names a separate tasks repo (flume clone
<tasks-repo-url>), held from the agent spec review.

## Discussion (for reference, not authoritative)

The human, 2026-11-27, verbatim: "I think we should start a ticket for Flume workspace versus
single-project setup, and separately, we'll investigate the current solution and come up with the
right approach. I'm fine if the current version of Flume only supports the workspace approach
because that is the workhorse of Flume."

Earlier, verbatim: "I do still have a desire for Flume to work in single-project repos without a
separate workspace, without a separate Flume repo. I'm not sure if that's implemented or not. ...
I think, really, the primary use case is going to be for a workspace ... but I do really want to
use it as well for single-repo projects where I don't have a separate workspace."
