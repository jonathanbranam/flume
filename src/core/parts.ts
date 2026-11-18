import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readGuide } from "./guides.ts";
import { flumeRoot } from "./layout.ts";
import { checkPlan, currentGroup, markItems, type PlanGroup, parsePlan } from "./plan.ts";
import { SEGMENT_RE } from "./prime.ts";
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

export const BUILTIN_TEMPLATES: Record<WritablePart, string> = {
  body: `## Proposal
<!-- What is proposed, and why. -->

## Goal
<!-- What is true when this is done. -->

## Scope
### In scope

### Out of scope
`,
  design: `## Context
<!-- Background and constraints. -->

## Goals / Non-goals

## Decisions
<!-- Each decision, the alternatives and why this one. -->

## Risks / Trade-offs
`,
  spec: `## Requirements
### Requirement: <name>
<!-- One EARS sentence: When <trigger>, the system SHALL <response>. -->

#### Scenario: <name>
- GIVEN <state>
- WHEN <action>
- THEN <result>
`,
  plan: `## 1. <group name>
<!-- Numbered groups, each with numbered items; [ ] open, [x] done, [-] skipped. -->
<!-- Optional: Guide: <name> lines under a heading, before its items, name guides for that group (flume guide lists them). -->

- [ ] 1.1 <item>
- [ ] 1.2 <item>
`,
};

/**
 * The template for a part: projects/<project>/templates/<part>.md of the flume-root, else
 * base/templates/<part>.md, else the built-in one. The most specific is used whole.
 */
export function templateFor(root: string, project: string, part: string): string {
  const name = mustPart(part);
  if (project !== "" && !SEGMENT_RE.test(project))
    throw new Error(`project '${project}' is not a plain name`);
  const fr = flumeRoot(root);
  const files = [
    ...(project ? [join(fr, "projects", project, "templates", `${name}.md`)] : []),
    join(fr, "base", "templates", `${name}.md`),
  ];
  const f = files.find((x) => existsSync(x));
  return f ? readFileSync(f, "utf8") : BUILTIN_TEMPLATES[name];
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
