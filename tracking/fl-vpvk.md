+++
id = "fl-vpvk"
title = "Standard workflows: install a shipped none or light workflow at init or later"
kind = "feature"
state = "integrated"
created_at = "2026-11-25T12:08:54.578Z"
updated_at = "2026-11-25T12:39:05.302187109Z"
created_by = "external:advisor"
watchers = [
    "external:advisor",
    "agent:vpvk",
]
branch = "bridle/vpvk"
commit = "006540a0e21322db9639863873acc4da572501c7"
summary = "Shipped workflows none and light in workflows/NAME/ (the ticket drafts word for word). New: flume workflow install NAME [--project P] [--force] [--json], flume workflow install --list [--json], flume init --workflow NAME. Install needs no daemon: it copies and commits in the tasks repo. Code: src/core/shipped.ts, src/cli/workflow.ts, src/cli/init.ts; spec: design/specs/workflow-layers.md (init requirement in cli.md edited); tests: test/shipped.test.ts; help: setup.md, usage.md. Caveats: --force overwrites only the workflow's own files (light then none leaves light's phases.md); --project need not be in flume.yaml; init --workflow sets up nothing if a target file exists (init has no --force)."
ticket = "vpvk"
+++

docs/tickets/open/standard-workflows-install-a-shipped-none-or-light-workflow-vpvk.md

## Thread

### note · external:advisor · 2026-11-25T12:09:08.044Z
advisor: filed from the human's words; pending (feature, drafts for review). Blocked by fl-mv4r (needs whole-file @replace). Choices under Assumed.

### note · external:advisor · 2026-11-25T12:16:06.975Z
readied by external:advisor

### note · external:advisor · 2026-11-25T12:16:06.990Z
advisor: readied after the human answered copy-vs-setting ("Yes it is a copy onto the project or workspace chosen by the user"). Waits on fl-mv4r (blocked_by). Drafts not reviewed by the human; they review what ships. If fl-94yx lands first, light/phases.md simplifies.

### note · agent:vpvk · 2026-11-25T12:36:24.758Z
vpvk: choices. (1) Shipped named workflows live in workflows/NAME/ beside base/; --list descriptions are a table in src/core/shipped.ts (the drafts ship word for word, so no description inside them). (2) install does not use the daemon (like project add): it writes and commits in the tasks repo itself, so it works at init time. (3) --project takes any plain name; it need not be in flume.yaml (a typo makes a new folder). (4) --force overwrites only the files the workflow has: going from light to none leaves light's phases.md. (5) init --workflow installs into base/; if a target file exists, or the name is unknown, init sets up nothing (exit 1 / 2); init still takes no --force. (6) install also takes --json.

### note · agent:vpvk · 2026-11-25T12:38:43.312Z
built: 4db3eb6 (branch bridle/vpvk)

### note · agent:vpvk · 2026-11-25T12:38:43.352Z
done: none and light workflows shipped, flume workflow install / --list and init --workflow; commit 4db3eb6, branch bridle/vpvk (contains main). just check exit 0, 281 tests passed (13 files); spec check 0 errors, new scenarios bound. Choices on the thread; note light then none --force leaves light's phases.md. u725 had not landed when I merged main. No tool or fetch failures.

### note · agent:manager · 2026-11-25T12:39:03.273Z
integrated: 006540a0e21322db9639863873acc4da572501c7 (branch bridle/vpvk)

### note · agent:manager · 2026-11-25T12:39:05.302Z
cleanup: removed agent vpvk, origin branch bridle/vpvk, branch bridle/vpvk
