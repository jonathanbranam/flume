import { isValidId } from "./ids.ts";
import { SLUG_MAX, SLUG_PATTERN } from "./slug.ts";
import { listTaskFiles, type TaskEntry } from "./store.ts";
import { fields, KINDS, parseTaskFile, wikiLinks } from "./taskfile.ts";

export interface Problem {
  path: string;
  message: string;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const STAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

function realDate(s: string): boolean {
  const d = new Date(s.length === 10 ? `${s}T00:00:00Z` : s);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s.slice(0, 10));
}

interface Parsed {
  entry: TaskEntry;
  f: Record<string, unknown>;
  body: string;
}

/** Examine every task file under root; one Problem per issue, in path order. */
export function checkProject(root: string): Problem[] {
  const entries = listTaskFiles(root);
  const problems: Problem[] = [];
  const add = (e: TaskEntry, message: string) => problems.push({ path: e.path, message });

  // IDs by file name, for uniqueness and reference lookups.
  const byId = new Map<string, TaskEntry[]>();
  for (const e of entries) byId.set(e.nameId, [...(byId.get(e.nameId) ?? []), e]);
  const stems = new Set(entries.map((e) => e.stem));

  const parsed: Parsed[] = [];
  for (const e of entries) {
    const slug = e.stem.slice(0, -5);
    if (!isValidId(e.nameId) || e.stem.length < 6 || e.stem[e.stem.length - 5] !== "-") {
      add(e, "file name is not <slug>-<id>.md with a well formed id");
    } else if (!SLUG_PATTERN.test(slug) || slug.length > SLUG_MAX) {
      add(
        e,
        `file name slug is not lowercase letters, digits and hyphens of at most ${SLUG_MAX} characters`,
      );
    }
    if ((byId.get(e.nameId) ?? []).length > 1 && e.nameId !== "") {
      const others = (byId.get(e.nameId) ?? []).filter((o) => o !== e).map((o) => o.path);
      add(e, `duplicate id ${e.nameId}, also in ${others.join(", ")}`);
    }
    const r = parseTaskFile(e.text);
    if (!r.ok) {
      add(e, r.error);
      continue;
    }
    parsed.push({ entry: e, f: fields(r.file), body: r.file.body });
  }

  for (const { entry: e, f, body } of parsed) {
    for (const k of ["id", "title", "kind", "created"]) {
      if (typeof f[k] !== "string" || f[k] === "") add(e, `required field ${k} missing`);
    }
    if (typeof f.id === "string" && f.id !== "") {
      if (!isValidId(f.id)) add(e, `id ${f.id} is not well formed`);
      else if (f.id !== e.nameId)
        add(e, `id ${f.id} differs from the id ${e.nameId} in the file name`);
    }
    if (
      typeof f.kind === "string" &&
      f.kind !== "" &&
      !(KINDS as readonly string[]).includes(f.kind)
    ) {
      add(e, `kind ${f.kind} is not one of ${KINDS.join(", ")}`);
    }
    if (
      typeof f.created === "string" &&
      f.created !== "" &&
      !(DATE.test(f.created) && realDate(f.created))
    ) {
      add(e, `created ${f.created} is not a date YYYY-MM-DD`);
    }
    if (f.resolved !== undefined) {
      if (typeof f.resolved !== "string" || !(STAMP.test(f.resolved) && realDate(f.resolved))) {
        add(e, "resolved is not a timestamp YYYY-MM-DDTHH:MM:SSZ");
      }
      if (e.state === "open") add(e, "has a resolved field but is in open");
    } else if (e.state === "resolved") {
      add(e, "is in resolved but has no resolved field");
    }

    const refs: [string, string][] = [];
    if (f.parent !== undefined) refs.push(["parent", String(f.parent)]);
    for (const k of ["blocked_by", "related"]) {
      const v = f[k];
      if (v === undefined) continue;
      if (!Array.isArray(v)) add(e, `${k} is not a list`);
      else for (const x of v) refs.push([k, String(x)]);
    }
    for (const [k, id] of refs) {
      const target = byId.get(id)?.[0];
      if (!isValidId(id) || !target) add(e, `${k} ${id} names no task`);
      else if (k === "parent") {
        const pk = parsed.find((p) => p.entry === target)?.f.kind;
        if (pk !== "epic") add(e, `parent ${id} is not an epic`);
      }
    }
    if (f.kind === "epic" && f.parent !== undefined) add(e, "an epic has no parent");
    for (const link of wikiLinks(body)) {
      if (!stems.has(link)) add(e, `link [[${link}]] names no task file`);
    }
  }

  // blocked_by cycles: report each file that can reach itself.
  const edges = new Map<string, string[]>();
  for (const { entry: e, f } of parsed) {
    const v = f.blocked_by;
    edges.set(e.nameId, Array.isArray(v) ? v.map(String) : []);
  }
  for (const { entry: e } of parsed) {
    const seen = new Set<string>();
    const stack = [...(edges.get(e.nameId) ?? [])];
    while (stack.length > 0) {
      const n = stack.pop() as string;
      if (n === e.nameId) {
        add(e, `blocked_by cycle through ${e.nameId}`);
        break;
      }
      if (seen.has(n)) continue;
      seen.add(n);
      stack.push(...(edges.get(n) ?? []));
    }
  }
  return problems;
}

export function formatProblem(p: Problem): string {
  return `${p.path}: ${p.message}`;
}
