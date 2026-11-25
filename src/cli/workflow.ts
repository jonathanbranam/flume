import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Command, type CommandUnknownOpts } from "@commander-js/extra-typings";
import {
  flumeRoot,
  isShippedWorkflow,
  rel,
  SEGMENT_RE,
  SHIPPED_WORKFLOWS,
  shippedFiles,
} from "../core/index.ts";
import { commitPaths, hasChanges } from "../daemon/index.ts";
import { act, Usage } from "./program.ts";
import { locate } from "./project.ts";

const err = (s: string) => process.stderr.write(`${s}\n`);
const out = (s: string) => process.stdout.write(`${s}\n`);

/** Refuse a name that is not a shipped workflow (exit 2). */
export function checkWorkflowName(name: string): void {
  if (!isShippedWorkflow(name)) {
    const names = SHIPPED_WORKFLOWS.map((w) => w.name).join(", ");
    throw new Usage(`no shipped workflow '${name}'; the shipped workflows are ${names}`);
  }
}

/**
 * The files of workflow `name` that already exist in the layer folder `layer` of the flume-root
 * `root` (an absolute path), which need not have a flume.yaml yet.
 */
export function existingTargets(root: string, layer: string, name: string): string[] {
  return shippedFiles(name)
    .map((f) => join(root, layer, f.doc))
    .filter((f) => existsSync(f));
}

/**
 * Copy a shipped workflow into base/ or projects/PROJECT/ of the flume root and commit it.
 * Returns the files, relative to the task root, or undefined after refusing to overwrite.
 */
export function installWorkflow(
  taskRoot: string,
  name: string,
  project: string | undefined,
  force: boolean,
): string[] | undefined {
  const layer = project === undefined ? "base" : `projects/${project}`;
  const there = existingTargets(flumeRoot(taskRoot), layer, name);
  if (there.length > 0 && !force) {
    err(`flume: already there, nothing changed (--force overwrites): ${there.join(", ")}`);
    return undefined;
  }
  const files = shippedFiles(name).map((f) => {
    const path = rel(taskRoot, layer, f.doc);
    mkdirSync(dirname(join(taskRoot, path)), { recursive: true });
    writeFileSync(join(taskRoot, path), f.text);
    return path;
  });
  if (files.some((f) => hasChanges(taskRoot, f))) {
    commitPaths(taskRoot, files, `flume workflow install: ${name} into ${layer}`);
  }
  return files;
}

interface InstallOptions {
  project?: string;
  force?: boolean;
  list?: boolean;
  json?: boolean;
}

/** `flume workflow install NAME [--project P] [--force]` and `--list`; returns the exit code. */
function install(cwd: string, name: string | undefined, o: InstallOptions): number {
  if (o.list) {
    if (name !== undefined || o.project !== undefined || o.force)
      throw new Usage("--list takes no name, --project or --force");
    if (o.json) out(JSON.stringify(SHIPPED_WORKFLOWS));
    else for (const w of SHIPPED_WORKFLOWS) out(`${w.name}\t${w.description}`);
    return 0;
  }
  if (name === undefined) throw new Usage("name a workflow, or use --list");
  checkWorkflowName(name);
  if (o.project !== undefined && !SEGMENT_RE.test(o.project))
    throw new Usage(`project '${o.project}' is not a plain name`);
  const loc = locate(cwd);
  if (typeof loc === "string") {
    err(`flume: ${loc}`);
    return 1;
  }
  let files: string[] | undefined;
  try {
    files = installWorkflow(loc.taskRoot, name, o.project, o.force === true);
  } catch (e) {
    err(`flume: ${(e as Error).message}`);
    return 1;
  }
  if (!files) return 1;
  if (o.json) out(JSON.stringify({ workflow: name, files }));
  else for (const f of files) out(`installed ${f}`);
  return 0;
}

/** The `flume workflow` command. */
export function workflowCommand(): CommandUnknownOpts {
  const group = new Command("workflow").description("install a shipped workflow");
  group
    .command("install")
    .description("copy a shipped workflow into the tasks repo and commit it")
    .argument("[name]", "the workflow (see --list)")
    .option("--project <project>", "install for one project (default: the whole workspace)")
    .option("--force", "overwrite existing files")
    .option("--list", "list the shipped workflows")
    .option("--json", "print JSON")
    .action(function (name, o) {
      return act(this, () => install(process.cwd(), name, o));
    });
  return group;
}
