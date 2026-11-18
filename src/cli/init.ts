import { existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
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

const err = (s: string) => process.stderr.write(`${s}\n`);

function usage(msg: string): number {
  err(`flume: ${msg}\nusage: flume init [--root PATH] [--dir NAME]`);
  return 2;
}

/** `flume init`: set up the workspace folder and write flume.yaml in the tasks repo when missing. */
export function init(cwd: string, args: string[]): number {
  let root: string | undefined;
  let dir: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--root") {
      const v = args[++i];
      if (v === undefined) return usage("--root needs a path");
      root = resolve(cwd, v);
    } else if (a === "--dir") {
      const v = args[++i];
      if (v === undefined) return usage("--dir needs a folder name");
      if (!validDir(v)) return usage(`--dir must be . or one plain folder name, not '${v}'`);
      dir = v;
    } else return usage(`unknown option '${a}'`);
  }
  const ws = resolve(cwd);
  if (existsSync(join(ws, ".flume"))) {
    err("flume: this folder is already set up (.flume exists); nothing changed");
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
  process.stdout.write(
    `set up ${ws}\nflume root ${use === "." ? taskRoot : join(taskRoot, use)}\n`,
  );
  return 0;
}
