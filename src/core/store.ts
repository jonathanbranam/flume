import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { checkProject } from "./check.ts";
import { isValidId, mintId } from "./ids.ts";
import { rel } from "./layout.ts";
import { slugify } from "./slug.ts";
import {
  deleteField,
  fields,
  KINDS,
  newTaskFile,
  parseTaskYaml,
  serializeTaskYaml,
  setField,
  type TaskFile,
} from "./taskfile.ts";

export type State = "open" | "resolved";

export const TASK_YAML = "task.yaml";
export const BODY_MD = "body.md";
export const COMMENTS_MD = "comments.md";

export interface TaskEntry {
  state: State;
  /** The task folder, relative to the tasks repo root. */
  path: string;
  /** Folder name. */
  stem: string;
  /** The last 4 characters of the stem (empty when the stem is shorter). */
  nameId: string;
  /** task.yaml as stored; undefined when the file is missing. */
  yaml: string | undefined;
  /** body.md as stored; undefined when the file is missing. */
  body: string | undefined;
  /** comments.md as stored; empty when the file is missing. */
  comments: string;
}

const dirOf = (root: string, state: State) => rel(root, "tasks", state);

const readOr = <T>(file: string, fallback: T): string | T =>
  existsSync(file) ? readFileSync(file, "utf8") : fallback;

/** Every task folder in open and resolved, sorted by path. Missing folders count as empty. */
export function listTaskFiles(root: string): TaskEntry[] {
  const out: TaskEntry[] = [];
  for (const state of ["open", "resolved"] as const) {
    const base = dirOf(root, state);
    const dir = join(root, base);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir).sort()) {
      const folder = join(dir, name);
      if (!statSync(folder).isDirectory()) continue;
      out.push({
        state,
        path: `${base}/${name}`,
        stem: name,
        nameId: name.length >= 4 ? name.slice(-4) : "",
        yaml: readOr(join(folder, TASK_YAML), undefined),
        body: readOr(join(folder, BODY_MD), undefined),
        comments: readOr(join(folder, COMMENTS_MD), "") as string,
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
  project?: string;
  blockedBy?: string[];
  related?: string[];
  /** Defaults to the current time. */
  now?: Date;
}

const DEFAULT_BODY = "## The ask\n\n";

/** Create a task folder in open. Throws, writing nothing, when the kind or parent is refused. */
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
  const file = newTaskFile();
  setField(file, "id", id);
  setField(file, "title", t.title);
  setField(file, "kind", t.kind);
  setField(file, "status", "open");
  setField(file, "created", (t.now ?? new Date()).toISOString().slice(0, 10));
  if (t.project) setField(file, "project", t.project);
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
  const name = `${slugify(t.title)}-${id}`;
  const folder = join(root, dirOf(root, "open"), name);
  const linked = Boolean(t.blockedBy?.length || t.related?.length);
  const before = linked ? new Set(checkProject(root).map((p) => `${p.path}: ${p.message}`)) : null;
  mkdirSync(folder, { recursive: true });
  writeFileSync(join(folder, TASK_YAML), serializeTaskYaml(file));
  writeFileSync(join(folder, BODY_MD), t.body ?? DEFAULT_BODY);
  if (before) {
    const added = checkProject(root).filter((p) => !before.has(`${p.path}: ${p.message}`));
    if (added.length > 0) {
      rmSync(folder, { recursive: true, force: true });
      throw new Error(added[0]?.message ?? "the change breaks a rule");
    }
  }
  return listTaskFiles(root).find((e) => e.nameId === id) as TaskEntry;
}

function bare(entries: TaskEntry[], ref: string): string {
  return resolveRef(entries, ref)?.nameId ?? ref;
}

/** The parsed task.yaml of an entry; throws when it is missing or unreadable. */
export function parseOrThrow(e: TaskEntry): TaskFile {
  if (e.yaml === undefined) throw new Error(`${e.path}: ${TASK_YAML} missing`);
  const r = parseTaskYaml(e.yaml);
  if (!r.ok) throw new Error(`${e.path}: ${r.error}`);
  return r.file;
}

function mustFind(root: string, ref: string): TaskEntry {
  const e = resolveRef(listTaskFiles(root), ref);
  if (!e) throw new Error(`no task '${ref}'`);
  return e;
}

/** Change the title field only; the folder name stays. */
export function retitleTask(root: string, ref: string, title: string): TaskEntry {
  const e = mustFind(root, ref);
  const file = parseOrThrow(e);
  setField(file, "title", title);
  writeFileSync(join(root, e.path, TASK_YAML), serializeTaskYaml(file));
  return mustFind(root, ref);
}

/** Move to resolved, set status and stamp `resolved` (task.yaml only; other files are untouched). */
export function resolveTask(root: string, ref: string, now: Date = new Date()): TaskEntry {
  const e = mustFind(root, ref);
  if (e.state === "resolved") throw new Error(`task '${ref}' is already resolved`);
  const file = parseOrThrow(e);
  setField(file, "status", "resolved");
  setField(file, "resolved", `${now.toISOString().slice(0, 19)}Z`);
  return move(root, e, file, "resolved");
}

/** Move back to open, set status and remove `resolved`. */
export function reopenTask(root: string, ref: string): TaskEntry {
  const e = mustFind(root, ref);
  if (e.state === "open") throw new Error(`task '${ref}' is already open`);
  const file = parseOrThrow(e);
  setField(file, "status", "open");
  deleteField(file, "resolved");
  return move(root, e, file, "open");
}

/** Write task.yaml, then move the whole folder, so any other file in it travels along. */
function move(root: string, e: TaskEntry, file: TaskFile, to: State): TaskEntry {
  mkdirSync(join(root, dirOf(root, to)), { recursive: true });
  writeFileSync(join(root, e.path, TASK_YAML), serializeTaskYaml(file));
  renameSync(join(root, e.path), join(root, dirOf(root, to), e.stem));
  return mustFind(root, e.stem);
}
