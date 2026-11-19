import { existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Command } from "@commander-js/extra-typings";
import { DEFAULT_DIR, FLUME_YAML, readDir, validDir } from "../core/index.ts";
import {
  commitPaths,
  ensureFlumeDir,
  findProject,
  hasChanges,
  inRepo,
  readConfigRoot,
  saveConfigRoot,
} from "../daemon/index.ts";
import { act, Usage } from "./program.ts";

const err = (s: string) => process.stderr.write(`${s}\n`);

/** `flume init`: set up the workspace folder and write flume.yaml in the tasks repo when missing. */
export function init(cwd: string, o: { root?: string; dir?: string }): number {
  const root = o.root === undefined ? undefined : resolve(cwd, o.root);
  const dir = o.dir;
  if (dir !== undefined && !validDir(dir))
    throw new Usage(`--dir must be . or one plain folder name, not '${dir}'`);
  const ws = resolve(cwd);
  const taskRoot = root ?? readConfigRoot(ws) ?? findProject(ws)?.mainCheckout;
  if (!taskRoot) {
    err("flume: no task root: run flume init --root PATH, or run it inside a git repository");
    return 1;
  }
  if (!inRepo(taskRoot)) {
    err(`flume: the task root is not a git repository: ${taskRoot}`);
    return 1;
  }
  const hasYaml = existsSync(join(taskRoot, FLUME_YAML));
  let use = dir ?? DEFAULT_DIR;
  if (hasYaml) {
    try {
      use = readDir(taskRoot);
    } catch (e) {
      err(`flume: ${(e as Error).message}`);
      return 1;
    }
    if (dir !== undefined && dir !== use) {
      err(`flume: ${FLUME_YAML} in the task root already says dir: ${use}, not ${dir}`);
      return 1;
    }
  }
  ensureFlumeDir(ws);
  if (root) saveConfigRoot(ws, root);
  if (!hasYaml) {
    writeFileSync(join(taskRoot, FLUME_YAML), `dir: ${use}\n`);
    if (hasChanges(taskRoot, FLUME_YAML)) {
      commitPaths(taskRoot, [FLUME_YAML], "flume init: flume.yaml");
    }
  }
  const out = (t: string) => process.stdout.write(`${t}\n`);
  out(`set up ${ws}`);
  out(`flume root ${use === "." ? taskRoot : join(taskRoot, use)}`);
  out(
    "next: flume project clone clones the projects in flume.yaml; run flume serve in this folder",
  );
  return 0;
}

/** The `flume init` command. */
export function initCommand(): Command {
  return new Command("init")
    .description("set up this workspace folder")
    .option("--root <path>", "the task root (a git repository)")
    .option("--dir <name>", "the folder for flume's files in the task root")
    .action(function (o) {
      return act(this, () => init(process.cwd(), o));
    });
}
