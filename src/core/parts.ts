import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { documentText } from "./documents.ts";
import { readGuide } from "./guides.ts";
import { checkPlan, currentGroup, markItems, type PlanGroup, parsePlan } from "./plan.ts";
import { listTaskFiles, parseOrThrow, resolveRef, type TaskEntry } from "./store.ts";
import { fields } from "./taskfile.ts";
import { PART_FILES, WRITABLE_PARTS, type WritablePart } from "./workflow.ts";

export const isWritablePart = (p: string): p is WritablePart =>
  (WRITABLE_PARTS as readonly string[]).includes(p);

function mustFind(root: string, ref: string): TaskEntry {
  const e = resolveRef(listTaskFiles(root), ref);
  if (!e) throw new Error(`no task '${ref}'`);
  return e;
}

function mustPart(part: string): WritablePart {
  if (!isWritablePart(part))
    throw new Error(`unknown part '${part}': parts are ${WRITABLE_PARTS.join(", ")}`);
  return part;
}

/** The text of a part, or undefined when the task has not got it. */
export function readPart(root: string, ref: string, part: string): string | undefined {
  const e = mustFind(root, ref);
  const file = PART_FILES[part];
  if (!file)
    throw new Error(`unknown part '${part}': parts are ${Object.keys(PART_FILES).join(", ")}`);
  const p = join(root, e.path, file);
  return existsSync(p) ? readFileSync(p, "utf8") : undefined;
}

/** Replace a part's text. A plan not in the plan form is refused, nothing written. */
export function writePart(root: string, ref: string, part: string, text: string): TaskEntry {
  const name = mustPart(part);
  if (typeof text !== "string" || text.trim() === "") throw new Error("the text is empty");
  const e = mustFind(root, ref);
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
  writeFileSync(
    join(root, e.path, PART_FILES[name] as string),
    text.endsWith("\n") ? text : `${text}\n`,
  );
  return mustFind(root, ref);
}

/** Remove a part. The body cannot be removed (every task has one). */
export function removePart(root: string, ref: string, part: string): TaskEntry {
  const name = mustPart(part);
  if (name === "body") throw new Error("the body cannot be removed; write a new one instead");
  const e = mustFind(root, ref);
  const p = join(root, e.path, PART_FILES[name] as string);
  if (!existsSync(p)) throw new Error(`task ${e.nameId} has no ${name}`);
  rmSync(p);
  return mustFind(root, ref);
}

/**
 * The template for a part: templates/<part>.md merged by heading over flume's shipped one, the
 * workspace's (base/) and the project's. Throws BrokenLayers.
 */
export function templateFor(root: string, project: string, part: string): string {
  const name = mustPart(part);
  return documentText(root, project, `templates/${name}.md`);
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
  writeFileSync(join(root, e.path, PART_FILES.plan as string), markItems(text, items, to, reason));
  return mustFind(root, ref);
}
