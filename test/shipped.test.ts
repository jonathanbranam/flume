import { execFileSync, spawn, spawnSync } from "node:child_process";
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
  AGENT_NAME: "",
  CLAUDECODE: "",
  CLAUDE_CODE_SESSION_ID: "",
};
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

const flume = (cwd: string, ...args: string[]) =>
  spawnSync("node", [bin, ...args], { cwd, encoding: "utf8", env });
const git = (cwd: string, ...args: string[]) =>
  execFileSync("git", args, { cwd, encoding: "utf8", env }).trim();
const count = (repo: string) => git(repo, "rev-list", "--count", "HEAD");
const shipped = (file: string) =>
  readFileSync(new URL(`../workflows/${file}`, import.meta.url), "utf8");
const read = (repo: string, file: string) => readFileSync(join(repo, "flume", file), "utf8");
const there = (repo: string, file: string) => existsSync(join(repo, "flume", file));

function folder(): string {
  const d = realpathSync(mkdtempSync(join(tmpdir(), "flume-shipped-")));
  dirs.push(d);
  return d;
}
function repository(): string {
  const d = folder();
  git(d, "init", "-q", "-b", "main");
  writeFileSync(join(d, "README.md"), "x\n");
  git(d, "add", "-A");
  git(d, "commit", "-qm", "first");
  return d;
}
/** A repository set up with flume init. */
function project(): string {
  const d = repository();
  expect(flume(d, "init").status).toBe(0);
  return d;
}
/** Start a real `flume serve` (stopped by pid in afterAll). */
async function serve(d: string): Promise<void> {
  const child = spawn("node", [bin, "serve"], { cwd: d, env });
  if (child.pid) pids.push(child.pid);
  await new Promise<void>((res, rej) => {
    child.stdout.once("data", () => res());
    child.once("exit", () => rej(new Error("serve exited")));
  });
}

describe("shipped workflows", { timeout: 30_000 }, () => {
  it("s-458f an installed workflow replaces the standard one", async () => {
    const repo = project();
    await serve(repo);
    expect(flume(repo, "workflow", "install", "none").status).toBe(0);
    const none = flume(repo, "prime", "--name", "a").stdout;
    expect(none).toContain("This repo does not follow a set workflow.");
    expect(none).not.toContain("## Working a task");
    expect(none).not.toContain("@replace");
    expect(flume(repo, "workflow", "install", "light", "--force").status).toBe(0);
    const light = flume(repo, "prime", "--name", "a").stdout;
    expect(light).toContain("need no task: just do them.");
    expect(light).not.toContain("## The human is in control");
    expect(light).not.toContain("@replace");
    const id = flume(repo, "task", "new", "A task").stdout.trim();
    const steps = flume(repo, "task", "instructions", id).stdout;
    expect(steps).toContain("Move straight to implement");
    expect(steps).not.toContain("Check that the task has a clear proposal");
    expect(flume(repo, "check").status).toBe(0);
  });

  it("s-b84a list as text and JSON", () => {
    const d = folder();
    const text = flume(d, "workflow", "install", "--list");
    expect(text.status).toBe(0);
    expect(text.stdout).toMatch(/^none\t.+\nlight\t.+\n$/);
    const json = flume(d, "workflow", "install", "--list", "--json");
    expect(json.status).toBe(0);
    const rows = JSON.parse(json.stdout) as { name: string; description: string }[];
    expect(rows.map((r) => r.name)).toEqual(["none", "light"]);
    expect(rows.every((r) => r.description !== "")).toBe(true);
    expect(flume(d, "workflow", "install", "none", "--list").status).toBe(2);
  });

  it("s-9d18 install into the workspace", () => {
    const repo = project();
    const before = Number(count(repo));
    expect(flume(repo, "workflow", "install", "light").status).toBe(0);
    for (const f of ["workflow.md", "phases.md"])
      expect(read(repo, `base/${f}`)).toBe(shipped(`light/${f}`));
    expect(Number(count(repo))).toBe(before + 1);
    expect(git(repo, "status", "--porcelain")).toBe("");
  });

  it("s-cf59 install for a project", () => {
    const repo = project();
    const r = flume(repo, "workflow", "install", "none", "--project", "web", "--json");
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout)).toEqual({
      workflow: "none",
      files: ["flume/projects/web/workflow.md"],
    });
    expect(read(repo, "projects/web/workflow.md")).toBe(shipped("none/workflow.md"));
    expect(there(repo, "base/workflow.md")).toBe(false);
  });

  it("s-8750 an existing file is kept unless forced", () => {
    const repo = project();
    mkdirSync(join(repo, "flume/base"), { recursive: true });
    writeFileSync(join(repo, "flume/base/phases.md"), "# Phases\n");
    git(repo, "add", "-A");
    git(repo, "commit", "-qm", "mine");
    const before = Number(count(repo));
    const r = flume(repo, "workflow", "install", "light");
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("phases.md");
    expect(there(repo, "base/workflow.md")).toBe(false);
    expect(read(repo, "base/phases.md")).toBe("# Phases\n");
    expect(Number(count(repo))).toBe(before);
    expect(flume(repo, "workflow", "install", "light", "--force").status).toBe(0);
    expect(read(repo, "base/phases.md")).toBe(shipped("light/phases.md"));
    expect(Number(count(repo))).toBe(before + 1);
  });

  it("s-2bce a name that cannot be installed", () => {
    const repo = project();
    const before = count(repo);
    expect(flume(repo, "workflow", "install").status).toBe(2);
    expect(flume(repo, "workflow", "install", "standard").status).toBe(2);
    expect(flume(repo, "workflow", "install", "none", "--project", "a/b").status).toBe(2);
    expect(count(repo)).toBe(before);
  });

  it("s-249d init with a workflow", () => {
    const repo = repository();
    expect(flume(repo, "init", "--workflow", "light").status).toBe(0);
    for (const f of ["workflow.md", "phases.md"])
      expect(read(repo, `base/${f}`)).toBe(shipped(`light/${f}`));
    expect(git(repo, "status", "--porcelain")).toBe("");
  });

  it("s-6ef1 init refuses and sets up nothing", () => {
    const bogus = repository();
    expect(flume(bogus, "init", "--workflow", "bogus").status).toBe(2);
    const taken = repository();
    mkdirSync(join(taken, "flume/base"), { recursive: true });
    writeFileSync(join(taken, "flume/base/workflow.md"), "# Flume workflow\n");
    const r = flume(taken, "init", "--workflow", "none");
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("workflow.md");
    expect(read(taken, "base/workflow.md")).toBe("# Flume workflow\n");
    for (const repo of [bogus, taken]) {
      expect(existsSync(join(repo, ".flume"))).toBe(false);
      expect(existsSync(join(repo, "flume.yaml"))).toBe(false);
    }
  });
});
