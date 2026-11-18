import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addComment,
  checkProject,
  createTask,
  formatProblem,
  ID_ALPHABET,
  isValidId,
  listTaskFiles,
  mintId,
  parseTaskYaml,
  reopenTask,
  resolveRef,
  resolveTask,
  retitleTask,
  serializeTaskYaml,
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
/** Write a task folder by hand: task.yaml from `yaml`, body.md from `body`. */
const put = (state: string, name: string, yaml: string, body = "## The ask\n\n") => {
  const d = join(root, "flume/tasks", state, name);
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, "task.yaml"), yaml);
  writeFileSync(join(d, "body.md"), body);
};
const fm = (id: string, extra = "", kind = "feature", status = "open") =>
  `id: ${id}\ntitle: T ${id}\nkind: ${kind}\nstatus: ${status}\ncreated: 2026-11-20\n${extra}`;
const runCheck = () => {
  const r = spawnSync("node", [bin, "check"], { cwd: root, encoding: "utf8" });
  return { code: r.status, out: r.stdout.split("\n").filter(Boolean) };
};
const read = (e: { path: string }, f: string) => readFileSync(join(root, e.path, f), "utf8");

describe("task files", () => {
  it("s-75e6 a new task lands in open", () => {
    createTask(root, { title: "Fix the login redirect", kind: "bug" });
    expect(ls("open").length).toBe(1);
    const d = join(root, "flume/tasks/open", ls("open")[0] as string);
    expect(readdirSync(d).sort()).toEqual(["body.md", "task.yaml"]);
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
    // 30s: 400 sequential creates are slow under parallel load
  }, 30000);

  it("s-b4b4 retitle keeps the name", () => {
    const e = createTask(root, { title: "Old title", kind: "chore" });
    retitleTask(root, e.nameId, "Brand new title");
    expect(ls("open")).toEqual([e.stem]);
    expect(read(e, "task.yaml")).toContain("title: Brand new title\n");
  });

  it("s-ee5a a new task has the minimal fields", () => {
    const e = createTask(root, {
      title: "Add a roadmap",
      kind: "feature",
      now: new Date("2026-11-20T10:00:00Z"),
    });
    const r = parseTaskYaml(read(e, "task.yaml"));
    if (!r.ok) throw new Error(r.error);
    expect(r.file.doc.toJS()).toEqual({
      id: e.nameId,
      title: "Add a roadmap",
      kind: "feature",
      status: "open",
      created: "2026-11-20",
    });
  });

  it("s-9e99 IDs in task.yaml are bare", () => {
    const epic = createTask(root, { title: "Big", kind: "epic" });
    const e = createTask(root, { title: "Part", kind: "feature", parent: `[[${epic.stem}]]` });
    expect(read(e, "task.yaml")).toContain(`\nparent: ${epic.nameId}\n`);
  });

  it("s-ad67 an unknown kind is refused", () => {
    expect(() => createTask(root, { title: "x", kind: "idea" })).toThrow(/feature, bug, chore/);
    expect(ls("open").length).toBe(0);
  });

  it("s-8719 resolve then reopen", () => {
    const e = createTask(root, { title: "Thing", kind: "chore" });
    const r = resolveTask(root, e.nameId, new Date("2026-11-21T01:02:03.456Z"));
    expect(r.state).toBe("resolved");
    expect(read(r, "task.yaml")).toContain("resolved: 2026-11-21T01:02:03Z\n");
    expect(read(r, "task.yaml")).toContain("status: resolved\n");
    expect(ls("open")).toEqual([]);
    expect(r.stem).toBe(e.stem);
    const o = reopenTask(root, e.nameId);
    expect(o.state).toBe("open");
    expect(read(o, "task.yaml")).not.toContain("resolved:");
    expect(read(o, "task.yaml")).toContain("status: open\n");
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
    expect(read(e, "body.md")).toBe("## The ask\n\n");
  });

  it("s-1c69 first and second comment", () => {
    const e = createTask(root, { title: "Plain", kind: "chore" });
    addComment(root, e.stem, "First", "scout", new Date(2026, 10, 17, 14, 5));
    const u = addComment(root, e.stem, "Second", "remus", new Date(2026, 10, 17, 14, 6));
    expect(read(u, "comments.md")).toMatch(
      /^### 2026-11-17 14:05 [+-]\d\d:\d\d, scout\n\nFirst\n\n### 2026-11-17 14:06 [+-]\d\d:\d\d, remus\n\nSecond\n$/,
    );
    expect(read(u, "body.md")).toBe("## The ask\n\n");
  });

  it("s-b2c3 other files stay and travel", () => {
    const e = createTask(root, { title: "Plain", kind: "chore" });
    writeFileSync(join(root, e.path, "notes.csv"), "a,b\n1,2\n");
    addComment(root, e.stem, "Hi", "scout");
    const r = resolveTask(root, e.stem);
    expect(readFileSync(join(root, r.path, "notes.csv"), "utf8")).toBe("a,b\n1,2\n");
    expect(r.path).toContain("/resolved/");
    expect(read(r, "body.md")).toBe("## The ask\n\n");
  });

  it("s-daad tasks at the top of the repository", () => {
    writeFileSync(join(root, "flume.yaml"), "dir: .\n");
    const e = createTask(root, { title: "Top", kind: "chore" });
    expect(e.path).toBe(`tasks/open/${e.stem}`);
    expect(existsSync(join(root, "tasks/open", e.stem, "task.yaml"))).toBe(true);
    expect(existsSync(join(root, "flume"))).toBe(false);
  });

  it("s-ed18 a task with a project", () => {
    const a = createTask(root, { title: "Mine", kind: "chore", project: "backend" });
    const b = createTask(root, { title: "Free", kind: "chore" });
    expect(read(a, "task.yaml")).toContain("project: backend\n");
    expect(read(b, "task.yaml")).not.toContain("project");
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
    const p = join(root, e.path, "task.yaml");
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
    put("open", "aa-k7tm", fm("k7tm"));
    put(
      "resolved",
      "bb-k7tm",
      fm("k7tm", "resolved: 2026-11-21T00:00:00Z\n", "feature", "resolved"),
    );
    const r = runCheck();
    expect(r.code).toBe(1);
    expect(r.out.filter((l) => l.includes("duplicate id"))).toHaveLength(2);
    expect(r.out.some((l) => l.startsWith("flume/tasks/open/aa-k7tm:"))).toBe(true);
    expect(r.out.some((l) => l.startsWith("flume/tasks/resolved/bb-k7tm:"))).toBe(true);
  });

  it("s-b427 a broken reference and a broken link", () => {
    put("open", "aa-k7tm", fm("k7tm", "blocked_by: [mmmm]\n"), "[[no-such-task-abcd]]\n");
    const r = runCheck();
    expect(r.code).toBe(1);
    expect(r.out).toHaveLength(2);
    expect(r.out.some((l) => l.includes("blocked_by mmmm names no task"))).toBe(true);
    expect(r.out.some((l) => l.includes("[[no-such-task-abcd]]"))).toBe(true);
  });

  it("s-a4c6 wrong folder", () => {
    put("open", "aa-k7tm", fm("k7tm", "resolved: 2026-11-21T00:00:00Z\n"));
    const r = runCheck();
    expect(r.code).toBe(1);
    expect(r.out).toHaveLength(1);
    expect(r.out[0]).toContain("aa-k7tm");
    put("open", "aa-k7tm", fm("k7tm"));
    put("resolved", "bb-n3pq", fm("n3pq", "", "feature", "resolved"));
    expect(checkProject(root).map(formatProblem).join("\n")).toContain("no resolved field");
  });

  it("s-cb3b a bad file name", () => {
    put("open", "Bad Name", fm("k7tm"));
    const r = runCheck();
    expect(r.code).toBe(1);
    expect(r.out.some((l) => l.startsWith("flume/tasks/open/Bad Name:"))).toBe(true);
  });

  it("s-258c a dependency cycle", () => {
    put("open", "aa-k7tm", fm("k7tm", "blocked_by: [n3pq]\n"));
    put("open", "bb-n3pq", fm("n3pq", "blocked_by: [k7tm]\n"));
    const r = runCheck();
    expect(r.code).toBe(1);
    expect(r.out).toHaveLength(2);
  });

  it("s-8645 check offline", () => {
    put("open", "aa-k7tm", fm("n3pq"));
    const r = runCheck();
    expect(r.code).toBe(1);
    expect(r.out).toHaveLength(1);
    expect(r.out[0]).toContain("flume/tasks/open/aa-k7tm");
  });

  it("s-da82 status disagrees with the folder", () => {
    const e = createTask(root, { title: "one", kind: "chore" });
    const p = join(root, e.path, "task.yaml");
    writeFileSync(p, readFileSync(p, "utf8").replace("status: open", "status: resolved"));
    const r = runCheck();
    expect(r.code).toBe(1);
    expect(r.out).toHaveLength(1);
    expect(r.out[0]).toContain("status resolved differs from the folder open");
  });

  it("reports missing files, kind, parent and field problems", () => {
    put("open", "a-k7tm", "id: [\n");
    put("open", "b-n3pq", "id: n3pq\ntitle: x\n");
    put("open", "c-d4ef", fm("d4ef", "", "idea"));
    put("open", "d-g5hj", fm("g5hj", "parent: d4ef\n"));
    mkdirSync(join(root, "flume/tasks/open/e-m2np"));
    const text = checkProject(root).map(formatProblem).join("\n");
    expect(text).toContain("task.yaml not parsable");
    expect(text).toContain("required field kind missing");
    expect(text).toContain("kind idea is not one of");
    expect(text).toContain("parent d4ef is not an epic");
    expect(text).toContain("flume/tasks/open/e-m2np: task.yaml missing");
    expect(text).toContain("flume/tasks/open/e-m2np: body.md missing");
  });
});

describe("task file format", () => {
  it("round-trips without reordering", () => {
    const text =
      'kind: bug\nid: k7tm\ntitle: "A: tricky"\nrelated:\n  - n3pq\ncreated: 2026-11-20\n';
    const r = parseTaskYaml(text);
    if (!r.ok) throw new Error(r.error);
    expect(serializeTaskYaml(r.file)).toBe(text);
  });

  it("resolves bare IDs, stems and links", () => {
    const e = createTask(root, { title: "Find me", kind: "chore" });
    const all = listTaskFiles(root);
    expect(resolveRef(all, e.nameId)?.stem).toBe(e.stem);
    expect(resolveRef(all, e.stem)?.stem).toBe(e.stem);
    expect(resolveRef(all, `[[${e.stem}|label]]`)?.stem).toBe(e.stem);
    expect(resolveRef(all, "zzzz")).toBeUndefined();
    expect(e.path.slice(-4)).toBe(e.nameId);
  });
});
