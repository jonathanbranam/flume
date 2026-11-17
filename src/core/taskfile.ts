import { Document, isMap, parseDocument, Scalar, YAMLSeq } from "yaml";

export const KINDS = ["feature", "bug", "chore", "docs", "research", "epic"] as const;
export type Kind = (typeof KINDS)[number];

/** A parsed task file: the YAML document keeps field order; the body is kept byte for byte. */
export interface TaskFile {
  doc: Document;
  body: string;
}

export type ParseResult = { ok: true; file: TaskFile } | { ok: false; error: string };

const OPEN = "---\n";

/** Split and parse "---\n<yaml>---\n<body>". Failsafe schema: every scalar stays a string. */
export function parseTaskFile(text: string): ParseResult {
  const src = text.replace(/\r\n/g, "\n");
  if (!src.startsWith(OPEN)) return { ok: false, error: "front matter missing" };
  const rest = src.slice(OPEN.length);
  let end: number;
  let after: number;
  if (rest.startsWith("---\n") || rest === "---") {
    end = 0;
    after = rest.startsWith("---\n") ? 4 : 3;
  } else {
    end = rest.indexOf("\n---\n");
    after = end + 5;
    if (end < 0) {
      if (!rest.endsWith("\n---")) return { ok: false, error: "front matter is not closed" };
      end = rest.length - 4;
      after = rest.length;
    }
    end += 1;
  }
  const doc = parseDocument(rest.slice(0, end), { schema: "failsafe" });
  if (doc.errors.length > 0) {
    return { ok: false, error: `front matter not parsable: ${doc.errors[0]?.message}` };
  }
  if (!isMap(doc.contents)) return { ok: false, error: "front matter is not a set of fields" };
  return { ok: true, file: { doc, body: rest.slice(after) } };
}

export function serializeTaskFile(file: TaskFile): string {
  return `---\n${file.doc.toString()}---\n${file.body}`;
}

/** Plain-JS view of the front matter (strings, lists of strings). */
export function fields(file: TaskFile): Record<string, unknown> {
  return (file.doc.toJS() ?? {}) as Record<string, unknown>;
}

/** An all-digit ID would read back as a number elsewhere, so quote it. */
function scalar(v: string): Scalar {
  const s = new Scalar(v);
  if (/^[0-9]+$/.test(v)) s.type = Scalar.QUOTE_DOUBLE;
  return s;
}

export function setField(file: TaskFile, key: string, value: string | string[]): void {
  if (Array.isArray(value)) {
    const seq = new YAMLSeq();
    for (const v of value) seq.items.push(scalar(v));
    file.doc.set(key, seq);
  } else {
    file.doc.set(key, scalar(value));
  }
}

export function deleteField(file: TaskFile, key: string): void {
  file.doc.delete(key);
}

export function newTaskFile(body: string): TaskFile {
  const doc = new Document({}, { schema: "failsafe" });
  return { doc, body };
}

/** [[stem]] and [[stem|label]] targets in a body. */
export function wikiLinks(body: string): string[] {
  return [...body.matchAll(/\[\[([^\]|\n]+)(?:\|[^\]\n]*)?\]\]/g)].map((m) => (m[1] ?? "").trim());
}
