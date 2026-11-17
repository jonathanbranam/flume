import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { findProject } from "./git.ts";

export interface DaemonRecord {
  url: string;
  pid: number;
  root: string;
}

/** Where a project's daemon records its address: inside the shared git folder, so every worktree sees it. */
export function recordPath(cwd: string): string | undefined {
  const p = findProject(cwd);
  return p ? join(p.commonDir, "flume-daemon.json") : undefined;
}

export function readRecord(cwd: string): DaemonRecord | undefined {
  const path = recordPath(cwd);
  if (!path) return undefined;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as DaemonRecord;
  } catch {
    return undefined;
  }
}

export function writeRecord(cwd: string, rec: DaemonRecord): void {
  const path = recordPath(cwd);
  if (path) writeFileSync(path, `${JSON.stringify(rec)}\n`);
}

/** Remove the record, only when it is still ours. */
export function removeRecord(cwd: string, pid: number): void {
  const path = recordPath(cwd);
  if (path && readRecord(cwd)?.pid === pid) rmSync(path, { force: true });
}
