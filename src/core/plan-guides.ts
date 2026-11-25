import { type Guide, readGuide } from "./guides.ts";
import { BrokenLayers } from "./layers.ts";
import type { PlanGroup } from "./plan.ts";
import { xmlBlock } from "./prime.ts";
import { listTaskFiles, parseOrThrow, resolveRef } from "./store.ts";
import { fields } from "./taskfile.ts";

/** A guide a plan group names, as found: its text, or why it is not available. */
export interface GroupGuide {
  name: string;
  stage?: string;
  body?: string;
  missing?: string;
}

/** The guides a plan group names, for the task's project. Throws BrokenLayers. */
export function groupGuides(root: string, ref: string, group: PlanGroup): GroupGuide[] {
  const e = resolveRef(listTaskFiles(root), ref);
  if (!e) throw new Error(`no task '${ref}'`);
  const p = fields(parseOrThrow(e)).project;
  const project = typeof p === "string" ? p : "";
  return group.guides.map((name) => {
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
      : { name, missing: `Guide ${name} is not available: ${why}` };
  });
}

/** One guide element per guide; one that is gone gets a guide_missing element. */
export function guideBlocks(guides: GroupGuide[]): string[] {
  return guides.map((g) =>
    g.body === undefined
      ? xmlBlock("guide_missing", { name: g.name }, g.missing ?? "")
      : xmlBlock("guide", { name: g.name, stage: g.stage }, g.body),
  );
}
