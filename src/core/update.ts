import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { checkProject } from "./check.ts";
import { listTaskFiles, resolveRef, type TaskEntry } from "./store.ts";
import {
  deleteField,
  fields,
  KINDS,
  parseTaskFile,
  serializeTaskFile,
  setField,
} from "./taskfile.ts";

/** Fields `updateTask` may set. A null clears parent, blocked_by or related. */
export interface TaskPatch {
  title?: string;
  kind?: string;
  parent?: string | null;
  blocked_by?: string[] | null;
  related?: string[] | null;
}

export const PATCH_FIELDS = ["title", "kind", "parent", "blocked_by", "related"] as const;

function load(root: string, ref: string): TaskEntry {
  const e = resolveRef(listTaskFiles(root), ref);
  if (!e) throw new Error(`no task '${ref}'`);
  return e;
}

function parsed(e: TaskEntry) {
  const r = parseTaskFile(e.text);
  if (!r.ok) throw new Error(`${e.path}: ${r.error}`);
  return r.file;
}

/**
 * Apply every field or none. The file is rewritten, the project is checked, and when the change
 * adds a problem the original text is put back and the change is refused.
 */
export function updateTask(root: string, ref: string, patch: TaskPatch): TaskEntry {
  const e = load(root, ref);
  const entries = listTaskFiles(root);
  const bare = (r: string) => resolveRef(entries, r)?.nameId ?? r;
  const file = parsed(e);
  if (patch.title !== undefined) {
    if (typeof patch.title !== "string" || patch.title.trim() === "")
      throw new Error("title must be a non-empty string");
    setField(file, "title", patch.title);
  }
  if (patch.kind !== undefined) {
    if (!(KINDS as readonly string[]).includes(patch.kind))
      throw new Error(`unknown kind '${patch.kind}': allowed kinds are ${KINDS.join(", ")}`);
    setField(file, "kind", patch.kind);
  }
  for (const k of ["parent", "blocked_by", "related"] as const) {
    const v = patch[k];
    if (v === undefined) continue;
    if (v === null || (Array.isArray(v) && v.length === 0 && k !== "parent")) {
      deleteField(file, k);
    } else if (k === "parent") {
      if (typeof v !== "string") throw new Error("parent must be a task ID or null");
      setField(file, k, bare(v));
    } else {
      if (!Array.isArray(v) || v.some((x) => typeof x !== "string"))
        throw new Error(`${k} must be a list of task IDs or null`);
      setField(file, k, v.map(bare));
    }
  }
  const before = new Set(checkProject(root).map((p) => `${p.path}: ${p.message}`));
  writeFileSync(join(root, e.path), serializeTaskFile(file));
  const added = checkProject(root).filter((p) => !before.has(`${p.path}: ${p.message}`));
  if (added.length > 0) {
    writeFileSync(join(root, e.path), e.text);
    throw new Error(added[0]?.message ?? "the change breaks a rule");
  }
  return load(root, e.stem);
}

/** Append text to the body after one blank line. */
export function addNote(root: string, ref: string, text: string): TaskEntry {
  if (typeof text !== "string" || text.trim() === "") throw new Error("text must not be empty");
  const e = load(root, ref);
  const file = parsed(e);
  file.body = `${file.body.trimEnd()}\n\n${text.trimEnd()}\n`;
  writeFileSync(join(root, e.path), serializeTaskFile(file));
  return load(root, e.stem);
}

/** The task object the API returns (body included). */
export function taskObject(e: TaskEntry) {
  const file = parsed(e);
  const f = fields(file);
  const list = (k: string) => (Array.isArray(f[k]) ? (f[k] as unknown[]).map(String) : []);
  return {
    id: String(f.id ?? e.nameId),
    title: String(f.title ?? ""),
    kind: String(f.kind ?? ""),
    state: e.state,
    created: String(f.created ?? ""),
    resolved: typeof f.resolved === "string" ? f.resolved : null,
    parent: typeof f.parent === "string" ? f.parent : null,
    blocked_by: list("blocked_by"),
    related: list("related"),
    path: e.path,
    body: file.body,
  };
}
