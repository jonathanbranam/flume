/** The plan: numbered groups of numbered items, each open, done or skipped. */
export type ItemState = "open" | "done" | "skipped";

export interface PlanItem {
  id: string;
  state: ItemState;
  text: string;
  /** The reason, for a skipped item that has one. */
  reason?: string;
}

export interface PlanGroup {
  number: number;
  title: string;
  /** Names of the guides the group lists with Guide: lines. */
  guides: string[];
  items: PlanItem[];
}

const GROUP = /^## (\d+)\. (\S.*)$/;
const ITEM = /^- \[( |x|-)\] (\d+\.\d+) (\S.*)$/;
const GUIDE_LINE = /^Guide: (\S+)$/;
const GUIDE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const TITLE = /^# \S.*$/;
const SKIPPED = /^ {2}Skipped: (\S.*)$/;
const COMMENT = /^<!--.*-->$/;
const MARK: Record<string, ItemState> = { " ": "open", x: "done", "-": "skipped" };
const MARK_OF: Record<ItemState, string> = { open: " ", done: "x", skipped: "-" };

export type PlanParse = { ok: true; groups: PlanGroup[] } | { ok: false; error: string };

/**
 * Parse a plan. After an optional "# Title" first line, every non blank line is a group heading ("## 1. Title"), an item
 * ("- [ ] 1.1 text", with x or - for done or skipped), a "  Skipped: reason" line under a
 * skipped item, or a one line <!-- comment -->. Items are numbered group.item in order.
 */
export function parsePlan(text: string): PlanParse {
  const groups: PlanGroup[] = [];
  const lines = text.split("\n");
  let first = true;
  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] as string).replace(/\s+$/, "");
    const at = `line ${i + 1}`;
    if (line === "" || COMMENT.test(line.trim())) continue;
    const title = first && TITLE.test(line);
    first = false;
    if (title) continue;
    let m = GROUP.exec(line);
    if (m) {
      if (Number(m[1]) !== groups.length + 1)
        return { ok: false, error: `${at}: group number ${m[1]} should be ${groups.length + 1}` };
      groups.push({ number: Number(m[1]), title: m[2] as string, guides: [], items: [] });
      continue;
    }
    const g = groups[groups.length - 1];
    m = GUIDE_LINE.exec(line);
    if (m) {
      if (!g) return { ok: false, error: `${at}: a Guide line before the first group heading` };
      if (g.items.length > 0)
        return { ok: false, error: `${at}: a Guide line must come before the group's items` };
      if (!GUIDE_NAME.test(m[1] as string))
        return { ok: false, error: `${at}: '${m[1]}' is not a plain guide name` };
      if (!g.guides.includes(m[1] as string)) g.guides.push(m[1] as string);
      continue;
    }
    m = ITEM.exec(line);
    if (m) {
      if (!g) return { ok: false, error: `${at}: an item before the first group heading` };
      const want = `${g.number}.${g.items.length + 1}`;
      if (m[2] !== want)
        return { ok: false, error: `${at}: item number ${m[2]} should be ${want}` };
      g.items.push({ id: want, state: MARK[m[1] as string] as ItemState, text: m[3] as string });
      continue;
    }
    m = SKIPPED.exec(line);
    const last = g?.items[g.items.length - 1];
    if (m && last && last.state === "skipped" && last.reason === undefined) {
      last.reason = m[1] as string;
      continue;
    }
    return {
      ok: false,
      error: `${at}: not a group ("## 1. Name"), a Guide line ("Guide: name"), an item ("- [ ] 1.1 text") or a Skipped line`,
    };
  }
  if (groups.length === 0) return { ok: false, error: "no group ('## 1. Name')" };
  const empty = groups.find((g) => g.items.length === 0);
  if (empty) return { ok: false, error: `group ${empty.number} has no items` };
  return { ok: true, groups };
}

/** What is wrong with a plan, or undefined when it is in the plan form. */
export function checkPlan(text: string): string | undefined {
  const r = parsePlan(text);
  return r.ok ? undefined : r.error;
}

/** The first group with an open item, or undefined when the plan is complete. */
export function currentGroup(groups: PlanGroup[]): PlanGroup | undefined {
  return groups.find((g) => g.items.some((i) => i.state === "open"));
}

/** A group as the plan prints it. */
export function formatGroup(g: PlanGroup): string {
  const lines = [`## ${g.number}. ${g.title}`, ""];
  if (g.guides.length > 0) lines.push(...g.guides.map((n) => `Guide: ${n}`), "");
  for (const i of g.items) {
    lines.push(`- [${MARK_OF[i.state]}] ${i.id} ${i.text}`);
    if (i.reason !== undefined) lines.push(`  Skipped: ${i.reason}`);
  }
  return `${lines.join("\n")}\n`;
}

/** The whole plan as text, in the plan form. */
export function formatPlan(groups: PlanGroup[]): string {
  return groups.map(formatGroup).join("\n");
}

/**
 * Mark items of the current group done or skipped (with a reason); returns the new plan text.
 * Throws, changing nothing, for an item outside the current group or not in the plan.
 */
export function markItems(
  text: string,
  items: string[],
  to: "done" | "skipped",
  reason?: string,
): string {
  const r = parsePlan(text);
  if (!r.ok) throw new Error(`the plan is not in the plan form: ${r.error}`);
  const cur = currentGroup(r.groups);
  if (!cur) throw new Error("the plan is complete: no items left to mark");
  for (const id of items) {
    const item = cur.items.find((i) => i.id === id);
    if (!item)
      throw new Error(
        `item ${id} is not in the current group (${cur.number}: ${cur.items.map((i) => i.id).join(", ")})`,
      );
    item.state = to;
    item.reason = to === "skipped" ? (reason as string).replace(/\s+/g, " ").trim() : undefined;
  }
  return formatPlan(r.groups);
}
