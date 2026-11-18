import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { listTaskFiles, resolveRef } from "./store.ts";

export const HISTORY_JSONL = "history.jsonl";

/** One line of a task's history. */
export interface HistoryEntry {
  time: string;
  by: string;
  action: string;
  field?: string;
  from?: unknown;
  to?: unknown;
  part?: string;
  items?: string[];
  reason?: string;
  title?: string;
  kind?: string;
}

/** The action's data: everything in an entry except time, by and action. */
export type HistoryData = Omit<HistoryEntry, "time" | "by" | "action">;

/** Append one line to the history of the task folder `folder` (relative to `root`). Never rewrites. */
export function appendHistory(
  root: string,
  folder: string,
  by: string,
  action: string,
  data: HistoryData = {},
  now: Date = new Date(),
): void {
  const entry = { time: `${now.toISOString().slice(0, 19)}Z`, by, action, ...data };
  appendFileSync(join(root, folder, HISTORY_JSONL), `${JSON.stringify(entry)}\n`);
}

/** The history of a task, oldest first; empty when it has none. */
export function readHistory(root: string, ref: string): HistoryEntry[] {
  const e = resolveRef(listTaskFiles(root), ref);
  if (!e) throw new Error(`no task '${ref}'`);
  const p = join(root, e.path, HISTORY_JSONL);
  if (!existsSync(p)) return [];
  return readFileSync(p, "utf8")
    .split("\n")
    .filter((l) => l.trim() !== "")
    .map((l) => JSON.parse(l) as HistoryEntry);
}

/** One human line: time, by, action and its data. */
export function formatHistory(h: HistoryEntry): string {
  const { time, by, action, ...rest } = h;
  const bits = Object.entries(rest).map(
    ([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`,
  );
  return [time, by, action, ...bits].join("\t");
}
