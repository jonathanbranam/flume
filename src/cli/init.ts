import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  commitPaths,
  ensureFlumeDir,
  findProject,
  hasChanges,
  inRepo,
  readConfigRoot,
  saveConfigRoot,
} from "../daemon/index.ts";

const err = (s: string) => process.stderr.write(`${s}\n`);

/** The base workflow that ships with flume (a folder in the flume package). */
const SHIPPED = join(dirname(fileURLToPath(import.meta.url)), "../../workflow/base");

function usage(msg: string): number {
  err(`flume: ${msg}\nusage: flume init [--root PATH] [--force]`);
  return 2;
}

/** `flume init`: set up the workspace folder and copy the shipped base workflow into the task repo. */
export function init(cwd: string, args: string[]): number {
  let root: string | undefined;
  let force = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--force") force = true;
    else if (a === "--root") {
      const v = args[++i];
      if (v === undefined) return usage("--root needs a path");
      root = resolve(cwd, v);
    } else return usage(`unknown option '${a}'`);
  }
  const ws = resolve(cwd);
  if (existsSync(join(ws, ".flume")) && !force) {
    err(
      "flume: this folder is already set up (.flume exists); use flume init --force to update the base workflow",
    );
    return 1;
  }
  const taskRoot = root ?? readConfigRoot(ws) ?? findProject(ws)?.mainCheckout;
  if (!taskRoot) {
    err("flume: no task root: run flume init --root PATH, or run it inside a git repository");
    return 1;
  }
  if (!inRepo(taskRoot)) {
    err(`flume: the task root is not a git repository: ${taskRoot}`);
    return 1;
  }
  ensureFlumeDir(ws);
  if (root) saveConfigRoot(ws, root);
  const base = join(taskRoot, "workflow", "base");
  rmSync(base, { recursive: true, force: true });
  mkdirSync(dirname(base), { recursive: true });
  cpSync(SHIPPED, base, { recursive: true });
  if (hasChanges(taskRoot, "workflow/base")) {
    commitPaths(taskRoot, ["workflow/base"], "flume init: base workflow");
  }
  process.stdout.write(`set up ${ws}\nbase workflow in ${base}\n`);
  return 0;
}
