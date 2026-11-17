import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  checkProject,
  createTask,
  formatProblem,
  ID_ALPHABET,
  isValidId,
  listTaskFiles,
  mintId,
  parseTaskFile,
  reopenTask,
  resolveRef,
  resolveTask,
  retitleTask,
  serializeTaskFile,
  slugify,
} from "../src/core/index.ts";

const bin = new URL("../bin/flume.js", import.meta.url).pathname;
let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "flume-tasks-"));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

const ls = (state: string) => {
  try {
    return readdirSync(join(root, "flume/tasks", state));
  } catch {
    return [];
  }
};
const put = (state: string, name: string, text: string) => {
  mkdirSync(join(root, "flume/tasks", state), { recursive: true });
  writeFileSync(join(root, "flume/tasks", state, name), text);
};
const fm = (id: string, extra = "", kind = "feature") =>
  `---\nid: ${id}\ntitle: T ${id}\nkind: ${kind}\ncreated: 2026-11-20\n${extra}---\n## The ask\n\n`;
const runCheck = () => {
  const r = spawnSync("node", [bin, "check"], { cwd: root, encoding: "utf8" });
  return { code: r.status, out: r.stdout.split("\n").filter(Boolean) };
};
const idOf = (path: string) => path.slice(-7, -3);

describe("task files", () => {
  it("s-75e6 a new task lands in open", () => {
    createTask(root, { title: "Fix the login redirect", kind: "bug" });
    expect(ls("open").length).toBe(1);
    expect(ls("open")[0]).toMatch(/\.md$/);
    expect(ls("resolved").length).toBe(0);
  });

  it("s-de2d slug punctuation and case", () => {
    const e = createTask(root, { title: " Login page: drops the redirect (SSO)! ", kind: "bug" });
    expect(e.stem).toMatch(/^login-page-drops-the-redirect-sso-[a-z0-9]{4}$/);
  });

  it("s-e99a a long title is cut", () => {
    const title = Array.from({ length: 8 }, () => "abcdefghij").join(" ");
    const e = createTask(root, { title, kind: "chore" });
    const slug = e.stem.slice(0, -5);
    expect(slug.length).toBeLessThanOrEqual(50);
    expect(slug.endsWith("-")).toBe(false);
    expect(slugify("a".repeat(49) + " bbb")).toBe("a".repeat(49));
  });

  it("s-7ceb a new ID is well formed", () => {
    for (let i = 0; i < 50; i++) createTask(root, { title: `t${i}`, kind: "chore" });
    for (const e of listTaskFiles(root)) {
      expect(e.nameId).toHaveLength(4);
      expect([...e.nameId].every((c) => ID_ALPHABET.includes(c))).toBe(true);
      expect(e.nameId).not.toBe("xxxx");
    }
    expect(isValidId("xxxx")).toBe(false);
    expect(isValidId("a0bc")).toBe(false);
    expect(mintId(new Set())).toMatch(/^[a-hjkmnp-z2-9]{4}$/);
  });

  it("s-96f3 IDs of resolved tasks stay taken", () => {
    for (let i = 0; i < 200; i++) {
      createTask(root, { title: `t${i}`, kind: "chore" });
    }
    for (const e of listTaskFiles(root)) resolveTask(root, e.nameId);
    for (let i = 0; i < 200; i++) createTask(root, { title: `u${i}`, kind: "chore" });
    const ids = new Set(listTaskFiles(root).map((e) => e.nameId));
    expect(ids.size).toBe(400);
  });

  it("s-b4b4 retitle keeps the name", () => {
    const e = createTask(root, { title: "Old title", kind: "chore" });
    retitleTask(root, e.nameId, "Brand new title");
    expect(ls("open")).toEqual([`${e.stem}.md`]);
    expect(readFileSync(join(root, e.path), "utf8")).toContain("title: Brand new title\n");
  });

  it("s-ee5a a new task has the minimal fields", () => {
    const e = createTask(root, {
      title: "Add a roadmap",
      kind: "feature",
      now: new Date("2026-11-20T10:00:00Z"),
    });
    const r = parseTaskFile(e.text);
    if (!r.ok) throw new Error(r.error);
    expect(r.file.doc.toJS()).toEqual({
      id: e.nameId,
      title: "Add a roadmap",
      kind: "feature",
      created: "2026-11-20",
    });
  });

  it("s-9e99 IDs in front matter are bare", () => {
    const epic = createTask(root, { title: "Big", kind: "epic" });
    const e = createTask(root, { title: "Part", kind: "feature", parent: `[[${epic.stem}]]` });
    expect(e.text).toContain(`\nparent: ${epic.nameId}\n`);
  });

  it("s-ad67 an unknown kind is refused", () => {
    expect(() => createTask(root, { title: "x", kind: "idea" })).toThrow(/feature, bug, chore/);
    expect(ls("open").length).toBe(0);
  });

  it("s-8719 resolve then reopen", () => {
    const e = createTask(root, { title: "Thing", kind: "chore" });
    const r = resolveTask(root, e.nameId, new Date("2026-11-21T01:02:03.456Z"));
    expect(r.state).toBe("resolved");
    expect(r.text).toContain("resolved: 2026-11-21T01:02:03Z\n");
    expect(r.stem).toBe(e.stem);
    const o = reopenTask(root, e.nameId);
    expect(o.state).toBe("open");
    expect(o.text).not.toContain("resolved");
  });

  it("s-a614 a parent must be an epic", () => {
    const f = createTask(root, { title: "Feat", kind: "feature" });
    expect(() => createTask(root, { title: "Kid", kind: "feature", parent: f.nameId })).toThrow(
      /not an epic/,
    );
    expect(ls("open").length).toBe(1);
  });

  it("s-3437 default body", () => {
    const e = createTask(root, { title: "Plain", kind: "chore" });
    expect(e.text.endsWith("---\n## The ask\n\n")).toBe(true);
  });

  it("s-fa81 a link stays valid after a move", () => {
    const b = createTask(root, { title: "Bee", kind: "chore" });
    createTask(root, { title: "Aye", kind: "chore", body: `See [[${b.stem}|bee]].\n` });
    expect(checkProject(root)).toEqual([]);
    resolveTask(root, b.nameId);
    expect(checkProject(root)).toEqual([]);
  });
});

describe("flume check", () => {
  it("s-5496 a clean project", () => {
    createTask(root, { title: "one", kind: "epic" });
    const b = createTask(root, { title: "two", kind: "chore" });
    createTask(root, { title: "three", kind: "chore" });
    resolveTask(root, b.nameId);
    expect(runCheck()).toEqual({ code: 0, out: [] });
  });

  it("s-d5a6 a hand edit breaks the ID", () => {
    const e = createTask(root, { title: "one", kind: "chore" });
    const p = join(root, e.path);
    writeFileSync(
      p,
      readFileSync(p, "utf8").replace(new RegExp(`id: "?${e.nameId}"?`), "id: zzzz"),
    );
    const r = runCheck();
    expect(r.code).toBe(1);
    expect(r.out).toHaveLength(1);
    expect(r.out[0]).toMatch(new RegExp(`^${e.path}: id zzzz differs from the id`));
  });

  it("s-b0d8 duplicate IDs", () => {
    put("open", "aa-k7tm.md", fm("k7tm"));
    put("resolved", "bb-k7tm.md", fm("k7tm", "resolved: 2026-11-21T00:00:00Z\n"));
    const r = runCheck();
    expect(r.code).toBe(1);
    expect(r.out.filter((l) => l.includes("duplicate id"))).toHaveLength(2);
    expect(r.out.some((l) => l.startsWith("flume/tasks/open/aa-k7tm.md:"))).toBe(true);
    expect(r.out.some((l) => l.startsWith("flume/tasks/resolved/bb-k7tm.md:"))).toBe(true);
  });

  it("s-b427 a broken reference and a broken link", () => {
    put(
      "open",
      "aa-k7tm.md",
      `${fm("k7tm", "blocked_by: [abcd]\n")}[[no-such-task-abcd]]\n`.replace("abcd]", "mmmm]"),
    );
    const r = runCheck();
    expect(r.code).toBe(1);
    expect(r.out).toHaveLength(2);
    expect(r.out.some((l) => l.includes("blocked_by mmmm names no task"))).toBe(true);
    expect(r.out.some((l) => l.includes("[[no-such-task-abcd]]"))).toBe(true);
  });

  it("s-a4c6 wrong folder", () => {
    put("open", "aa-k7tm.md", fm("k7tm", "resolved: 2026-11-21T00:00:00Z\n"));
    const r = runCheck();
    expect(r.code).toBe(1);
    expect(r.out).toHaveLength(1);
    expect(r.out[0]).toContain("aa-k7tm.md");
    put("open", "aa-k7tm.md", fm("k7tm"));
    put("resolved", "bb-n3pq.md", fm("n3pq"));
    expect(checkProject(root).map(formatProblem).join("\n")).toContain("no resolved field");
  });

  it("s-cb3b a bad file name", () => {
    put("open", "Bad Name.md", fm("k7tm"));
    const r = runCheck();
    expect(r.code).toBe(1);
    expect(r.out.some((l) => l.startsWith("flume/tasks/open/Bad Name.md:"))).toBe(true);
  });

  it("s-258c a dependency cycle", () => {
    put("open", "aa-k7tm.md", fm("k7tm", "blocked_by: [n3pq]\n"));
    put("open", "bb-n3pq.md", fm("n3pq", "blocked_by: [k7tm]\n"));
    const r = runCheck();
    expect(r.code).toBe(1);
    expect(r.out).toHaveLength(2);
  });

  it("s-8645 check offline", () => {
    put("open", "aa-k7tm.md", fm("n3pq"));
    const r = runCheck();
    expect(r.code).toBe(1);
    expect(r.out).toHaveLength(1);
    expect(r.out[0]).toContain("flume/tasks/open/aa-k7tm.md");
  });

  it("reports front matter, kind, parent and field problems", () => {
    put("open", "a-k7tm.md", "no front matter\n");
    put("open", "b-n3pq.md", "---\nid: n3pq\ntitle: x\n---\n");
    put("open", "c-d4ef.md", fm("d4ef", "", "idea"));
    put("open", "d-g5hj.md", fm("g5hj", "parent: d4ef\n"));
    const text = checkProject(root).map(formatProblem).join("\n");
    expect(text).toContain("front matter missing");
    expect(text).toContain("required field kind missing");
    expect(text).toContain("kind idea is not one of");
    expect(text).toContain("parent d4ef is not an epic");
  });
});

describe("task file format", () => {
  it("round-trips without reordering or losing the body", () => {
    const text =
      '---\nkind: bug\nid: k7tm\ntitle: "A: tricky"\nrelated:\n  - n3pq\ncreated: 2026-11-20\n---\n## The ask\n\n---\ntext --- more\n\n[[x-n3pq|y]]\n';
    const r = parseTaskFile(text);
    if (!r.ok) throw new Error(r.error);
    expect(serializeTaskFile(r.file)).toBe(text);
  });

  it("resolves bare IDs, stems and links", () => {
    const e = createTask(root, { title: "Find me", kind: "chore" });
    const all = listTaskFiles(root);
    expect(resolveRef(all, e.nameId)?.stem).toBe(e.stem);
    expect(resolveRef(all, e.stem)?.stem).toBe(e.stem);
    expect(resolveRef(all, `[[${e.stem}|label]]`)?.stem).toBe(e.stem);
    expect(resolveRef(all, "zzzz")).toBeUndefined();
    expect(idOf(e.path)).toBe(e.nameId);
  });
});
