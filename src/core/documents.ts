import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { BrokenLayers, type Layer, mergeLayers, renderSection, sectionBody } from "./layers.ts";
import { flumeRoot, rel } from "./layout.ts";
import { SEGMENT_RE } from "./prime.ts";

/** The base documents shipped with flume, read at run time. */
export const SHIPPED_DIR = fileURLToPath(new URL("../../base", import.meta.url));

/** How errors and sources name a shipped file. */
const SHIPPED = "flume's own base";

export function plainName(what: string, v: string): void {
  if (v !== "" && !SEGMENT_RE.test(v)) throw new Error(`${what} '${v}' is not a plain name`);
}

/**
 * The existing files of the document `doc` (such as workflow.md or roles/worker.md), lowest layer
 * first: shipped, workspace (base/), project (projects/PROJECT/). With no root, shipped only.
 */
export function documentFiles(
  root: string | undefined,
  project: string,
  doc: string,
): { path: string; file: string }[] {
  plainName("project", project);
  const all = [{ path: join(SHIPPED_DIR, doc), file: `${SHIPPED}/${doc}` }];
  if (root !== undefined) {
    const dirs = ["base", ...(project ? [`projects/${project}`] : [])];
    for (const d of dirs)
      all.push({ path: join(flumeRoot(root), d, doc), file: rel(root, d, doc) });
  }
  return all.filter((f) => existsSync(f.path));
}

export const layersOf = (root: string | undefined, project: string, doc: string): Layer[] =>
  documentFiles(root, project, doc).map((f) => ({
    file: f.file,
    text: readFileSync(f.path, "utf8"),
  }));

/** The merged document, or undefined when no layer has it. Throws BrokenLayers. */
export function readDocument(root: string | undefined, project: string, doc: string) {
  const r = mergeLayers(layersOf(root, project, doc));
  if (r.errors.length > 0) throw new BrokenLayers(r.errors);
  return r.doc;
}

/** The merged document as Markdown; "" when no layer has it. */
export function documentText(root: string | undefined, project: string, doc: string): string {
  const d = readDocument(root, project, doc);
  return d ? renderSection(d) : "";
}

export interface PrimeDocuments {
  /** workflow.md, merged. */
  workflow: string;
  /** project.md, merged; "" with no project. */
  project: string;
  /** roles/ROLE.md, merged; "" with no role or no file. */
  role: string;
  /** The text under the H1 of first-prompt.md. */
  first_prompt: string;
}

/**
 * The documents prime and the launcher use, placeholders unfilled. Every error of every one of
 * them is reported together. With no root, flume's shipped documents only.
 */
export function primeDocuments(
  root: string | undefined,
  project: string,
  role: string,
): PrimeDocuments {
  plainName("project", project);
  plainName("role", role);
  const errors: BrokenLayers["errors"] = [];
  const merged = (doc: string) => {
    const r = mergeLayers(layersOf(root, project, doc));
    errors.push(...r.errors);
    return r.doc;
  };
  const text = (doc: string) => {
    const d = merged(doc);
    return d ? renderSection(d) : "";
  };
  const first = merged("first-prompt.md");
  const out = {
    workflow: text("workflow.md"),
    project: project ? text("project.md") : "",
    role: role ? text(`roles/${role}.md`) : "",
    first_prompt: first ? sectionBody(first).replace(/\n+$/, "") : "",
  };
  if (errors.length > 0) throw new BrokenLayers(errors);
  return out;
}

/** Workflow, project and role text joined by a blank line, empty ones left out. */
export const joinedText = (d: PrimeDocuments): string =>
  [d.workflow, d.project, d.role].filter((x) => x !== "").join("\n");

export function listFiles(dir: string): string[] {
  try {
    return readdirSync(dir).sort();
  } catch {
    return [];
  }
}

const TOP = ["workflow.md", "project.md", "first-prompt.md"];

/**
 * Every layered document file of the tasks repo (base/ and each project's folder), by the name it
 * merges under and the project whose chain it ends ("" for base/). Guides are listed separately.
 */
export function layeredDocs(root: string): { project: string; doc: string }[] {
  const out: { project: string; doc: string }[] = [];
  const projects = listFiles(join(flumeRoot(root), "projects")).filter((p) => SEGMENT_RE.test(p));
  for (const project of ["", ...projects]) {
    const dir = join(flumeRoot(root), project ? `projects/${project}` : "base");
    const inFolder = (folder: string) =>
      listFiles(join(dir, folder))
        .filter((f) => f.endsWith(".md") && SEGMENT_RE.test(f))
        .map((f) => `${folder}/${f}`);
    const docs = [...TOP, ...inFolder("roles"), ...inFolder("templates")];
    for (const doc of docs) if (existsSync(join(dir, doc))) out.push({ project, doc });
  }
  return out;
}

/** One problem per merge error in the layered files other than guides. */
export function checkDocuments(root: string): { file: string; errors: BrokenLayers["errors"] }[] {
  return layeredDocs(root).map(({ project, doc }) => {
    // Report each file's own errors only: lower files are checked in their own turn.
    const file = rel(root, project ? `projects/${project}` : "base", doc);
    const r = mergeLayers(layersOf(root, project, doc));
    return { file, errors: r.errors.filter((e) => e.file === file) };
  });
}
