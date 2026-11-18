import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { flumeRoot } from "./layout.ts";

/** A project or role name that is safe to use as one path segment. */
export const SEGMENT_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/**
 * The workflow text kept in the flume-root, in prime order (later overrides earlier):
 * base/workflow.md, projects/<project>/workflow.md, base/roles/<role>.md, then
 * projects/<project>/roles/<role>.md. A missing file, or a part with no project or role, is
 * skipped. Throws when `project` or `role` is not a plain name.
 */
export function workflowText(root: string, project: string, role: string): string {
  for (const [what, v] of [
    ["project", project],
    ["role", role],
  ] as const)
    if (v !== "" && !SEGMENT_RE.test(v)) throw new Error(`${what} '${v}' is not a plain name`);
  const base = join(flumeRoot(root), "base");
  const proj = join(flumeRoot(root), "projects", project);
  const files = [join(base, "workflow.md")];
  if (project) files.push(join(proj, "workflow.md"));
  if (role) files.push(join(base, "roles", `${role}.md`));
  if (project && role) files.push(join(proj, "roles", `${role}.md`));
  return files
    .filter((f) => existsSync(f))
    .map((f) => readFileSync(f, "utf8"))
    .map((t) => (t.endsWith("\n") ? t : `${t}\n`))
    .join("\n");
}
