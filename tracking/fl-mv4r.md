+++
id = "fl-mv4r"
title = "Workflow layers: the base workflow as a Markdown file; workspace, project and role files merge into it by heading, and can replace or remove"
kind = "feature"
state = "built"
created_at = "2026-11-18T22:45:40.024Z"
updated_at = "2026-11-25T12:33:52.975890515Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:mv4r",
]
branch = "bridle/mv4r"
commit = "fbefae2715bbd1070299fa35e025d72ef9b71e42"
summary = "Workflow layers built. flume's base text is now Markdown in base/ and flume-root base/ and projects/P/ files merge into it by heading (src/core/layers.ts, documents.ts); errors name file, line and heading, stop prime/agent/instructions/template/guide with exit 1, and show in flume check. Prime has one <workflow> element. Spec: design/specs/workflow-layers.md. Caveats and choices: see thread (templates have an H1; existing layer files need exactly one H1; guides and templates now merge rather than replace). Preview is fl-u725. No new dependency."
ticket = "mv4r"
+++

docs/tickets/open/workflow-layers-the-base-workflow-as-a-markdown-file-workspa-mv4r.md

## Thread

### note · external:advisor · 2026-11-18T22:45:45.764Z
advisor: filed from the human's words; pending (the human asked for the ticket and feedback, not a build). Choices recorded under Assumed.

### note · external:advisor · 2026-11-18T22:53:37.634Z
Design revised from the human's answers (Discussion): @ tags at the end of headings; replace by default; an untagged heading that matches nothing is an error; @add/@append/@remove/@replace; @remove with sub-headings is an error; H1 @replace replaces the whole file (no front matter); same rule for workflow, roles, guides, templates; flume preview and flume check. Still pending.

### note · external:advisor · 2026-11-25T12:16:02.375Z
readied by external:advisor

### note · external:advisor · 2026-11-25T12:16:02.398Z
human via advisor: readied. The human, 2026-11-25, verbatim: "We need to ship workflow layers now then." (fl-vpvk, the shipped none and light workflows, is blocked on this.) Build from the Design as it stands; the Assumed choices hold.

### note · external:orchestrator · 2026-11-25T12:17:16.497Z
orchestrator: brief added to the body; flume preview split out as fl-u725 (blocked by this). Planned and queued.

### note · external:orchestrator · 2026-11-25T12:22:42.777Z
orchestrator: brief added to the body; flume preview split out as fl-u725 (blocked by this). Planned and queued, tier 1.

### note · agent:mv4r · 2026-11-25T12:32:37.621Z
mv4r: choices made while building (change any if wrong).

1. Templates get an H1 (# Body, # Design, # Spec, # Plan) and are printed whole, as Design says ("every other document is printed whole"). So a plan may now start with one "# Title" line (flume task next/done rewrite the plan without it, as they already drop comments). Alternative: strip the H1 on output like first-prompt.
2. The XML element is <workflow>: merged workflow.md, then project.md, then the role, since Design says one element replaces flume_base, workspace_workflow, project_workflow and role.
3. As in the Design's draft, workflow.md no longer names Guide: lines, task next/done/skip/close (phases.md does); spec r-745b and its test changed to match.
4. phases.md: instructions prints only the current phase's H2 and "Every phase". An added H2 such as the example "## Review" merges but is printed by nothing until fl-u725 preview. Phases stay the fixed five.
5. flume enforces the heading rules and one H1; it does not run rumdl (no new dependency). The shipped base files pass uvx rumdl. Template blank lines changed to pass it.
6. Strictness beyond the listed errors: text before the H1, a skipped level, a repeated sibling heading, an underlined heading, and any tag where nothing is below to merge into (also inside @add/@replace subtrees) are errors. Comment lines above the H1 are dropped. Appended text is joined with a blank line.
7. Guides: front matter is the most specific file's, not merged; bodies merge. The guide list reads front matter only, but "flume guide" with no name still fails on a broken workflow layer (it uses the prime endpoint).
8. The daemon answers 422 for a layer error; other refusals still give prime's workflow_missing element. flume agent writes the registry entry, then stops without starting claude.
9. {name}/{project} are filled in workflow, project and first prompt, not in roles (as before).
10. Existing files in a tasks repo without exactly one H1 are now errors (no migration).
For fl-u725: src/core/layers.ts mergeLayers() returns sections with their source files; src/core/documents.ts documentFiles/readDocument gives the layer chain.

### note · agent:mv4r · 2026-11-25T12:32:39.063Z
built: fbefae2715bbd1070299fa35e025d72ef9b71e42 (branch bridle/mv4r)

### note · agent:mv4r · 2026-11-25T12:32:43.190Z
done: workflow layers built and pushed on bridle/mv4r; fbefae2. just check exit 0, 273/273 tests passed (12 files), spec check 0 errors; new scenarios all bound (the 18 unbound are in ui.md). main already merged (up to date). No new dependency. Choices are on the thread; the ones to look at: templates now have an H1 (so a plan may start with a '# Title' line); the shipped workflow.md, per the Design draft, no longer names task next/done/skip/close; existing layer files without exactly one H1 are now errors; project guides and templates merge instead of replacing. Not a UI change, so no browser check.

### note · agent:manager · 2026-11-25T12:33:52.975Z
Land failed: just check under the land's load timed out s-c7d1 (test/workflow.test.ts:109, 'an unnamed Claude Code agent is an agent') at the 5000ms default. Give it a 30s per-test timeout, as done before for s-96f3 and s-4a03 (check the other workflow.test.ts tests that spawn the CLI/daemon too; same fix where they lack one). Rerun just check to a file, commit on your branch, and message me with exit status, test count and sha.
