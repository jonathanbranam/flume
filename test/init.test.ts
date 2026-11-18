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
  const d = realpathSync(mkdtempSync(join(tmpdir(), "flume-init-")));
  dirs.push(d);
  return d;
}
/** A workspace folder (not a repo) holding a task repo named tasks. */
function workspace(): { ws: string; tasks: string } {
  const ws = folder();
  const tasks = join(ws, "tasks");
  mkdirSync(tasks);
  git(tasks, "init", "-q", "-b", "main");
  writeFileSync(join(tasks, "r"), "x");
  git(tasks, "add", "-A");
  git(tasks, "commit", "-qm", "first");
  return { ws, tasks };
}
const count = (repo: string) => git(repo, "rev-list", "--count", "HEAD");

describe("flume init", () => {
  it("s-1d03 init sets up the workspace and commits flume.yaml", () => {
    const { ws, tasks } = workspace();
    const r = flume(ws, "init", "--root", "tasks");
    expect(r.status).toBe(0);
    expect(readFileSync(join(ws, ".flume/.gitignore"), "utf8")).toBe("*\n");
    expect(readFileSync(join(ws, ".flume/config.yaml"), "utf8")).toContain("root: tasks");
    expect(existsSync(join(ws, ".flume/workflow"))).toBe(false);
    expect(readFileSync(join(tasks, "flume.yaml"), "utf8")).toBe("dir: flume\n");
    expect(existsSync(join(tasks, "workflow"))).toBe(false);
    expect(count(tasks)).toBe("2");
    expect(git(tasks, "status", "--porcelain")).toBe("");
    expect(existsSync(join(ws, ".git"))).toBe(false);
  });

  it("s-88ec init has no --force", () => {
    const repo = folder();
    git(repo, "init", "-q", "-b", "main");
    const r = flume(repo, "init", "--force");
    expect(r.status).toBe(2);
    expect(existsSync(join(repo, ".flume"))).toBe(false);
  });

  it("s-1d06 init in a repository uses it as the task root", () => {
    const repo = folder();
    git(repo, "init", "-q", "-b", "main");
    writeFileSync(join(repo, "r"), "x");
    git(repo, "add", "-A");
    git(repo, "commit", "-qm", "first");
    expect(flume(repo, "init").status).toBe(0);
    expect(readFileSync(join(repo, "flume.yaml"), "utf8")).toBe("dir: flume\n");
    expect(existsSync(join(repo, "workflow"))).toBe(false);
    expect(git(repo, "status", "--porcelain")).toBe("");
  });

  it("s-91f1 init with another folder name", () => {
    const repo = folder();
    git(repo, "init", "-q", "-b", "main");
    writeFileSync(join(repo, "r"), "x");
    git(repo, "add", "-A");
    git(repo, "commit", "-qm", "first");
    expect(flume(repo, "init", "--dir", "a/b").status).toBe(2);
    expect(existsSync(join(repo, ".flume"))).toBe(false);
    expect(flume(repo, "init", "--dir", ".").status).toBe(0);
    expect(readFileSync(join(repo, "flume.yaml"), "utf8")).toBe("dir: .\n");
  });

  it("s-1d07 init with no task root fails", () => {
    const ws = folder();
    const r = flume(ws, "init");
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("no task root");
    expect(existsSync(join(ws, ".flume"))).toBe(false);
  });
});
