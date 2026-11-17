import { execFileSync, spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const bin = new URL("../bin/flume.js", import.meta.url).pathname;
const env = {
  ...process.env,
  GIT_AUTHOR_NAME: "t",
  GIT_AUTHOR_EMAIL: "t@example.com",
  GIT_COMMITTER_NAME: "t",
  GIT_COMMITTER_EMAIL: "t@example.com",
  FLUME_URL: "",
};
const git = (cwd: string, ...args: string[]) =>
  execFileSync("git", args, { cwd, encoding: "utf8", env }).trim();

const dirs: string[] = [];
const pids: number[] = [];
afterAll(() => {
  for (const pid of pids) {
    try {
      process.kill(pid);
    } catch {}
  }
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

interface Run {
  status: number | null;
  stdout: string;
  stderr: string;
}
const flume = (cwd: string, args: string[], input?: string, extra: NodeJS.ProcessEnv = {}): Run =>
  spawnSync("node", [bin, ...args], { cwd, encoding: "utf8", env: { ...env, ...extra }, input });

function tempRepo(): string {
  const d = realpathSync(mkdtempSync(join(tmpdir(), "flume-taskcli-")));
  dirs.push(d);
  git(d, "init", "-q", "-b", "main");
  writeFileSync(join(d, "README.md"), "x\n");
  git(d, "add", "-A");
  git(d, "commit", "-qm", "init");
  return d;
}

/** A repo with a real `flume serve` process (stopped by pid in afterAll). */
async function project(): Promise<string> {
  const repo = tempRepo();
  const child = spawn("node", [bin, "serve"], { cwd: repo, env });
  if (child.pid) pids.push(child.pid);
  await new Promise<void>((res, rej) => {
    child.stdout.once("data", () => res());
    child.once("exit", () => rej(new Error("serve exited")));
  });
  return repo;
}

const ls = (repo: string, state: string) => {
  const p = join(repo, "flume/tasks", state);
  return existsSync(p) ? readdirSync(p).sort() : [];
};
const read = (repo: string, path: string) => readFileSync(join(repo, path), "utf8");
/** Create a task through the CLI; returns its id and path. */
function mk(repo: string, ...args: string[]): { id: string; path: string } {
  const r = flume(repo, ["task", "new", ...args]);
  expect(r.status).toBe(0);
  const [id, path] = r.stdout.trim().split(" ") as [string, string];
  return { id, path };
}

describe("flume task commands", () => {
  it("s-41e6 daemon not running", () => {
    const repo = tempRepo();
    const r = flume(repo, ["task", "list"]);
    expect(r.status).toBe(1);
    expect(r.stderr).toBe(
      "flume: the flume daemon is not running for this project.\nAsk the human to start it: flume serve (in its own pane).\n",
    );
  });

  it("s-2c86 unknown command", () => {
    const r = flume(tempRepo(), ["frobnicate"]);
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/usage/i);
  });

  it("s-0c9d task usage errors", async () => {
    const repo = await project();
    for (const args of [
      ["task", "new"],
      ["task", "list", "--bogus"],
      ["task", "frob"],
    ]) {
      const r = flume(repo, args);
      expect(r.status).toBe(2);
      expect(r.stderr).toContain("flume:");
    }
    flume(repo, ["stop"]);
  });

  it("--help for each command lists its options", () => {
    const repo = tempRepo();
    expect(flume(repo, ["task", "--help"]).stdout).toContain("update ID FIELD VALUE");
    expect(flume(repo, ["task", "new", "--help"]).stdout).toContain("--blocked-by");
    expect(flume(repo, ["task", "list", "--help"]).stdout).toContain("--closed");
    expect(flume(repo, ["task", "comment", "--help"]).stdout).toContain("--body-file");
  });

  it("s-f616 new with a body from standard input", async () => {
    const repo = await project();
    const r = flume(
      repo,
      ["task", "new", "Fix redirect", "-k", "bug", "--body-file", "-"],
      "Users land on the home page",
    );
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/^[a-z0-9]{4} flume\/tasks\/open\/[^ \n]+\.md\n$/);
    const path = r.stdout.trim().split(" ")[1] as string;
    expect(read(repo, path)).toMatch(/kind: bug/);
    expect(read(repo, path).trim().endsWith("Users land on the home page")).toBe(true);
    flume(repo, ["stop"]);
  });

  it("s-803e default kind", async () => {
    const repo = await project();
    const t = mk(repo, "Add search");
    expect(read(repo, t.path)).toMatch(/kind: feature/);
    flume(repo, ["stop"]);
  });

  it("s-a33e bad parent", async () => {
    const repo = await project();
    const r = flume(repo, ["task", "new", "Child", "--parent", "abcd"]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("abcd");
    expect(ls(repo, "open")).toEqual([]);
    flume(repo, ["stop"]);
  });

  it("s-5a1c links and a body argument", async () => {
    const repo = await project();
    const a = mk(repo, "A");
    const b = mk(repo, "B");
    const c = mk(
      repo,
      "Follow up",
      "--blocked-by",
      a.id,
      "--related",
      b.id,
      "--body",
      "Details here",
    );
    const text = read(repo, c.path);
    expect(text).toMatch(new RegExp(`blocked_by:\\n  - "?${a.id}"?`));
    expect(text).toMatch(new RegExp(`related:\\n  - "?${b.id}"?`));
    expect(text.trim().endsWith("Details here")).toBe(true);
    flume(repo, ["stop"]);
  });

  it("s-e485 show by bare ID", async () => {
    const repo = await project();
    const t = mk(repo, "Shown", "--body", "Hello");
    const r = flume(repo, ["task", "show", t.id]);
    expect(r.status).toBe(0);
    expect(r.stdout).toBe(read(repo, t.path));
    const missing = flume(repo, ["task", "show", "abcd"]);
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain("abcd");
    flume(repo, ["stop"]);
  });

  it("s-13df show finds a resolved task", async () => {
    const repo = await project();
    const t = mk(repo, "Done");
    flume(repo, ["task", "close", t.id]);
    const r = flume(repo, ["task", "show", t.id]);
    expect(r.stdout).toBe(read(repo, t.path.replace("/open/", "/resolved/")));
    flume(repo, ["stop"]);
  });

  it("s-9e76 list default is open only", async () => {
    const repo = await project();
    mk(repo, "One");
    mk(repo, "Two");
    const three = mk(repo, "Three");
    flume(repo, ["task", "close", three.id]);
    const open = flume(repo, ["task", "list"]).stdout.trim().split("\n");
    expect(open).toHaveLength(2);
    for (const line of open) expect(line.split("\t")[2]).toBe("open");
    flume(repo, ["stop"]);
  });

  it("s-fcb0 closed and all", async () => {
    const repo = await project();
    mk(repo, "One");
    mk(repo, "Two");
    const three = mk(repo, "Three");
    flume(repo, ["task", "close", three.id]);
    const closed = flume(repo, ["task", "list", "--closed"]).stdout.trim().split("\n");
    expect(closed).toHaveLength(1);
    expect(closed[0]?.split("\t")).toEqual([three.id, "feature", "resolved", "Three"]);
    expect(flume(repo, ["task", "list", "--all"]).stdout.trim().split("\n")).toHaveLength(3);
    flume(repo, ["stop"]);
  });

  it("s-c56f filter by parent", async () => {
    const repo = await project();
    const epic = mk(repo, "Epic", "-k", "epic");
    const c1 = mk(repo, "Child 1", "--parent", epic.id);
    const c2 = mk(repo, "Child 2", "--parent", epic.id);
    mk(repo, "Other", "-k", "bug");
    const ids = flume(repo, ["task", "list", "--parent", epic.id])
      .stdout.trim()
      .split("\n")
      .map((l) => l.split("\t")[0])
      .sort();
    expect(ids).toEqual([c1.id, c2.id].sort());
    const bugs = flume(repo, ["task", "list", "--kind", "bug"]).stdout.trim().split("\n");
    expect(bugs).toHaveLength(1);
    flume(repo, ["stop"]);
  });

  it("s-6b2f list as JSON", async () => {
    const repo = await project();
    mk(repo, "One");
    mk(repo, "Two");
    const list = JSON.parse(flume(repo, ["task", "list", "--json"]).stdout);
    expect(list).toHaveLength(2);
    for (const t of list) {
      expect(t.id).toBeTruthy();
      expect(t.title).toBeTruthy();
      expect(t.kind).toBe("feature");
      expect(t.state).toBe("open");
    }
    const one = JSON.parse(flume(repo, ["task", "show", list[0].id, "--json"]).stdout);
    expect(one.id).toBe(list[0].id);
    flume(repo, ["stop"]);
  });

  it("s-9277 set blocked-by", async () => {
    const repo = await project();
    const a = mk(repo, "A", "-k", "epic");
    const b = mk(repo, "B");
    const r = flume(repo, ["task", "update", b.id, "blocked-by", a.id]);
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
    expect(read(repo, b.path)).toMatch(new RegExp(`blocked_by:\\n  - "?${a.id}"?`));
    flume(repo, ["stop"]);
  });

  it("s-cf95 clear the parent", async () => {
    const repo = await project();
    const a = mk(repo, "A", "-k", "epic");
    const b = mk(repo, "B");
    const kid = mk(repo, "Kid", "--parent", a.id);
    let r = flume(repo, ["task", "update", kid.id, "parent", ""]);
    expect(r.status).toBe(0);
    expect(read(repo, kid.path)).not.toMatch(/parent:/);
    r = flume(repo, ["task", "update", b.id, "title", "Renamed"]);
    expect(r.status).toBe(0);
    flume(repo, ["stop"]);
  });

  it("s-4fd6 unknown field refused", async () => {
    const repo = await project();
    const t = mk(repo, "A");
    const before = read(repo, t.path);
    const r = flume(repo, ["task", "update", t.id, "color", "red"]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("color");
    const bad = flume(repo, ["task", "update", t.id, "kind", "idea"]);
    expect(bad.status).toBe(1);
    expect(read(repo, t.path)).toBe(before);
    flume(repo, ["stop"]);
  });

  it("s-2660 two comments in order", async () => {
    const repo = await project();
    const t = mk(repo, "A");
    const env = { AGENT_NAME: "scout" };
    expect(flume(repo, ["task", "comment", t.id, "--text", "First"], undefined, env).status).toBe(
      0,
    );
    expect(flume(repo, ["task", "comment", t.id, "--body-file", "-"], "Second\n", env).status).toBe(
      0,
    );
    const body = read(repo, t.path);
    expect(body).toMatch(
      /\n## Comments\n\n### \d{4}-\d\d-\d\d \d\d:\d\d [+-]\d\d:\d\d, scout\n\nFirst\n\n### [^\n]*, scout\n\nSecond\n$/,
    );
    expect(body.match(/^## Comments$/gm)).toHaveLength(1);
    expect(flume(repo, ["task", "comment", t.id]).status).toBe(2);
    flume(repo, ["stop"]);
  });

  it("s-b27b close twice, and reopen", async () => {
    const repo = await project();
    const t = mk(repo, "A");
    expect(flume(repo, ["task", "close", t.id]).status).toBe(0);
    expect(flume(repo, ["task", "close", t.id]).status).toBe(1);
    expect(ls(repo, "open")).toEqual([]);
    expect(ls(repo, "resolved")).toHaveLength(1);
    expect(flume(repo, ["task", "reopen", t.id]).status).toBe(0);
    expect(flume(repo, ["task", "reopen", t.id]).status).toBe(1);
    expect(ls(repo, "open")).toHaveLength(1);
    flume(repo, ["stop"]);
  });

  it("s-bdbc every command works from a second worktree", async () => {
    const repo = await project();
    const wt = `${repo}-wt`;
    dirs.push(wt);
    git(repo, "worktree", "add", "-q", "-b", "side", wt);
    const t = mk(wt, "From the worktree", "--body", "b");
    // files land in the main checkout, not in the worktree
    expect(existsSync(join(repo, t.path))).toBe(true);
    expect(existsSync(join(wt, "flume"))).toBe(false);
    expect(flume(wt, ["task", "list"]).stdout).toContain("From the worktree");
    expect(flume(wt, ["task", "show", t.id]).stdout).toBe(read(repo, t.path));
    expect(flume(wt, ["task", "update", t.id, "title", "Renamed"]).status).toBe(0);
    expect(flume(wt, ["task", "comment", t.id, "--text", "n"]).status).toBe(0);
    expect(flume(wt, ["task", "close", t.id]).status).toBe(0);
    expect(flume(wt, ["task", "reopen", t.id]).status).toBe(0);
    expect(flume(wt, ["task", "list"]).stdout).toContain("Renamed");
    flume(repo, ["stop"]);
  });

  it("FLUME_URL overrides the recorded address", async () => {
    const repo = await project();
    const url = flume(repo, ["status"]).stdout.match(/running at (\S+)/)?.[1] as string;
    const other = tempRepo();
    const r = spawnSync("node", [bin, "task", "list"], {
      cwd: other,
      encoding: "utf8",
      env: { ...env, FLUME_URL: url },
    });
    expect(r.status).toBe(0);
    flume(repo, ["stop"]);
  });
});
