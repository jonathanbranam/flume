import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
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
const flume = (cwd: string, ...args: string[]) =>
  spawnSync("node", [bin, ...args], { cwd, encoding: "utf8", env });

const dirs: string[] = [];
afterAll(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});
function folder(): string {
  const d = realpathSync(mkdtempSync(join(tmpdir(), "flume-proj-")));
  dirs.push(d);
  return d;
}
/** A local repository (the git URL in these tests) named `name`, with a develop branch. */
function source(name: string, files: Record<string, string> = { r: "x" }): string {
  const repo = join(folder(), name);
  mkdirSync(repo);
  git(repo, "init", "-q", "-b", "main");
  for (const [f, c] of Object.entries(files)) writeFileSync(join(repo, f), c);
  git(repo, "add", "-A");
  git(repo, "commit", "-qm", "first");
  git(repo, "branch", "develop");
  return repo;
}
const yaml = (projects: Record<string, { url?: string; branch?: string }>) =>
  `dir: flume\nprojects:\n${Object.entries(projects)
    .map(
      ([n, p]) =>
        `  ${n}:\n${p.url ? `    url: ${p.url}\n` : ""}${p.branch ? `    branch: ${p.branch}\n` : ""}`,
    )
    .join("")}`;
/** A tasks repo with this flume.yaml, set up as the task root of a fresh workspace (no init run). */
function setup(projects: Record<string, { url?: string; branch?: string }>) {
  const ws = folder();
  const tasks = source("tasks", { "flume.yaml": yaml(projects) });
  return { ws, tasks };
}
const count = (repo: string) => git(repo, "rev-list", "--count", "HEAD");

describe("flume init and projects", () => {
  it("s-9b23 init ignores project folders", () => {
    const backend = source("backend");
    const { ws, tasks } = setup({ backend: { url: backend } });
    const r = flume(ws, "init", "--root", tasks);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("flume project clone");
    expect(r.stdout).toContain("flume serve");
    expect(r.stdout).not.toContain("backend");
    expect(existsSync(join(ws, "backend"))).toBe(false);
  });

  it("s-9766 init no longer clones", () => {
    const { ws, tasks } = setup({ backend: { url: source("backend") } });
    const r = flume(ws, "init", "--root", tasks, "--clone");
    expect(r.status).toBe(2);
    expect(existsSync(join(ws, "backend"))).toBe(false);
  });

  it("s-1d04 init again is safe", () => {
    const { ws, tasks } = setup({});
    expect(flume(ws, "init", "--root", tasks).status).toBe(0);
    const n = count(tasks);
    expect(flume(ws, "init").status).toBe(0);
    expect(count(tasks)).toBe(n);
  });

  it("s-5c01 project clone on a branch", () => {
    const { ws, tasks } = setup({ backend: { url: source("backend"), branch: "develop" } });
    flume(ws, "init", "--root", tasks);
    const r = flume(ws, "project", "clone");
    expect(r.status).toBe(0);
    expect(git(join(ws, "backend"), "rev-parse", "--abbrev-ref", "HEAD")).toBe("develop");
  });

  it("s-7930 a failed clone is reported and the rest carry on", () => {
    const good = source("good");
    const bad = join(folder(), "nothing-here");
    const { ws, tasks } = setup({ bad: { url: bad }, good: { url: good } });
    flume(ws, "init", "--root", tasks);
    const r = flume(ws, "project", "clone");
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("bad");
    expect(r.stderr).toContain(bad);
    expect(existsSync(join(ws, "good/r"))).toBe(true);
  });

  it("s-3782 an existing folder is skipped", () => {
    const { ws, tasks } = setup({ backend: { url: source("backend") } });
    flume(ws, "init", "--root", tasks);
    mkdirSync(join(ws, "backend"));
    writeFileSync(join(ws, "backend/mine"), "keep");
    const r = flume(ws, "project", "clone");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("skipped");
    expect(readFileSync(join(ws, "backend/mine"), "utf8")).toBe("keep");
    expect(existsSync(join(ws, "backend/r"))).toBe(false);
  });

  it("s-5c02 project clone named only, with JSON", () => {
    const { ws, tasks } = setup({
      backend: { url: source("backend") },
      frontend: { url: source("frontend") },
    });
    flume(ws, "init", "--root", tasks);
    mkdirSync(join(ws, "backend"));
    const one = JSON.parse(flume(ws, "project", "clone", "frontend", "--json").stdout);
    expect(one).toEqual([{ name: "frontend", status: "cloned" }]);
    const all = JSON.parse(flume(ws, "project", "clone", "--json").stdout);
    expect(all).toHaveLength(2);
    for (const r of all) {
      expect(r.status).toBe("skipped");
      expect(r.reason).toBeTruthy();
    }
  });

  it("s-5c03 project clone unknown name", () => {
    const { ws, tasks } = setup({ backend: { url: source("backend") } });
    flume(ws, "init", "--root", tasks);
    const r = flume(ws, "project", "clone", "nosuch");
    expect(r.status).toBe(2);
    expect(existsSync(join(ws, "backend"))).toBe(false);
    expect(existsSync(join(ws, "nosuch"))).toBe(false);
  });

  it("s-5c04 project clone skips a project with no url", () => {
    const { ws, tasks } = setup({ backend: { branch: "main" } });
    flume(ws, "init", "--root", tasks);
    const r = flume(ws, "project", "clone", "--json");
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout)[0].status).toBe("skipped");
  });

  it("s-2a1f clone makes the whole workspace", () => {
    const backend = source("backend");
    const tasks = source("fluff-flume", { "flume.yaml": yaml({ backend: { url: backend } }) });
    const ws = join(folder(), "new", "fluff");
    const r = flume(folder(), "clone", tasks, ws);
    expect(r.status).toBe(0);
    expect(existsSync(join(ws, "fluff-flume/flume.yaml"))).toBe(true);
    expect(existsSync(join(ws, "backend/r"))).toBe(true);
    expect(readFileSync(join(ws, ".flume/config.yaml"), "utf8")).toContain("root: fluff-flume");
    expect(r.stdout).toContain("flume serve");
  });

  it("s-bc32 clone into the current folder", () => {
    const tasks = source("fluff-flume", { "flume.yaml": "dir: flume\n" });
    const ws = folder();
    const r = flume(ws, "clone", tasks);
    expect(r.status).toBe(0);
    expect(existsSync(join(ws, "fluff-flume"))).toBe(true);
    expect(existsSync(join(ws, ".flume"))).toBe(true);
  });

  it("s-566d clone of a bad URL", () => {
    const ws = folder();
    const r = flume(ws, "clone", join(ws, "nothing-here"));
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("failed");
    expect(existsSync(join(ws, ".flume"))).toBe(false);
  });

  it("s-e816 clone without a URL", () => {
    expect(flume(folder(), "clone").status).toBe(2);
  });

  it("s-52c6 project list as text and JSON", () => {
    const backend = source("backend");
    const { ws, tasks } = setup({
      backend: { url: backend, branch: "develop" },
      frontend: { url: "/nonexistent/frontend.git" },
    });
    flume(ws, "init", "--root", tasks);
    const t = flume(ws, "project", "list");
    expect(t.status).toBe(0);
    expect(t.stdout).toContain(`backend\t${backend}\tdevelop\n`);
    expect(t.stdout).toContain("frontend\t/nonexistent/frontend.git\t\n");
    const j = JSON.parse(flume(ws, "project", "list", "--json").stdout);
    expect(j).toEqual([
      { name: "backend", url: backend, branch: "develop" },
      { name: "frontend", url: "/nonexistent/frontend.git", branch: "" },
    ]);
  });

  it("s-9440 project add", () => {
    const { ws, tasks } = setup({});
    flume(ws, "init", "--root", tasks);
    const backend = source("backend");
    const n = Number(count(tasks));
    const r = flume(ws, "project", "add", backend, "--branch", "develop");
    expect(r.status).toBe(0);
    const y = readFileSync(join(tasks, "flume.yaml"), "utf8");
    expect(y).toContain("backend:");
    expect(y).toContain(`url: ${backend}`);
    expect(y).toContain("branch: develop");
    expect(Number(count(tasks))).toBe(n + 1);
    expect(git(join(ws, "backend"), "rev-parse", "--abbrev-ref", "HEAD")).toBe("develop");
  });

  it("s-8d3e project add by name, with no URL, warns and clones nothing", () => {
    const { ws, tasks } = setup({});
    flume(ws, "init", "--root", tasks);
    const n = Number(count(tasks));
    const r = flume(ws, "project", "add", "backend");
    expect(r.status).toBe(0);
    expect(r.stderr).toMatch(/warning.*backend.*no URL/);
    const y = readFileSync(join(tasks, "flume.yaml"), "utf8");
    expect(y).toMatch(/backend:\s*(\{\}|null)?\s*$/m);
    expect(y).not.toContain("url:");
    expect(Number(count(tasks))).toBe(n + 1);
    expect(existsSync(join(ws, "backend"))).toBe(false);
    const j = JSON.parse(flume(ws, "project", "list", "--json").stdout);
    expect(j).toEqual([{ name: "backend", url: "", branch: "" }]);
  });

  it("s-f003 project add by name refuses a branch", () => {
    const { ws, tasks } = setup({});
    flume(ws, "init", "--root", tasks);
    const before = readFileSync(join(tasks, "flume.yaml"), "utf8");
    const n = count(tasks);
    const r = flume(ws, "project", "add", "backend", "--branch", "develop");
    expect(r.status).toBe(2);
    expect(readFileSync(join(tasks, "flume.yaml"), "utf8")).toBe(before);
    expect(count(tasks)).toBe(n);
  });

  it("s-bd6a project add refuses a known name", () => {
    const backend = source("backend");
    const { ws, tasks } = setup({ backend: { url: backend } });
    flume(ws, "init", "--root", tasks);
    const before = readFileSync(join(tasks, "flume.yaml"), "utf8");
    const n = count(tasks);
    const r = flume(ws, "project", "add", source("other"), "--name", "backend");
    expect(r.status).toBe(1);
    expect(readFileSync(join(tasks, "flume.yaml"), "utf8")).toBe(before);
    expect(count(tasks)).toBe(n);
  });

  it("s-9cec project add refuses a folder in the way", () => {
    const { ws, tasks } = setup({});
    flume(ws, "init", "--root", tasks);
    mkdirSync(join(ws, "backend"));
    const before = readFileSync(join(tasks, "flume.yaml"), "utf8");
    const n = count(tasks);
    const r = flume(ws, "project", "add", source("backend"), "--name", "backend");
    expect(r.status).toBe(1);
    expect(readFileSync(join(tasks, "flume.yaml"), "utf8")).toBe(before);
    expect(count(tasks)).toBe(n);
  });

  it("s-a386 check does not report a project without a url", () => {
    const { tasks } = setup({ backend: { branch: "main" } });
    const r = flume(tasks, "check");
    expect(r.status).toBe(0);
    expect(r.stdout).not.toMatch(/backend/);
  });

  it("s-7873 check reports a bad project name", () => {
    const { tasks } = setup({ "a/b": { url: "x" } });
    const r = flume(tasks, "check");
    expect(r.status).toBe(1);
    expect(r.stdout).toMatch(/flume\.yaml.*a\/b/);
  });
});
