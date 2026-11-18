import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { parseDocument, stringify } from "yaml";

export interface DaemonRecord {
  url: string;
  pid: number;
  root: string;
}

const DIR = ".flume";

/** The workspace folder that holds a `.flume/daemon.json`, found by walking up from `cwd`; undefined when none. */
export function findWorkspace(cwd: string): string | undefined {
  let dir = resolve(cwd);
  for (;;) {
    if (existsSync(join(dir, DIR, "daemon.json"))) return dir;
    const up = dirname(dir);
    if (up === dir) return undefined;
    dir = up;
  }
}

export function readRecord(cwd: string): DaemonRecord | undefined {
  const ws = findWorkspace(cwd);
  if (!ws) return undefined;
  try {
    return JSON.parse(readFileSync(join(ws, DIR, "daemon.json"), "utf8")) as DaemonRecord;
  } catch {
    return undefined;
  }
}

/** Create `<ws>/.flume/` (with a .gitignore of `*`) when missing. */
export function ensureFlumeDir(ws: string): string {
  const dir = join(ws, DIR);
  mkdirSync(dir, { recursive: true });
  const ignore = join(dir, ".gitignore");
  if (!existsSync(ignore)) writeFileSync(ignore, "*\n");
  return dir;
}

/** The flat keys of `<ws>/.flume/config.yaml`; empty when the file is missing or not a mapping. */
function readConfig(ws: string): Record<string, unknown> {
  try {
    // Failsafe schema: every scalar stays a string (a root named `1.0` or `no` is still a path).
    const cfg = parseDocument(readFileSync(join(ws, DIR, "config.yaml"), "utf8"), {
      schema: "failsafe",
    }).toJS();
    return cfg && typeof cfg === "object" && !Array.isArray(cfg) ? cfg : {};
  } catch {
    return {};
  }
}

/** The saved task root from `<ws>/.flume/config.yaml`, as an absolute path; undefined when none. */
export function readConfigRoot(ws: string): string | undefined {
  const root = readConfig(ws).root;
  return typeof root === "string" ? resolve(ws, root) : undefined;
}

/** Save `root` in config.yaml, keeping other keys. A path inside the workspace is stored relative to it. */
export function saveConfigRoot(ws: string, root: string): void {
  const file = join(ensureFlumeDir(ws), "config.yaml");
  const cfg = readConfig(ws);
  const rel = root.startsWith(`${ws}/`) ? root.slice(ws.length + 1) : root;
  cfg.root = isAbsolute(rel) || rel ? rel : ".";
  writeFileSync(file, stringify(cfg));
}

export function writeRecord(ws: string, rec: DaemonRecord): void {
  writeFileSync(join(ensureFlumeDir(ws), "daemon.json"), `${JSON.stringify(rec)}\n`);
}

/** Remove the record, only when it is still ours. */
export function removeRecord(ws: string, pid: number): void {
  if (readRecord(ws)?.pid === pid) rmSync(join(ws, DIR, "daemon.json"), { force: true });
}

/** The workspace folder holding a `.flume/` (made by `flume init`), found by walking up from `cwd`. */
export function findInitialized(cwd: string): string | undefined {
  let dir = resolve(cwd);
  for (;;) {
    if (existsSync(join(dir, DIR))) return dir;
    const up = dirname(dir);
    if (up === dir) return undefined;
    dir = up;
  }
}
