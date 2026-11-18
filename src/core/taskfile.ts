import { Document, isMap, parseDocument, Scalar, YAMLSeq } from "yaml";

export const KINDS = ["feature", "bug", "chore", "docs", "research", "epic"] as const;
export type Kind = (typeof KINDS)[number];

/** A parsed task.yaml: the YAML document keeps field order. */
export interface TaskFile {
  doc: Document;
}

export type ParseResult = { ok: true; file: TaskFile } | { ok: false; error: string };

/** Parse task.yaml. Failsafe schema: every scalar stays a string. */
export function parseTaskYaml(text: string): ParseResult {
  const doc = parseDocument(text, { schema: "failsafe" });
  if (doc.errors.length > 0) {
    return { ok: false, error: `task.yaml not parsable: ${doc.errors[0]?.message}` };
  }
  if (!isMap(doc.contents)) return { ok: false, error: "task.yaml is not a set of fields" };
  return { ok: true, file: { doc } };
}

export function serializeTaskYaml(file: TaskFile): string {
  return file.doc.toString();
}

/** Plain-JS view of the fields (strings, lists of strings). */
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

export function newTaskFile(): TaskFile {
  return { doc: new Document({}, { schema: "failsafe" }) };
}

/** [[stem]] and [[stem|label]] targets in a body. */
export function wikiLinks(body: string): string[] {
  return [...body.matchAll(/\[\[([^\]|\n]+)(?:\|[^\]\n]*)?\]\]/g)].map((m) => (m[1] ?? "").trim());
}

/** The pushed guides by phase, from the task's `guides` field (anything else is ignored). */
export function readGuides(file: TaskFile): Record<string, string[]> {
  const g = fields(file).guides;
  const out: Record<string, string[]> = {};
  if (g && typeof g === "object" && !Array.isArray(g))
    for (const [k, v] of Object.entries(g))
      if (Array.isArray(v) && v.length > 0) out[k] = v.map(String);
  return out;
}

/** Write the pushed guides nested by phase, in `order`, leaving out a phase with none. */
export function writeGuides(
  file: TaskFile,
  guides: Record<string, string[]>,
  order: readonly string[],
): void {
  const nested: Record<string, string[]> = {};
  for (const ph of order) if ((guides[ph] ?? []).length > 0) nested[ph] = guides[ph] as string[];
  if (Object.keys(nested).length === 0) file.doc.delete("guides");
  else file.doc.set("guides", file.doc.createNode(nested));
}
