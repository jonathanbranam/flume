/**
 * Merging layered Markdown documents by heading (workflow, phases, project, first-prompt, roles,
 * guides and templates). Each layer's file merges into the result of the layers below it; whatever
 * cannot be placed exactly is an error, never a guess.
 */

/** One layer's file, lowest layer first. `file` names it in errors and sources. */
export interface Layer {
  file: string;
  text: string;
  /** Lines of the file before `text` (front matter), so errors name the file's own lines. */
  lineOffset?: number;
}

/** A section of a merged document. */
export interface Section {
  level: number;
  /** The heading's words, without any tag. */
  name: string;
  /** The section's own text, between its heading and its first sub-heading. */
  text: string;
  /** The files the own text came from (the file that introduced the section when it has none). */
  sources: string[];
  children: Section[];
}

export interface LayerError {
  file: string;
  line: number;
  /** The heading as written, or "" when the problem is not at a heading. */
  heading: string;
  message: string;
}

export const formatLayerError = (e: Omit<LayerError, "file">): string =>
  `line ${e.line}: ${e.heading ? `heading "${e.heading}": ` : ""}${e.message}`;

/** Thrown when a document is asked for and a layer of it has errors. */
export class BrokenLayers extends Error {
  readonly errors: LayerError[];
  constructor(errors: LayerError[]) {
    super(errors.map((e) => `${e.file}: ${formatLayerError(e)}`).join("\n"));
    this.errors = errors;
  }
}

const TAGS = ["add", "append", "remove", "replace"] as const;
type Tag = (typeof TAGS)[number];

interface Node {
  level: number;
  name: string;
  tag?: Tag;
  line: number;
  heading: string;
  lines: string[];
  children: Node[];
}

/** An error's message; an H1 error needs the H1 of the layer below, known only after the layers below are merged. */
type Message = string | ((below: string | undefined) => string);

type Report = (n: { line: number; heading: string }, message: Message) => void;

/**
 * An H1 error gives the rule, the problem in this layer and both fixes. `below` is the H1 of the
 * layer below, or undefined for the first layer, which has nothing to match.
 */
function h1Message(problem: string, below: string | undefined): string {
  if (below === undefined)
    return `${problem}. The rule: every layer file has exactly one H1, which is the document's title. The fix: start the file with its one H1 ("# Title") and put your sections under it as ## headings.`;
  return `${problem}. The rule: every layer file has exactly one H1, the same as the H1 of the layer below ("# ${below}"). The fix: to change or add to the document, start the file with "# ${below}" and put your sections under it as ## headings, tagged @add, @append or @remove as needed; to replace the whole document, put @replace on the H1 ("# ${below} @replace").`;
}

const h1Problem =
  (problem: string): Message =>
  (below) =>
    h1Message(problem, below);

const resolve = (m: Message, below: string | undefined): string =>
  typeof m === "string" ? m : m(below);

const HEADING = /^ {0,3}(#{1,6})(?:[ \t]+(.*?))?[ \t]*$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})(.*)$/;
const UNDERLINE = /^ {0,3}(=+|-+)[ \t]*$/;
/** A line a === or --- line below would not turn into a heading. */
const NOT_PARAGRAPH = /^(\s*$| {4}| {0,3}([-*+>#|<`~]|\d+[.)]))/;

const same = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

/** The text of some lines with the blank lines at both ends dropped. */
function trimBlank(lines: string[]): string {
  let from = 0;
  let to = lines.length;
  while (from < to && (lines[from] as string).trim() === "") from++;
  while (to > from && (lines[to - 1] as string).trim() === "") to--;
  return lines.slice(from, to).join("\n");
}

/** Whether a line leaves an HTML comment open, given whether one was open before it. */
function commentOpen(line: string, open: boolean): boolean {
  let rest = open ? line : line.replace(/`[^`]*`/g, "");
  let inside = open;
  for (;;) {
    const mark = inside ? "-->" : "<!--";
    const i = rest.indexOf(mark);
    if (i < 0) return inside;
    rest = rest.slice(i + mark.length);
    inside = !inside;
  }
}

/** The tree of one file: its single H1 node, or undefined when it has none. */
function parse(layer: Layer, report: Report): Node | undefined {
  const lines = layer.text.replace(/^\uFEFF/, "").split(/\r?\n/);
  const offset = layer.lineOffset ?? 0;
  let root: Node | undefined;
  const stack: Node[] = [];
  let fence = "";
  let comment = false;
  let previous = "";
  let stray = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as string;
    const at = i + 1 + offset;
    const plain = !fence && !comment;
    const h = plain ? HEADING.exec(line) : null;
    if (h) {
      const level = (h[1] as string).length;
      let words = (h[2] ?? "").replace(/(^|[ \t])#+$/, "").trim();
      const heading = line.trim();
      const here = { line: at, heading };
      let tag: Tag | undefined;
      const t = /(?:^|[ \t])@([A-Za-z][A-Za-z0-9_-]*)$/.exec(words);
      if (t) {
        if ((TAGS as readonly string[]).includes(t[1] as string)) tag = t[1] as Tag;
        else report(here, `unknown tag @${t[1]}; the tags are @add, @append, @remove and @replace`);
        words = words.slice(0, t.index).trim();
      }
      if (words === "") report(here, "the heading has no words");
      const node: Node = { level, name: words, tag, line: at, heading, lines: [], children: [] };
      if (level === 1) {
        if (root) {
          report(here, h1Problem("a second H1"));
          // Its content cannot be placed: leave it out.
          stack.length = 0;
          stack.push(node);
        } else {
          root = node;
          stack.length = 0;
          stack.push(node);
        }
      } else if (!root) {
        report(here, h1Problem("a heading before the H1"));
        stray = true;
      } else {
        while ((stack.at(-1)?.level ?? 0) >= level) stack.pop();
        const parent = stack.at(-1) as Node;
        // A misplaced section is left out of the tree, so it is reported only once.
        if (level > parent.level + 1) report(here, "the heading skips a level");
        else if (parent.children.some((c) => same(c.name, words)))
          report(here, "the same heading twice under one parent");
        else parent.children.push(node);
        stack.push(node);
      }
      previous = "";
      continue;
    }
    if (plain && UNDERLINE.test(line) && !NOT_PARAGRAPH.test(previous))
      report({ line: at, heading: previous.trim() }, "underlined headings are not read; use #");
    const f = comment ? null : FENCE.exec(line);
    if (fence) {
      if (f && (f[1] as string).startsWith(fence) && (f[2] as string).trim() === "") fence = "";
    } else if (f) fence = f[1] as string;
    const wasComment = comment;
    if (!fence && !f) comment = commentOpen(line, comment);
    const current = stack.at(-1);
    if (current) current.lines.push(line);
    else if (line.trim() !== "" && !stray) {
      // Comments above the H1 (such as lint directives) are dropped.
      if (!wasComment && !line.trim().startsWith("<!--")) {
        report({ line: at, heading: "" }, h1Problem("text before the H1"));
        stray = true;
      }
    }
    previous = plain && !f ? line : "";
  }
  if (!root) report({ line: 1 + offset, heading: "" }, h1Problem("no H1"));
  return root;
}

const textOf = (n: Node): string => trimBlank(n.lines);
const empty = (n: Node): boolean => textOf(n) === "" && n.children.length === 0;

/** A section that stands alone (nothing below to match): sub-headings take no tag. */
function fresh(n: Node, file: string, report: Report): Section {
  for (const c of n.children)
    if (c.tag)
      report(c, `@${c.tag} has nothing to act on: nothing below this section is being merged`);
  return {
    level: n.level,
    name: n.name,
    text: textOf(n),
    sources: [file],
    children: n.children.map((c) => fresh(c, file, report)),
  };
}

/** Merge the heading `n`, which matches `lower` (untagged, @append or @replace). */
function apply(lower: Section, n: Node, file: string, report: Report): void {
  if (empty(n)) {
    report(
      n,
      n.tag
        ? `@${n.tag} with nothing under it`
        : "no text and no sub-headings; to drop the section use @remove",
    );
    return;
  }
  const text = textOf(n);
  lower.name = n.name;
  if (n.tag === "replace") {
    const s = fresh(n, file, report);
    lower.text = s.text;
    lower.sources = s.sources;
    lower.children = s.children;
    return;
  }
  if (text !== "") {
    if (n.tag === "append" && lower.text !== "") {
      lower.text = `${lower.text}\n\n${text}`;
      lower.sources = [...lower.sources, file];
    } else {
      lower.text = text;
      lower.sources = [file];
    }
  }
  for (const c of n.children) place(lower, c, file, report);
}

/** Put the sub-heading `n` into the merged section `parent`. */
function place(parent: Section, n: Node, file: string, report: Report): void {
  const i = parent.children.findIndex((c) => same(c.name, n.name));
  const match = parent.children[i];
  if (n.tag === "add") {
    if (match) report(n, "@add of a heading that is already in the layers below");
    else parent.children.push(fresh(n, file, report));
  } else if (!match) {
    report(
      n,
      n.tag
        ? `@${n.tag} matches no heading in the layers below`
        : "matches no heading in the layers below; for a new section tag it @add",
    );
  } else if (n.tag === "remove") {
    if (!empty(n)) report(n, "@remove takes no text and no sub-headings");
    else parent.children.splice(i, 1);
  } else apply(match, n, file, report);
}

/**
 * Merge the layers, lowest first. A layer whose H1 is tagged @replace stands alone: the layers
 * below it are not read. `doc` is what could be placed; use it only when `errors` is empty.
 */
export function mergeLayers(layers: Layer[]): { doc: Section | undefined; errors: LayerError[] } {
  const errors: LayerError[] = [];
  const parsed = layers.map((layer) => {
    const found: { line: number; heading: string; message: Message }[] = [];
    const root = parse(layer, (n, message) => {
      found.push({ line: n.line, heading: n.heading, message });
    });
    return { file: layer.file, root, found };
  });
  const from = Math.max(
    0,
    parsed.findLastIndex((p) => p.root?.tag === "replace"),
  );
  let doc: Section | undefined;
  for (const { file, root, found } of parsed.slice(from)) {
    // The H1 below is the name of the document merged so far (undefined for the first layer).
    const below = doc?.name;
    const report: Report = (n, message) => {
      errors.push({
        file,
        line: n.line,
        heading: n.heading,
        message: resolve(message, below),
      });
    };
    for (const f of found) report(f, f.message);
    if (!root) continue;
    if (root.tag === "replace" && empty(root)) report(root, "@replace with nothing under it");
    if (!doc) {
      if (root.tag && root.tag !== "replace")
        report(root, `@${root.tag} has nothing to act on: there is no layer below`);
      doc = fresh(root, file, report);
    } else if (root.tag === "add" || root.tag === "remove") {
      report(root, h1Problem(`@${root.tag} is not allowed on the H1`));
    } else if (!same(root.name, doc.name)) {
      report(root, h1Problem("the H1 differs from the H1 below, so it would add another H1"));
    } else apply(doc, root, file, report);
  }
  return { doc, errors };
}

/** The text under a section's heading: its own text, then its sub-sections. */
export function sectionBody(s: Section): string {
  const parts = [...(s.text ? [`${s.text}\n`] : []), ...s.children.map(renderSection)];
  return parts.join("\n");
}

/** A section as Markdown: heading, blank line, then its body; no tags. */
export function renderSection(s: Section): string {
  const body = sectionBody(s);
  return `${"#".repeat(s.level)} ${s.name}\n${body ? `\n${body}` : ""}`;
}
