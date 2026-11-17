import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { checkProject } from "./check.ts";
import { isValidId, mintId } from "./ids.ts";
import { slugify } from "./slug.ts";
import {
  deleteField,
  fields,
  KINDS,
  newTaskFile,
  parseTaskFile,
  serializeTaskFile,
  setField,
  type TaskFile,
} from "./taskfile.ts";

export const OPEN_DIR = "flume/tasks/open";
export const RESOLVED_DIR = "flume/tasks/resolved";

export type State = "open" | "resolved";

export interface TaskEntry {
  state: State;
  /** Path relative to the project root. */
  path: string;
  /** File name without .md. */
  stem: string;
  /** The last 4 characters of the stem (empty when the stem is shorter). */
  nameId: string;
  text: string;
}

const dirOf = (state: State) => (state === "open" ? OPEN_DIR : RESOLVED_DIR);

/** Every .md file in open and resolved, sorted by path. Missing folders count as empty. */
export function listTaskFiles(root: string): TaskEntry[] {
  const out: TaskEntry[] = [];
  for (const state of ["open", "resolved"] as const) {
    const dir = join(root, dirOf(state));
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir).sort()) {
      if (!name.endsWith(".md")) continue;
      const stem = name.slice(0, -3);
      out.push({
        state,
        path: `${dirOf(state)}/${name}`,
        stem,
        nameId: stem.length >= 4 ? stem.slice(-4) : "",
        text: readFileSync(join(dir, name), "utf8"),
      });
    }
  }
  return out;
}

/** Find a task by bare ID, file stem, or [[stem]] / [[stem|label]] link text. */
export function resolveRef(entries: TaskEntry[], ref: string): TaskEntry | undefined {
  let r = ref.trim();
  const m = /^\[\[([^\]|]+)(?:\|[^\]]*)?\]\]$/.exec(r);
  if (m) r = (m[1] ?? "").trim();
  r = r.replace(/\.md$/, "");
  if (isValidId(r)) return entries.find((e) => e.nameId === r);
  return entries.find((e) => e.stem === r);
}

export interface NewTask {
  title: string;
  kind: string;
  body?: string;
  parent?: string;
  blockedBy?: string[];
  related?: string[];
  /** Defaults to the current time. */
  now?: Date;
}

const DEFAULT_BODY = "## The ask\n\n";

/** Create a task file in open. Throws, writing nothing, when the kind or parent is refused. */
export function createTask(root: string, t: NewTask): TaskEntry {
  if (!(KINDS as readonly string[]).includes(t.kind)) {
    throw new Error(`unknown kind '${t.kind}': allowed kinds are ${KINDS.join(", ")}`);
  }
  const entries = listTaskFiles(root);
  if (t.parent !== undefined) {
    const p = resolveRef(entries, t.parent);
    const kind = p ? fields(parseOrThrow(p)).kind : undefined;
    if (!p) throw new Error(`parent ${t.parent} names no task`);
    if (kind !== "epic") throw new Error(`parent ${t.parent} is not an epic`);
    if (t.kind === "epic") throw new Error("an epic has no parent");
  }
  const id = mintId(new Set(entries.map((e) => e.nameId)));
  const file = newTaskFile(t.body ?? DEFAULT_BODY);
  setField(file, "id", id);
  setField(file, "title", t.title);
  setField(file, "kind", t.kind);
  setField(file, "created", (t.now ?? new Date()).toISOString().slice(0, 10));
  if (t.parent !== undefined) setField(file, "parent", bare(entries, t.parent));
  if (t.blockedBy?.length)
    setField(
      file,
      "blocked_by",
      t.blockedBy.map((r) => bare(entries, r)),
    );
  if (t.related?.length)
    setField(
      file,
      "related",
      t.related.map((r) => bare(entries, r)),
    );
  const name = `${slugify(t.title)}-${id}.md`;
  mkdirSync(join(root, OPEN_DIR), { recursive: true });
  const path = join(root, OPEN_DIR, name);
  const linked = Boolean(t.blockedBy?.length || t.related?.length);
  const before = linked ? new Set(checkProject(root).map((p) => `${p.path}: ${p.message}`)) : null;
  writeFileSync(path, serializeTaskFile(file));
  if (before) {
    const added = checkProject(root).filter((p) => !before.has(`${p.path}: ${p.message}`));
    if (added.length > 0) {
      unlinkSync(path);
      throw new Error(added[0]?.message ?? "the change breaks a rule");
    }
  }
  return listTaskFiles(root).find((e) => e.nameId === id) as TaskEntry;
}

function bare(entries: TaskEntry[], ref: string): string {
  return resolveRef(entries, ref)?.nameId ?? ref;
}

function parseOrThrow(e: TaskEntry): TaskFile {
  const r = parseTaskFile(e.text);
  if (!r.ok) throw new Error(`${e.path}: ${r.error}`);
  return r.file;
}

function mustFind(root: string, ref: string): TaskEntry {
  const e = resolveRef(listTaskFiles(root), ref);
  if (!e) throw new Error(`no task '${ref}'`);
  return e;
}

/** Change the title line only; the file name stays. */
export function retitleTask(root: string, ref: string, title: string): TaskEntry {
  const e = mustFind(root, ref);
  const file = parseOrThrow(e);
  setField(file, "title", title);
  writeFileSync(join(root, e.path), serializeTaskFile(file));
  return mustFind(root, ref);
}

/** Move to resolved and stamp `resolved`. */
export function resolveTask(root: string, ref: string, now: Date = new Date()): TaskEntry {
  const e = mustFind(root, ref);
  if (e.state === "resolved") throw new Error(`task '${ref}' is already resolved`);
  const file = parseOrThrow(e);
  setField(file, "resolved", `${now.toISOString().slice(0, 19)}Z`);
  return move(root, e, file, "resolved");
}

/** Move back to open and remove `resolved`. */
export function reopenTask(root: string, ref: string): TaskEntry {
  const e = mustFind(root, ref);
  if (e.state === "open") throw new Error(`task '${ref}' is already open`);
  const file = parseOrThrow(e);
  deleteField(file, "resolved");
  return move(root, e, file, "open");
}

function move(root: string, e: TaskEntry, file: TaskFile, to: State): TaskEntry {
  mkdirSync(join(root, dirOf(to)), { recursive: true });
  writeFileSync(join(root, e.path), serializeTaskFile(file));
  renameSync(join(root, e.path), join(root, dirOf(to), `${e.stem}.md`));
  return mustFind(root, e.stem);
}
