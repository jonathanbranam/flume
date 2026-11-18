import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseDocument } from "yaml";

/** The versioned file at the top of the tasks repo that names the flume-root folder. */
export const FLUME_YAML = "flume.yaml";
export const DEFAULT_DIR = "flume";
const DIR_RE = /^(\.|[A-Za-z0-9][A-Za-z0-9._-]*)$/;

/** Is `dir` usable as the flume-root folder name: "." or one plain folder name? */
export const validDir = (dir: string): boolean => DIR_RE.test(dir) && !dir.endsWith("..");

/**
 * The flume-root folder name from `<root>/flume.yaml` (key `dir`), relative to the tasks repo.
 * A missing file, or one with no `dir`, gives "flume"; an unusable `dir` throws.
 */
export function readDir(root: string): string {
  const file = join(root, FLUME_YAML);
  if (!existsSync(file)) return DEFAULT_DIR;
  const doc = parseDocument(readFileSync(file, "utf8"), { schema: "failsafe" });
  const cfg = doc.errors.length > 0 ? null : doc.toJS();
  if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) {
    throw new Error(`${FLUME_YAML} is not a set of fields`);
  }
  const dir = (cfg as Record<string, unknown>).dir;
  if (dir === undefined) return DEFAULT_DIR;
  if (typeof dir !== "string" || !validDir(dir)) {
    throw new Error(`${FLUME_YAML}: dir must be . or one folder name, not ${String(dir)}`);
  }
  return dir;
}

/** A path inside the flume-root, relative to the tasks repo (forward slashes). */
export function rel(root: string, ...parts: string[]): string {
  const dir = readDir(root);
  return [...(dir === "." ? [] : [dir]), ...parts].join("/");
}

/** The flume-root folder, absolute. */
export const flumeRoot = (root: string): string => join(root, rel(root));
