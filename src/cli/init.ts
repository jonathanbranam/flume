import { existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  DEFAULT_DIR,
  FLUME_YAML,
  readDir,
  readProjects,
  validDir,
  validProjectName,
} from "../core/index.ts";
import {
  cloneRepo,
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
  err(`flume: ${msg}\nusage: flume init [--root PATH] [--dir NAME] [--clone]`);
  return 2;
}

/** `flume init`: set up the workspace folder and write flume.yaml in the tasks repo when missing. */
export function init(cwd: string, args: string[]): number {
  let root: string | undefined;
  let dir: string | undefined;
  let clone = false;
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
    } else if (a === "--clone") clone = true;
    else return usage(`unknown option '${a}'`);
  }
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
  let projects: ReturnType<typeof readProjects>;
  try {
    projects = readProjects(taskRoot);
  } catch (e) {
    err(`flume: ${(e as Error).message}`);
    return 1;
  }
  let failed = 0;
  const missing: string[] = [];
  for (const p of projects) {
    const dest = join(ws, p.name);
    if (!validProjectName(p.name) || p.url === undefined) {
      err(
        `flume: skipping project ${p.name}: ${FLUME_YAML} gives no url or a bad name (flume check)`,
      );
      continue;
    }
    if (existsSync(dest)) out(`project ${p.name}: already there`);
    else if (!clone) {
      out(`project ${p.name}: missing (${p.url})`);
      missing.push(p.name);
    } else {
      const e = cloneRepo(p.url, dest, p.branch);
      if (e === undefined) out(`project ${p.name}: cloned`);
      else {
        failed++;
        err(`flume: clone of project ${p.name} (${p.url}) failed: ${e}`);
      }
    }
  }
  if (missing.length > 0) out("flume init --clone clones the missing projects");
  out("next: run flume serve in this folder");
  return failed > 0 ? 1 : 0;
}
