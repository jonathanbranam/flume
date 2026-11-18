import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Problem } from "./check.ts";
import { rel } from "./layout.ts";
import { listTaskFiles } from "./store.ts";
import { taskObject } from "./update.ts";

/** The roadmap file, relative to the tasks repo; it sits in the flume-root. */
export const roadmapPath = (root: string): string => rel(root, "roadmap.md");

export interface RoadmapEntry {
  /** The wiki link target: a task file name without .md. */
  link: string;
  label: string | null;
  note: string | null;
  /** 1-based line in the file. */
  line: number;
}

export interface RoadmapSection {
  heading: string;
  entries: RoadmapEntry[];
}

const HEADING = /^#{1,6}\s+(.*?)\s*#*\s*$/;
const ITEM = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/;
const LINK = /\[\[([^\]|\n]+)(?:\|([^\]\n]*))?\]\]/;

/** Sections and entries of a roadmap file, in the order written. */
export function parseRoadmap(text: string): RoadmapSection[] {
  const sections: RoadmapSection[] = [];
  text.split("\n").forEach((raw, i) => {
    const h = HEADING.exec(raw);
    if (h) {
      sections.push({ heading: h[1] ?? "", entries: [] });
      return;
    }
    const item = ITEM.exec(raw);
    const m = item ? LINK.exec(item[1] ?? "") : null;
    if (!item || !m) return;
    if (sections.length === 0) sections.push({ heading: "", entries: [] });
    const rest = (item[1] ?? "").slice((m.index ?? 0) + m[0].length).trim();
    sections[sections.length - 1]?.entries.push({
      link: (m[1] ?? "").trim(),
      label: m[2] === undefined ? null : m[2].trim(),
      note: rest === "" ? null : rest,
      line: i + 1,
    });
  });
  return sections;
}

/** The roadmap text, or undefined when the file does not exist. */
export function readRoadmap(root: string): string | undefined {
  const p = join(root, roadmapPath(root));
  return existsSync(p) ? readFileSync(p, "utf8") : undefined;
}

export const isDone = (heading: string) => heading.trim().toLowerCase() === "done";

/** Sections with each entry's task (id, title, state) filled in; state null when none matches. */
export function roadmapView(root: string, text: string) {
  const byStem = new Map(listTaskFiles(root).map((e) => [e.stem, e]));
  return parseRoadmap(text).map((s) => ({
    heading: s.heading,
    entries: s.entries.map((e) => {
      const entry = byStem.get(e.link);
      let task: { id: string; title: string; state: string } | null = null;
      if (entry) {
        try {
          const t = taskObject(entry);
          task = { id: t.id, title: t.title, state: t.state };
        } catch {
          task = { id: entry.nameId, title: "", state: entry.state };
        }
      }
      return {
        link: e.link,
        label: e.label,
        note: e.note,
        line: e.line,
        id: task?.id ?? null,
        title: task?.title ?? null,
        state: task?.state ?? null,
      };
    }),
  }));
}

/** Problems in the roadmap file, empty when the file does not exist. */
export function checkRoadmap(root: string): Problem[] {
  const text = readRoadmap(root);
  if (text === undefined) return [];
  const problems: Problem[] = [];
  for (const s of roadmapView(root, text)) {
    for (const e of s.entries) {
      const at = `line ${e.line}`;
      if (e.state === null) {
        problems.push({
          path: roadmapPath(root),
          message: `${at}: link [[${e.link}]] names no task file`,
        });
      } else if (e.state === "resolved" && !isDone(s.heading) && e.note === null) {
        problems.push({
          path: roadmapPath(root),
          message: `${at}: [[${e.link}]] is resolved but listed under ${s.heading || "no heading"} with no note`,
        });
      }
    }
  }
  return problems;
}
