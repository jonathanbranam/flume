+++
id = "fl-hq8k"
title = "Agent and project identity lines built into flume prime, not in any layer"
kind = "fix"
state = "built"
created_at = "2026-11-25T13:51:23.649Z"
updated_at = "2026-11-25T14:01:04.378414643Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:hq8k",
]
branch = "bridle/hq8k"
commit = "285baad"
summary = """flume prime and flume agent now build the identity lines themselves (src/cli/agent.ts, identityLines): "You are agent NAME, stored in $AGENT_NAME." and, only when a project is known, "You are working on project P, stored in $AGENT_PROJECT.". They are printed inside flume_prime, first, before the workflow element, so no layer can replace or remove them. The lines are removed from base/workflow.md, the shipped none and light workflow.md, and base/project.md. base/project.md is not empty: it keeps "Read that project's CLAUDE.md and follow its instructions." (layered, as the ticket says). The daemon's /api/prime endpoint does not carry the identity lines, because the daemon does not know the agent's name. Specs: new r-1d7e (s-1d7f, s-1d80) in design/specs/agent.md; s-1d08, s-3cd4, s-ad01, s-a6c1, s-a9c1, s-87a2 and r-87a1 updated in place; r-745b/s-7bb1 in workflow.md no longer have the agent line in the workflow text. Tests updated in prime, agent, daemon, preview and workflow tests; s-1d7f and s-1d80 added. Check: just check exit 0, 292 of 292 tests passed, on commit 285baad. Caveat: the "last full landing" baseline file ($BRIDLE_WORKSPACE/last-full-test-count) was not present here, so the count was not compared against it."""
ticket = "hq8k"
+++

docs/tickets/open/agent-and-project-identity-lines-built-into-flume-prime-not-hq8k.md

## Thread

### note · external:advisor · 2026-11-25T13:51:29.539Z
readied by external:advisor

### note · external:advisor · 2026-11-25T13:51:29.562Z
advisor: filed from the human's words and readied (kind fix, one clear change).

### note · external:orchestrator · 2026-11-25T13:57:14.726Z
From orchestrator: fl-hq8k planned and queued; fl-a5vb has landed, so start it now. Haiku is fine. Done when prime prints the identity lines first, outside every layer, the lines are gone from base/workflow.md, base/project.md and the none/light workflow.md, and the prime spec and tests are updated with the check green.

### note · agent:hq8k · 2026-11-25T14:01:00.996Z
built: 285baad (branch bridle/hq8k)

### note · agent:hq8k · 2026-11-25T14:01:04.378Z
done: fl-hq8k built. prime and agent print the identity lines first, outside every layer (src/cli/agent.ts identityLines); lines removed from base/workflow.md, base/project.md (keeps 'Read that project's CLAUDE.md and follow its instructions.') and the none/light workflow.md; specs r-1d7e (s-1d7f, s-1d80) in design/specs/agent.md, others edited in place; tests updated and added. just check exit 0, 292/292 passed, commit 285baad, branch bridle/hq8k pushed and merged with main (already up to date). Caveat: no last-full-test-count baseline file in this workspace, so the count was not compared to it. Summary on the ticket.
