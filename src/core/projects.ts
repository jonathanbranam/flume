import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseDocument } from "yaml";
import { FLUME_YAML } from "./layout.ts";

export interface ProjectEntry {
  name: string;
  /** The git URL; undefined when flume.yaml gives none (a problem `flume check` reports). */
  url?: string;
  /** The branch to clone; undefined means the repo's own default branch. */
  branch?: string;
}

const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** Is `name` usable as a project's folder name: one plain folder name, not "." or ".."? */
export const validProjectName = (name: string): boolean =>
  NAME_RE.test(name) && !name.endsWith("..");

/** The folder name `git clone` gives a URL: its last part without a trailing slash or `.git`. */
export function repoName(url: string): string {
  const last =
    url
      .replace(/[/\\]+$/, "")
      .split(/[/\\:]/)
      .pop() ?? "";
  return last.replace(/\.git$/, "");
}

/** The `projects` of `<root>/flume.yaml`, in file order. No file or no `projects` gives []. */
export function readProjects(root: string): ProjectEntry[] {
  const file = join(root, FLUME_YAML);
  if (!existsSync(file)) return [];
  const doc = parseDocument(readFileSync(file, "utf8"), { schema: "failsafe" });
  const cfg = doc.errors.length > 0 ? null : doc.toJS();
  if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) {
    throw new Error(`${FLUME_YAML} is not a set of fields`);
  }
  const projects = (cfg as Record<string, unknown>).projects;
  if (projects === undefined || projects === null || projects === "") return [];
  if (typeof projects !== "object" || Array.isArray(projects)) {
    throw new Error(`${FLUME_YAML}: projects must map each project name to its url and branch`);
  }
  return Object.entries(projects as Record<string, unknown>).map(([name, v]) => {
    const f = v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
    const url = typeof f.url === "string" && f.url !== "" ? f.url : undefined;
    const branch = typeof f.branch === "string" && f.branch !== "" ? f.branch : undefined;
    return { name, url, branch };
  });
}

/** Problems in the projects of flume.yaml: a name that is not a folder name, or no url. */
export function checkProjects(root: string): { path: string; message: string }[] {
  let list: ProjectEntry[];
  try {
    list = readProjects(root);
  } catch (e) {
    return [{ path: FLUME_YAML, message: (e as Error).message }];
  }
  const out: { path: string; message: string }[] = [];
  for (const p of list) {
    if (!validProjectName(p.name)) {
      out.push({ path: FLUME_YAML, message: `project ${p.name} is not a valid folder name` });
    }
    if (p.url === undefined)
      out.push({ path: FLUME_YAML, message: `project ${p.name} has no url` });
  }
  return out;
}
