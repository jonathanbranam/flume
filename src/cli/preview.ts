import { Command, type CommandUnknownOpts } from "@commander-js/extra-typings";
import { layersOf } from "../core/documents.ts";
import { guideLayers } from "../core/guides.ts";
import {
  BrokenLayers,
  type Layer,
  mergeLayers,
  renderSection,
  type Section,
  sectionBody,
} from "../core/layers.ts";
import { mustPartName } from "../core/parts.ts";
import { SEGMENT_RE } from "../core/prime.ts";
import { findRoot } from "./check.ts";
import { act } from "./program.ts";

/** The documents preview can print: the name the command takes, and what it reads. */
type Target = "workflow" | "project" | "first-prompt" | "role" | "guide" | "template";

interface Options {
  project?: string;
  layers?: boolean;
  json?: boolean;
}

/** The layers of one document, lowest first, and the document's path for messages. */
function layersFor(
  root: string,
  target: Target,
  arg: string | undefined,
  project: string,
): { doc: string; layers: Layer[] } {
  const named = (doc: string) => ({ doc, layers: layersOf(root, project, doc) });
  switch (target) {
    case "workflow":
      return named("workflow.md");
    case "project":
      return named("project.md");
    case "first-prompt":
      return named("first-prompt.md");
    case "role":
      if (!SEGMENT_RE.test(arg as string)) throw new Error(`role '${arg}' is not a plain name`);
      return named(`roles/${arg}.md`);
    case "template":
      return named(`templates/${mustPartName(arg as string)}.md`);
    case "guide": {
      if (!SEGMENT_RE.test(arg as string)) throw new Error(`guide '${arg}' is not a plain name`);
      const found = guideLayers(root, project, arg as string);
      if ("error" in found) throw new Error(found.error);
      return { doc: `guides/${arg}.md`, layers: found.layers };
    }
  }
}

/**
 * One section and its children as Markdown, each heading preceded by a line naming the files its
 * text came from. Without a heading (the first prompt's H1), only its own text is marked.
 */
function marked(s: Section, heading: boolean): string {
  const from = `<!-- from: ${s.sources.join(", ")} -->`;
  const kids = s.children.map((c) => marked(c, true));
  const own = s.text ? `${s.text}\n` : "";
  if (!heading)
    return [s.text ? `${from}\n${own}` : "", ...kids].filter((x) => x !== "").join("\n");
  const body = [own, ...kids].filter((x) => x !== "").join("\n");
  return `${from}\n${"#".repeat(s.level)} ${s.name}\n${body ? `\n${body}` : ""}`;
}

/**
 * The merged document as preview prints it: the text prime uses (the first prompt is the text
 * under its H1), with --layers the source of each section. Placeholders are left as written.
 */
function text(target: Target, doc: Section, layers: boolean): string {
  if (target === "first-prompt") {
    if (layers) return `${marked(doc, false).replace(/\n*$/, "")}\n`;
    return `${sectionBody(doc).replace(/\n+$/, "")}\n`;
  }
  if (layers) return `${marked(doc, true).replace(/\n*$/, "")}\n`;
  return `${renderSection(doc).replace(/\n*$/, "")}\n`;
}

/**
 * `flume preview TARGET [--project P] [--layers] [--json]`: print one merged document; exit 1 with
 * the layer errors (file, line, heading) on standard error when a layer is broken.
 */
export function preview(target: Target, arg: string | undefined, o: Options): number {
  const project = o.project ?? "";
  if (project !== "" && !SEGMENT_RE.test(project)) {
    process.stderr.write(`flume: project '${project}' is not a plain name\n`);
    return 1;
  }
  try {
    const { doc, layers } = layersFor(findRoot(process.cwd()), target, arg, project);
    const r = mergeLayers(layers);
    if (r.errors.length > 0) throw new BrokenLayers(r.errors);
    if (!r.doc) {
      process.stderr.write(`flume: no layer has ${doc}\n`);
      return 1;
    }
    if (o.json) process.stdout.write(`${JSON.stringify(r.doc)}\n`);
    else process.stdout.write(text(target, r.doc, o.layers === true));
    return 0;
  } catch (e) {
    process.stderr.write(`flume: ${(e as Error).message}\n`);
    return 1;
  }
}

/** One preview subcommand: the options every target takes, and the action. */
function sub(
  group: Command,
  name: Target,
  description: string,
  argument?: { name: string; help: string },
): void {
  const bare = group.command(name).description(description);
  const cmd = (argument ? bare.argument(`<${argument.name}>`, argument.help) : bare) as Command;
  cmd
    .option("--project <p>", "project")
    .option("--layers", "mark the file each section came from")
    .option("--json", "print the merged document as JSON, each section with its source")
    .action(function (this: Command, ...args: unknown[]) {
      // Commander passes the argument (if any), then the options, then the command.
      const arg = argument ? (args[0] as string) : undefined;
      const o = this.opts() as Options;
      return act(this, () => preview(name, arg, o));
    });
}

/** The `flume preview` group: one subcommand per document. */
export function previewCommand(): CommandUnknownOpts {
  const group = new Command("preview").description(
    "print a merged layered document (the text prime uses), with its layers",
  );
  sub(group, "workflow", "the workflow text");
  sub(group, "project", "the project's workflow text");
  sub(group, "first-prompt", "the first prompt the launcher sends");
  sub(group, "role", "a role's text", { name: "role", help: "the role name" });
  sub(group, "guide", "a guide's text", { name: "guide", help: "the guide name" });
  sub(group, "template", "a part's template", {
    name: "part",
    help: "the part name",
  });
  return group;
}
