import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { documentText } from "./documents.ts";
import { readGuide } from "./guides.ts";
import { checkPlan, currentGroup, markItems, type PlanGroup, parsePlan } from "./plan.ts";
import { SEGMENT_RE } from "./prime.ts";
import { listTaskFiles, parseOrThrow, resolveRef, type TaskEntry } from "./store.ts";
import { fields } from "./taskfile.ts";

/** A part is stored in the task folder as <name>.md. */
const partFile = (name: string) => `${name}.md`;

/** The names of the parts a task folder holds: body first, comments last, the rest by name. */
export function listParts(folder: string): string[] {
  const rank = (p: string) => (p === "body" ? 0 : p === "comments" ? 2 : 1);
  return readdirSync(folder)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.slice(0, -3))
    .filter((p) => SEGMENT_RE.test(p))
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

function mustFind(root: string, ref: string): TaskEntry {
  const e = resolveRef(listTaskFiles(root), ref);
  if (!e) throw new Error(`no task '${ref}'`);
  return e;
}

export function mustPartName(part: string): string {
  if (!SEGMENT_RE.test(part))
    throw new Error(
      `'${part}' is not a part name: use letters, digits, dots, hyphens and underscores, starting with a letter or digit`,
    );
  return part;
}

/**
 * A part that may be written or removed: any plain name but comments (appended to with flume task
 * comment). A name differing only in case from a part the task has would collide on some disks.
 */
function mustOwnPart(e: TaskEntry, part: string): string {
  const name = mustPartName(part);
  const lower = name.toLowerCase();
  if (lower === "comments")
    throw new Error("comments are added with flume task comment, not written as a part");
  const other = ["body", ...e.parts].find((p) => p.toLowerCase() === lower && p !== name);
  if (other) throw new Error(`part '${name}' differs only in case from the part '${other}'`);
  return name;
}

/** The text of a part, or undefined when the task has not got it. */
export function readPart(root: string, ref: string, part: string): string | undefined {
  const e = mustFind(root, ref);
  const p = join(root, e.path, partFile(mustPartName(part)));
  return existsSync(p) ? readFileSync(p, "utf8") : undefined;
}

/** Replace a part's text. A plan not in the plan form is refused, nothing written. */
export function writePart(root: string, ref: string, part: string, text: string): TaskEntry {
  if (typeof text !== "string" || text.trim() === "") throw new Error("the text is empty");
  const e = mustFind(root, ref);
  const name = mustOwnPart(e, part);
  if (name === "plan") {
    const bad = checkPlan(text);
    if (bad) throw new Error(`the plan is not in the plan form: ${bad}`);
    const project = fields(parseOrThrow(e)).project;
    const parsed = parsePlan(text);
    for (const g of parsed.ok ? parsed.groups : [])
      for (const n of g.guides)
        if (!readGuide(root, typeof project === "string" ? project : "", n))
          throw new Error(
            `group ${g.number} names the guide ${n}, which does not exist; list them with: flume guide`,
          );
  }
  writeFileSync(join(root, e.path, partFile(name)), text.endsWith("\n") ? text : `${text}\n`);
  return mustFind(root, ref);
}

/** Remove a part. The body cannot be removed (every task has one). */
export function removePart(root: string, ref: string, part: string): TaskEntry {
  const e = mustFind(root, ref);
  const name = mustOwnPart(e, part);
  if (name === "body") throw new Error("the body cannot be removed; write a new one instead");
  const p = join(root, e.path, partFile(name));
  if (!existsSync(p)) throw new Error(`task ${e.nameId} has no ${name}`);
  rmSync(p);
  return mustFind(root, ref);
}

/**
 * The template for a part: templates/<part>.md merged by heading over the built-in one, the
 * workspace's (workspace/) and the project's; "" when no layer has one. Throws BrokenLayers.
 */
export function templateFor(root: string, project: string, part: string): string {
  return documentText(root, project, `templates/${mustPartName(part)}.md`);
}

function planOf(root: string, ref: string): { e: TaskEntry; text: string } {
  const e = mustFind(root, ref);
  const text = readPart(root, ref, "plan");
  if (text === undefined)
    throw new Error(
      `task ${e.nameId} has no plan yet; start from the template: flume task template plan`,
    );
  return { e, text };
}

/** The current plan group, or undefined when every item is done or skipped. */
export function nextGroup(root: string, ref: string): PlanGroup | undefined {
  const r = parsePlan(planOf(root, ref).text);
  if (!r.ok) throw new Error(`the plan is not in the plan form: ${r.error}`);
  return currentGroup(r.groups);
}

/** Mark items of the current group done, or skipped with a reason. */
export function markPlan(
  root: string,
  ref: string,
  items: string[],
  to: "done" | "skipped",
  reason?: string,
): TaskEntry {
  if (items.length === 0 || items.some((i) => typeof i !== "string"))
    throw new Error("name the items to mark, as in 1.1 1.2");
  if (to === "skipped" && (typeof reason !== "string" || reason.trim() === ""))
    throw new Error("a skip needs a reason");
  const { e, text } = planOf(root, ref);
  writeFileSync(join(root, e.path, partFile("plan")), markItems(text, items, to, reason));
  return mustFind(root, ref);
}
