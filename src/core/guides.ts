import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseDocument } from "yaml";
import { flumeRoot } from "./layout.ts";
import { SEGMENT_RE } from "./prime.ts";

/** What a guide's front matter says about it. */
export interface GuideInfo {
  name: string;
  description: string;
  stage?: string;
}

export interface Guide extends GuideInfo {
  body: string;
}

export type GuideResult = { ok: true; guide: Guide } | { ok: false; error: string };

/** Parse a guide file's text: flat YAML front matter between --- lines, then the body. */
export function parseGuide(name: string, text: string): GuideResult {
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
  if (typeof r.stage === "string" && r.stage !== "") guide.stage = r.stage;
  return { ok: true, guide };
}

const dirs = (root: string, project: string): string[] => {
  const base = join(flumeRoot(root), "base", "guides");
  return project ? [join(flumeRoot(root), "projects", project, "guides"), base] : [base];
};

function names(dir: string): string[] {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.slice(0, -3))
      .sort();
  } catch {
    return [];
  }
}

function plain(project: string): void {
  if (project !== "" && !SEGMENT_RE.test(project))
    throw new Error(`project '${project}' is not a plain name`);
}

/** The guide `name`: the project's if its file exists, else the base one; undefined if neither. */
export function readGuide(root: string, project: string, name: string): GuideResult | undefined {
  plain(project);
  if (!SEGMENT_RE.test(name)) throw new Error(`guide '${name}' is not a plain name`);
  for (const d of dirs(root, project)) {
    const f = join(d, `${name}.md`);
    if (existsSync(f)) {
      const r = parseGuide(name, readFileSync(f, "utf8"));
      return r.ok ? r : { ok: false, error: `${f}: ${r.error}` };
    }
  }
  return undefined;
}

/** The valid guides available to `project` (base ones, overridden by the project's), by name. */
export function listGuides(root: string, project: string): GuideInfo[] {
  plain(project);
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

/** One problem per guide file with missing or unparsable front matter, base and every project. */
export function checkGuides(root: string): { path: string; message: string }[] {
  const out: { path: string; message: string }[] = [];
  const top = flumeRoot(root);
  const where: [string, string][] = [[join(top, "base", "guides"), "base/guides"]];
  let projects: string[] = [];
  try {
    projects = readdirSync(join(top, "projects"));
  } catch {}
  for (const p of projects.sort())
    where.push([join(top, "projects", p, "guides"), `projects/${p}/guides`]);
  for (const [d, label] of where)
    for (const n of names(d)) {
      const r = parseGuide(n, readFileSync(join(d, `${n}.md`), "utf8"));
      if (!r.ok) out.push({ path: `${label}/${n}.md`, message: r.error });
    }
  return out;
}
