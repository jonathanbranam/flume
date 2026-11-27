import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** The built-in named workflows: one folder of overlay files each, beside the built-in base/. */
const WORKFLOWS_DIR = fileURLToPath(new URL("../../workflows", import.meta.url));

export const SHIPPED_WORKFLOWS = [
  {
    name: "none",
    description: "no workflow: do what the human asks; flume is there for tasks if wanted",
  },
  { name: "light", description: "a task for each code change, with hardly any steps" },
] as const;

export const isShippedWorkflow = (name: string): boolean =>
  SHIPPED_WORKFLOWS.some((w) => w.name === name);

/** The files of a built-in workflow: each file's name and text. */
export function shippedFiles(name: string): { doc: string; text: string }[] {
  const dir = join(WORKFLOWS_DIR, name);
  return readdirSync(dir)
    .sort()
    .map((doc) => ({ doc, text: readFileSync(join(dir, doc), "utf8") }));
}
