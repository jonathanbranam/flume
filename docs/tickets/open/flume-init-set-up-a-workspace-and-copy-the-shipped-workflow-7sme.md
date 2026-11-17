---
id: fl-7sme
title: "flume init: set up a workspace and copy the shipped workflow to .flume/workflow"
kind: feature
created: 2026-11-17
created_by: external:advisor
repos: [flume]
changes: []
specs: []
blocked_by: []
related: [fl-4dgp]
---

## The ask

Add `flume init`: set up a workspace once, and copy the workflow that ships with flume to `<workspace>/.flume/workflow/`. First step only of a three-layer design.

The human, 2026-11-17 (verbatim excerpts):

> there will be a workspace-wide workflow and specification; that should be created on startup of a new workspace by flume somehow; probably a different command not serve; there should be a setup or install or adopt command; serve should probably fail and say to run that first

> so there will be workspace configs and workflows and project overlays; the other thing I want, similar to bridle, is that flume ships a standard workflow and that can be updated. So.... really there are three layers: - base flume workflow - workspace layer on that - project layer on that

> but don't build this YET!! First step is this: - flume workflow ships in the binary and is copied to disk inside the workspace folder as workspace-1/.flume/workflow

On advisor's proposal: "1. yes flume init is the right name 2. yes 3. no, it fails but 'flume init --force' overwrites 4. I don't think 'flume prime' is text on disk... 'flume prime' needs to be continuously updated by the flume project to reflect new commands, etc. the "workflow" on disk is different"

> I'll send my agent workflow over when I have a chance; it will say things like "coding work always happens in a claude worktree; enter/exit etc; merge main before exit..." and specific things for work like "agents don't push" and "avoid these commands they trigger a permissions prompt"

## Revision (supersedes the workflow location below)

The human, 2026-11-17: "workspace level rules should live in the --root repo and git versioned; sorry just realizing that oversight. project level rules live in each projects git repo. Neither should use hidden folders."

- **Nothing workflow-related goes in `.flume/`.** `.flume/` keeps only `config.toml`, `daemon.json` and `.gitignore` (machine-local).
- **Base workflow (shipped with flume):** `flume init` copies it to `<root>/flume/workflow/base/` in the task repo (beside `flume/tasks/`), and commits it there (one commit, never pushes). `flume init --force` overwrites only `flume/workflow/base/` and commits.
- **Workspace rules:** the human's own files in `<root>/flume/workflow/` (outside `base/`), versioned in the task repo. Flume never writes them.
- **Project rules:** each project's own files in `<repo>/flume/workflow/` in that project's repo. Flume never writes them.
- **Reading order in the prime:** `<root>/flume/workflow/base/*.md`, then `<root>/flume/workflow/*.md`, then the project's `flume/workflow/*.md` and its CLAUDE.md; each in name order; later layers override earlier ones (project over workspace over base). Flume merges nothing.
- Item 1's "copies the workflow to `.flume/workflow/`", item 2's overwrite target and item 5's file path are replaced by the above (placeholder becomes `<root>/flume/workflow/base/workflow.md`).

Assumed (advisor): folder names `flume/workflow/` and `base/` mirror `flume/tasks/`; change if the human wants other names. In same-repo mode the task repo is the project repo, so workspace and project folders are the same; read once.

## Design (agreed)

1. **`flume init [--root <path>] [--force]`**, run in the workspace folder (not a git repo; fl-4dgp):
   - creates `.flume/` with its `.gitignore` (`*`) and `config.toml` (`root` from `--root`; with no `--root`, same-repo mode as today);
   - copies the workflow shipped in flume to `.flume/workflow/`.
2. **Run again:** when `.flume/` already exists, `flume init` fails with a message saying to use `--force`. `flume init --force` overwrites `.flume/workflow/` with the shipped copy (the update path).
3. **`flume serve`** with no `.flume/` in the current folder fails: no flume workspace here; run flume init first. `serve` drops `--root` (it moves to `init`); `serve` reads `root` from `config.toml`.
4. **Prime stays built into flume,** not on disk: it changes with flume's commands. The workflow is separate content.
5. **Shipped workflow content, day one:** one placeholder file, `.flume/workflow/workflow.md`, with a short heading and a line saying this is flume's base workflow, replaced on `flume init --force`. Real content comes from the human's agent workflow (worktrees, merge main before exit, agents don't push, commands to avoid), in a later ticket.
6. **Layers are just reading order; flume merges nothing.** The prime (when the workspace has `.flume/workflow/`) adds one short line: read the files in `<workspace>/.flume/workflow/` in name order, then the project's own instructions (its CLAUDE.md, per fl-vpsb); where they conflict, project (repo) rules override workspace rules. The human, 2026-11-17: "lets KISS and YAGNI for now: for any type of "instructions" or "workflow" we can just tell the agent to read the files in order and that project (repo) level rules override workspace level rules."
7. Specs (cli.md: init, serve) and tests in the same change; README install steps say `flume init --root ...` once, then `flume serve`.

## Assumptions (assume-and-record)

- **`--force` with a different `--root`:** updates `root` in config.toml; `--force` without `--root` keeps config.toml as is.
- **Not now:** workspace and project layers, merging layers, any workflow content beyond the placeholder.
