import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { checkProject } from "./check.ts";
import { readGuide } from "./guides.ts";
import {
  COMMENTS_MD,
  listTaskFiles,
  parseOrThrow,
  resolveRef,
  TASK_YAML,
  type TaskEntry,
} from "./store.ts";
import {
  deleteField,
  fields,
  KINDS,
  readGuides,
  serializeTaskYaml,
  setField,
  writeGuides,
} from "./taskfile.ts";
import { isPhase, PHASES, type Phase } from "./workflow.ts";

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

/**
 * Apply every field or none. The file is rewritten, the project is checked, and when the change
 * adds a problem the original text is put back and the change is refused.
 */
export function updateTask(root: string, ref: string, patch: TaskPatch): TaskEntry {
  const e = load(root, ref);
  const entries = listTaskFiles(root);
  const bare = (r: string) => resolveRef(entries, r)?.nameId ?? r;
  const file = parseOrThrow(e);
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
  const yamlPath = join(root, e.path, TASK_YAML);
  writeFileSync(yamlPath, serializeTaskYaml(file));
  const added = checkProject(root).filter((p) => !before.has(`${p.path}: ${p.message}`));
  if (added.length > 0) {
    writeFileSync(yamlPath, e.yaml ?? "");
    throw new Error(added[0]?.message ?? "the change breaks a rule");
  }
  return load(root, e.stem);
}

/** Write task.yaml after `edit` changed the parsed file; returns the reloaded entry. */
function editYaml(
  root: string,
  ref: string,
  edit: (file: ReturnType<typeof parseOrThrow>) => void,
) {
  const e = load(root, ref);
  const file = parseOrThrow(e);
  edit(file);
  writeFileSync(join(root, e.path, TASK_YAML), serializeTaskYaml(file));
  return load(root, e.stem);
}

/** Who holds the task now: an agent name, "human", or "" when nobody. */
export function assigneeOf(e: TaskEntry): string {
  const a = fields(parseOrThrow(e)).assignee;
  return typeof a === "string" ? a : "";
}

/**
 * Set assignee (and agent, when the assignee is an agent). `actor` is the agent running the
 * command, or undefined for the human. An agent taking a task that someone else holds needs
 * `force`; assigning to the current holder changes nothing.
 */
export function assignTask(
  root: string,
  ref: string,
  assignee: string,
  actor: string | undefined,
  force: boolean,
): { entry: TaskEntry; changed: boolean } {
  if (typeof assignee !== "string" || assignee.trim() === "" || /\s/.test(assignee))
    throw new Error("the assignee must be an agent name or human");
  const e = load(root, ref);
  const holder = assigneeOf(e);
  if (holder === assignee) return { entry: e, changed: false };
  if (actor !== undefined && holder !== "" && !force)
    throw new Error(`task ${e.nameId} is held by ${holder}; use --force to take it over`);
  const entry = editYaml(root, ref, (file) => {
    setField(file, "assignee", assignee);
    if (assignee !== "human") setField(file, "agent", assignee);
  });
  return { entry, changed: true };
}

/** Set the phase; any phase may follow any other. */
export function setPhase(root: string, ref: string, phase: string): TaskEntry {
  if (!isPhase(phase)) throw new Error(`unknown phase '${phase}': phases are ${PHASES.join(", ")}`);
  return editYaml(root, ref, (file) => setField(file, "phase", phase));
}

/** The phase the task is in now. */
export function phaseOf(e: TaskEntry): Phase {
  const p = fields(parseOrThrow(e)).phase;
  return typeof p === "string" && isPhase(p) ? p : "proposal";
}

/**
 * Record (or with `remove` drop) that guide `name` applies to `phase` of the task. Refused,
 * changing nothing, when `phase` is earlier than the task's current phase, when the guide does
 * not exist for the task's project (adding only), or when a removed guide is not pushed there.
 * Returns the entry and whether anything changed (pushing a guide already there changes nothing).
 */
export function pushGuide(
  root: string,
  ref: string,
  name: string,
  phase: string,
  remove: boolean,
): { entry: TaskEntry; changed: boolean } {
  if (!isPhase(phase)) throw new Error(`unknown phase '${phase}': phases are ${PHASES.join(", ")}`);
  const e = load(root, ref);
  const now = phaseOf(e);
  if (PHASES.indexOf(phase) < PHASES.indexOf(now))
    throw new Error(
      `the task is in phase ${now}, past ${phase}; move it back first with: flume task phase ${e.nameId} ${phase}`,
    );
  const file = parseOrThrow(e);
  const all = readGuides(file);
  const has = (all[phase] ?? []).includes(name);
  if (remove) {
    if (!has) throw new Error(`guide ${name} is not pushed to phase ${phase} of task ${e.nameId}`);
    all[phase] = (all[phase] ?? []).filter((n) => n !== name);
  } else {
    const project = fields(file).project;
    const g = readGuide(root, typeof project === "string" ? project : "", name);
    if (!g) throw new Error(`no guide ${name}; list them with: flume guide`);
    if (!g.ok) throw new Error(g.error);
    if (has) return { entry: e, changed: false };
    all[phase] = [...(all[phase] ?? []), name];
  }
  writeGuides(file, all, PHASES);
  writeFileSync(join(root, e.path, TASK_YAML), serializeTaskYaml(file));
  return { entry: load(root, e.stem), changed: true };
}

/** Local time with its UTC offset, minutes precision: 2026-11-17 14:05 -05:00. */
export function commentTime(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const off = -d.getTimezoneOffset();
  const a = Math.abs(off);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())} ${off < 0 ? "-" : "+"}${p(Math.floor(a / 60))}:${p(a % 60)}`;
}

/** Append a comment to comments.md (created when missing), after one blank line. */
export function addComment(
  root: string,
  ref: string,
  text: string,
  author: string,
  now: Date = new Date(),
): TaskEntry {
  if (typeof text !== "string" || text.trim() === "") throw new Error("text must not be empty");
  const e = load(root, ref);
  const old = e.comments.trimEnd();
  const next = `${old === "" ? "" : `${old}\n\n`}### ${commentTime(now)}, ${author}\n\n${text.trimEnd()}\n`;
  writeFileSync(join(root, e.path, COMMENTS_MD), next);
  return load(root, e.stem);
}

/** The task object the API returns (body and comments included). */
export function taskObject(e: TaskEntry) {
  const f = fields(parseOrThrow(e));
  const list = (k: string) => (Array.isArray(f[k]) ? (f[k] as unknown[]).map(String) : []);
  return {
    id: String(f.id ?? e.nameId),
    title: String(f.title ?? ""),
    kind: String(f.kind ?? ""),
    state: e.state,
    project: typeof f.project === "string" ? f.project : null,
    created: String(f.created ?? ""),
    resolved: typeof f.resolved === "string" ? f.resolved : null,
    assignee: typeof f.assignee === "string" ? f.assignee : "",
    agent: typeof f.agent === "string" ? f.agent : "",
    phase: typeof f.phase === "string" && isPhase(f.phase) ? f.phase : "proposal",
    guides: readGuides(parseOrThrow(e)),
    parent: typeof f.parent === "string" ? f.parent : null,
    blocked_by: list("blocked_by"),
    related: list("related"),
    path: e.path,
    parts: e.parts,
    body: e.body ?? "",
    comments: e.comments,
    fields: e.yaml ?? "",
  };
}
