import { readDocument } from "./documents.ts";
import { type Guide, readGuide } from "./guides.ts";
import { BrokenLayers, renderSection } from "./layers.ts";
import { templateFor } from "./parts.ts";
import type { PlanGroup } from "./plan.ts";
import { xmlBlock, xmlOpen } from "./prime.ts";
import { listTaskFiles, parseOrThrow, resolveRef, type TaskEntry } from "./store.ts";
import { fields, readGuides } from "./taskfile.ts";
import { PHASE_PART_OF, PHASES, type Phase } from "./workflow.ts";

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
      else if (r?.layers) throw r.layers;
      else if (r) why = r.error;
    } catch (e) {
      if (e instanceof BrokenLayers) throw e;
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

/** The H2 of phases.md that holds the steps of every phase. */
const EVERY_PHASE = "every phase";

/**
 * The steps of `phase`: its H2 of the merged phases.md (or a line saying there are none), then
 * the "Every phase" H2 when there is one.
 */
function stepsFor(root: string, project: string, phase: Phase): string {
  const sections = readDocument(root, project, "phases.md")?.children ?? [];
  const h2 = (name: string) => sections.find((s) => s.name.toLowerCase() === name);
  const own = h2(phase);
  const every = h2(EVERY_PHASE);
  return [
    own ? renderSection(own) : `The workflow has no steps for the ${phase} phase.\n`,
    ...(every ? [renderSection(every)] : []),
  ].join("\n");
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
  const steps = stepsFor(root, project, phase).replace(/\bID\b/g, e.nameId);
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
