import { type Guide, readGuide } from "./guides.ts";
import { templateFor } from "./parts.ts";
import type { PlanGroup } from "./plan.ts";
import { xmlBlock, xmlOpen } from "./prime.ts";
import { listTaskFiles, parseOrThrow, resolveRef, type TaskEntry } from "./store.ts";
import { fields, readGuides } from "./taskfile.ts";
import { PHASE_PART_OF, PHASES, type Phase } from "./workflow.ts";

/** The steps for each phase, built into flume (the specific half of the workflow text). */
export const PHASE_STEPS: Record<Phase, string> = {
  proposal: `Phase proposal: check that the task has a clear proposal, goal and scope.
- Read the task: flume task show ID body.
- If the proposal, goal or scope is unclear, ask the human (assign the task to them: flume task assign ID human).
- Write them in the body: flume task write ID body, starting from the template below (or the existing text).
- When they are clear, move on: flume task phase ID design.`,
  design: `Phase design: think through the design questions and write the design.
- Read the body: flume task show ID body.
- Write the design: flume task write ID design, starting from the template below.
- Record each decision, the alternatives and why this one. Ask the human about anything open.
- When the design is clear, move on: flume task phase ID specs.`,
  specs: `Phase specs: write the spec, clear requirements in EARS form.
- Read the body and design: flume task show ID body, flume task show ID design.
- Write the spec: flume task write ID spec, starting from the template below.
- A requirement is one EARS sentence ("When <trigger>, the system SHALL <response>") with Given/When/Then scenarios.
- When the spec is clear, move on: flume task phase ID plan.`,
  plan: `Phase plan: write the plan, how to implement the task step by step.
- Read the body, design and spec: flume task show ID PART.
- Write the plan: flume task write ID plan, starting from the template below. Numbered groups of numbered items.
- Decide which guides (flume guide) apply to each group and name them with Guide: lines under the group's heading, before its items. The guides are printed with the group when an agent runs flume task next.
- Then mark the task ready: flume task phase ID implement.`,
  implement: `Phase implement: do the plan, one group at a time.
- Read the body, design and spec for context.
- Get the current group of plan items and its guides: flume task next ID.
- Do the items, and report each one: flume task done ID ITEM, or flume task skip ID ITEM --reason TEXT if it should not be done. Repeat until the plan is complete.
- When writing code, enter a git worktree to make the changes; when done, merge main into it, then exit the worktree and merge it into main.
- Close the task when done: flume task close ID.`,
};

/** Steps that hold in every phase. */
export const COMMON_STEPS = `In every phase:
- If you see guides (flume guide) that matter for a later phase of this task, push them: flume task guide ID NAME --phase PHASE. Read any guide that matters for your own work now: flume guide NAME.
- Record important conversations with the human as comments (flume task comment ID), quoting the human verbatim.
- When your phase is done, set the next phase (flume task phase ID PHASE). Another agent may take the next phase. If you are waiting on the human, assign the task back to them (flume task assign ID human).`;

const find = (root: string, ref: string): TaskEntry => {
  const e = resolveRef(listTaskFiles(root), ref);
  if (!e) throw new Error(`no task '${ref}'`);
  return e;
};

const projectOf = (e: TaskEntry): string => {
  const p = fields(parseOrThrow(e)).project;
  return typeof p === "string" ? p : "";
};

/** A pushed guide as found: its text, or why it is not available (it has gone, or is broken). */
export interface PushedGuide {
  name: string;
  stage?: string;
  body?: string;
  missing?: string;
}

function lookup(root: string, project: string, names: string[]): PushedGuide[] {
  return names.map((name) => {
    let g: Guide | undefined;
    let why = "no longer exists";
    try {
      const r = readGuide(root, project, name);
      if (r?.ok) g = r.guide;
      else if (r) why = r.error;
    } catch (e) {
      why = (e as Error).message;
    }
    return g
      ? { name, ...(g.stage ? { stage: g.stage } : {}), body: g.body }
      : { name, missing: `Pushed guide ${name} is not available: ${why}` };
  });
}

/** One guide element per pushed guide; one that is gone gets a guide_missing element. */
export function guideBlocks(guides: PushedGuide[]): string[] {
  return guides.map((g) =>
    g.body === undefined
      ? xmlBlock("guide_missing", { name: g.name }, g.missing ?? "")
      : xmlBlock("guide", { name: g.name, stage: g.stage }, g.body),
  );
}

/**
 * The instructions for the task's current phase, as agent text: one flume_instructions element
 * holding the phase's steps, the template of the part the phase writes, and each guide pushed to
 * the phase in its own guide element (a guide that has gone is reported in a guide_missing element).
 */
export function instructionsFor(root: string, ref: string): { phase: Phase; text: string } {
  const e = find(root, ref);
  const f = fields(parseOrThrow(e));
  const phase: Phase =
    typeof f.phase === "string" && (PHASES as readonly string[]).includes(f.phase)
      ? (f.phase as Phase)
      : "proposal";
  const project = projectOf(e);
  const steps = `${PHASE_STEPS[phase].replace(/\bID\b/g, e.nameId)}\n\n${COMMON_STEPS.replace(/\bID\b/g, e.nameId)}`;
  const parts = [xmlBlock("steps", { phase }, steps)];
  const part = PHASE_PART_OF[phase];
  if (part) parts.push(xmlBlock("template", { part }, templateFor(root, project, part)));
  parts.push(...guideBlocks(lookup(root, project, readGuides(parseOrThrow(e))[phase] ?? [])));
  return {
    phase,
    text: `${xmlOpen("flume_instructions", { task: e.nameId, phase })}\n${parts.join("\n")}</flume_instructions>\n`,
  };
}

/** The guides for a plan group: the ones it names, then those pushed to implement, once each. */
export function groupGuides(root: string, ref: string, group: PlanGroup): PushedGuide[] {
  const e = find(root, ref);
  const pushed = readGuides(parseOrThrow(e)).implement ?? [];
  return lookup(root, projectOf(e), [...new Set([...group.guides, ...pushed])]);
}
