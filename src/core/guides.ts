import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseDocument } from "yaml";
import { documentFiles, listFiles, plainName } from "./documents.ts";
import {
  BrokenLayers,
  formatLayerError,
  type Layer,
  mergeLayers,
  renderSection,
} from "./layers.ts";
import { flumeRoot, rel } from "./layout.ts";
import { SEGMENT_RE } from "./prime.ts";

/** What a guide's front matter says about it. A stage key, if a file has one, is ignored. */
export interface GuideInfo {
  name: string;
  description: string;
}

export interface Guide extends GuideInfo {
  body: string;
}

/** A guide file as parsed: also how many lines its front matter takes. */
type Parsed = { ok: true; guide: Guide; offset: number } | { ok: false; error: string };

export type GuideResult =
  | { ok: true; guide: Guide }
  /** `layers` is set when the bodies could not be merged (as opposed to bad front matter). */
  | { ok: false; error: string; layers?: BrokenLayers };

/** Parse a guide file's text: flat YAML front matter between --- lines, then the body. */
export function parseGuide(name: string, text: string): Parsed {
  const m = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/.exec(text);
  if (!m) return { ok: false, error: "front matter missing (a --- block at the top)" };
  const doc = parseDocument(m[1] as string, { schema: "failsafe" });
  if (doc.errors.length > 0)
    return { ok: false, error: `front matter not parsable: ${doc.errors[0]?.message}` };
  const f = doc.toJS();
  if (!f || typeof f !== "object" || Array.isArray(f))
    return { ok: false, error: "front matter is not a set of fields" };
  const r = f as Record<string, unknown>;
  for (const [k, v] of Object.entries(r))
    if (typeof v !== "string")
      return { ok: false, error: `front matter field ${k} is not flat text` };
  if (r.name !== name)
    return {
      ok: false,
      error: `front matter name ${String(r.name)} differs from the file name ${name}`,
    };
  if (typeof r.description !== "string" || r.description === "")
    return { ok: false, error: "front matter field description missing" };
  const guide: Guide = { name, description: r.description, body: m[2] as string };
  const before = text.slice(0, text.length - guide.body.length);
  return { ok: true, guide, offset: before.split("\n").length - 1 };
}

const dirs = (root: string, project: string): string[] => {
  const workspace = join(flumeRoot(root), "workspace", "guides");
  return project ? [join(flumeRoot(root), "projects", project, "guides"), workspace] : [workspace];
};

const names = (dir: string): string[] =>
  listFiles(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.slice(0, -3));

/** The guide files of `name`, lowest layer first, parsed; or the first front matter error. */
export function guideLayers(
  root: string,
  project: string,
  name: string,
): { layers: Layer[]; top: Guide | undefined } | { error: string } {
  const layers: Layer[] = [];
  let top: Guide | undefined;
  for (const f of documentFiles(root, project, `guides/${name}.md`)) {
    const r = parseGuide(name, readFileSync(f.path, "utf8"));
    if (!r.ok) return { error: `${f.file}: ${r.error}` };
    top = r.guide;
    layers.push({ file: f.file, text: r.guide.body, lineOffset: r.offset });
  }
  return { layers, top };
}

/**
 * The guide `name`, its bodies merged by heading (built-in, workspace, project) and its front matter
 * that of the most specific file; undefined when no layer has it.
 */
export function readGuide(root: string, project: string, name: string): GuideResult | undefined {
  plainName("project", project);
  if (!SEGMENT_RE.test(name)) throw new Error(`guide '${name}' is not a plain name`);
  const found = guideLayers(root, project, name);
  if ("error" in found) return { ok: false, error: found.error };
  if (!found.top) return undefined;
  const merged = mergeLayers(found.layers);
  if (merged.errors.length > 0 || !merged.doc) {
    const layers = new BrokenLayers(merged.errors);
    return { ok: false, error: layers.message, layers };
  }
  return { ok: true, guide: { ...found.top, body: renderSection(merged.doc) } };
}

/** The guides available to `project` with good front matter (the project's wins), by name. */
export function listGuides(root: string, project: string): GuideInfo[] {
  plainName("project", project);
  const out = new Map<string, GuideInfo>();
  for (const d of [...dirs(root, project)].reverse())
    for (const n of names(d)) {
      const r = parseGuide(n, readFileSync(join(d, `${n}.md`), "utf8"));
      if (r.ok) {
        const { body: _, ...info } = r.guide;
        out.set(n, info);
      } else out.delete(n);
    }
  return [...out.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * One problem per guide file with missing or unparsable front matter, and one per merge error in a
 * guide's body, workspace and every project.
 */
export function checkGuides(root: string): { path: string; message: string }[] {
  const out: { path: string; message: string }[] = [];
  const projects = listFiles(join(flumeRoot(root), "projects")).filter((p) => SEGMENT_RE.test(p));
  for (const project of ["", ...projects]) {
    const dir = project ? `projects/${project}` : "workspace";
    for (const n of names(join(flumeRoot(root), dir, "guides"))) {
      const path = rel(root, dir, "guides", `${n}.md`);
      const r = parseGuide(n, readFileSync(join(root, path), "utf8"));
      if (!r.ok) {
        out.push({ path, message: r.error });
        continue;
      }
      if (!SEGMENT_RE.test(n)) continue;
      const found = guideLayers(root, project, n);
      // A broken lower file is reported in its own turn.
      if ("error" in found) continue;
      for (const e of mergeLayers(found.layers).errors)
        if (e.file === path) out.push({ path, message: formatLayerError(e) });
    }
  }
  return out;
}
