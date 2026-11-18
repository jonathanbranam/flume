import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { flumeRoot } from "./layout.ts";

/** A project or role name that is safe to use as one path segment. */
export const SEGMENT_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/**
 * The workflow text kept in the flume-root, in prime order (later overrides earlier), as three
 * parts: workspace (base/workflow.md), project (projects/<project>/workflow.md) and role
 * (base/roles/<role>.md then projects/<project>/roles/<role>.md). A missing file, or a part with
 * no project or role, is skipped (its part is ""). Throws when `project` or `role` is not a
 * plain name.
 */
export function workflowParts(
  root: string,
  project: string,
  role: string,
): { workspace: string; project: string; role: string } {
  for (const [what, v] of [
    ["project", project],
    ["role", role],
  ] as const)
    if (v !== "" && !SEGMENT_RE.test(v)) throw new Error(`${what} '${v}' is not a plain name`);
  const base = join(flumeRoot(root), "base");
  const proj = join(flumeRoot(root), "projects", project);
  const read = (files: string[]) =>
    files
      .filter((f) => existsSync(f))
      .map((f) => readFileSync(f, "utf8"))
      .map((t) => (t.endsWith("\n") ? t : `${t}\n`))
      .join("\n");
  return {
    workspace: read([join(base, "workflow.md")]),
    project: project ? read([join(proj, "workflow.md")]) : "",
    role: role
      ? read([
          join(base, "roles", `${role}.md`),
          ...(project ? [join(proj, "roles", `${role}.md`)] : []),
        ])
      : "",
  };
}

/** All the workflow text, the parts joined by a blank line. */
export function workflowText(root: string, project: string, role: string): string {
  const p = workflowParts(root, project, role);
  return [p.workspace, p.project, p.role].filter((x) => x !== "").join("\n");
}

/** The element names the prime and guide text use; text inside them cannot forge these. */
const ENVELOPE = [
  "flume_prime",
  "flume_base",
  "workflow_missing",
  "server_not_running",
  "flume_not_set_up",
  "workspace_workflow",
  "project_workflow",
  "role",
  "guides",
  "guide",
];
const ENVELOPE_RE = new RegExp(`<(/?)(${ENVELOPE.join("|")})(?=[\\s>/]|$)`, "g");

/** Text for inside an element: any tag of ours in it (opening or closing) is neutralized. */
export function xmlText(text: string): string {
  return text.replace(ENVELOPE_RE, "&lt;$1$2");
}

/** A value for inside a double-quoted attribute. */
export function xmlAttr(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** `<tag attrs>`, the text on its own lines, `</tag>`; attrs with an empty value are left out. */
export function xmlBlock(
  tag: string,
  attrs: Record<string, string | undefined>,
  text: string,
): string {
  return `${xmlOpen(tag, attrs)}\n${xmlText(text.replace(/\n+$/, ""))}\n</${tag}>\n`;
}

export function xmlOpen(tag: string, attrs: Record<string, string | undefined>): string {
  const a = Object.entries(attrs)
    .filter(([, v]) => v)
    .map(([k, v]) => ` ${k}="${xmlAttr(v as string)}"`)
    .join("");
  return `<${tag}${a}>`;
}
