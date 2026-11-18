import { execFileSync, spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
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

const flume = (cwd: string, args: string[]) =>
  spawnSync("node", [bin, ...args], { cwd, encoding: "utf8", env });

const FIX = "fix-redirect-aaaa";
const SETUP = "setup-bbbb";
function task(id: string, title: string): string {
  return `---\nid: ${id.slice(-4)}\ntitle: ${title}\nkind: feature\ncreated: 2026-11-16\n${
    title === "Setup" ? "resolved: 2026-11-16T10:00:00Z\n" : ""
  }---\n\nbody\n`;
}

/** A git repo with two tasks (open Fix redirect, resolved Setup) and the given roadmap. */
function project(roadmap?: string): string {
  const d = realpathSync(mkdtempSync(join(tmpdir(), "flume-roadmap-")));
  dirs.push(d);
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: d, env });
  mkdirSync(join(d, "flume/tasks/open"), { recursive: true });
  mkdirSync(join(d, "flume/tasks/resolved"), { recursive: true });
  writeFileSync(join(d, `flume/tasks/open/${FIX}.md`), task(FIX, "Fix redirect"));
  writeFileSync(join(d, `flume/tasks/resolved/${SETUP}.md`), task(SETUP, "Setup"));
  if (roadmap !== undefined) writeFileSync(join(d, "flume/roadmap.md"), roadmap);
  return d;
}

async function serve(repo: string): Promise<string> {
  spawnSync("node", [bin, "init"], { cwd: repo, env });
  const child = spawn("node", [bin, "serve"], { cwd: repo, env });
  if (child.pid) pids.push(child.pid);
  return new Promise<string>((res, rej) => {
    child.stdout.once("data", (d) => res(String(d).match(/http:\/\/\S+/)?.[0] ?? ""));
    child.once("exit", () => rej(new Error("serve exited")));
  });
}
const get = async (url: string, path: string) => {
  const r = await fetch(url + path);
  return { status: r.status, body: await r.json() };
};

const BASIC = `# Roadmap\n\n## Now\n1. [[${FIX}|Fix it]]\n2. [[${SETUP}]] - shipped already\n\n## Later\n- [[nope-zzzz]]\n`;

describe("roadmap", () => {
  it("s-d6a3 entries in order", async () => {
    const repo = project(BASIC);
    const url = await serve(repo);
    const r = await get(url, "/api/roadmap");
    expect(r.status).toBe(200);
    const s = r.body.sections;
    expect(s.map((x: { heading: string }) => x.heading)).toEqual(["Roadmap", "Now", "Later"]);
    expect(s[1].entries.map((e: { link: string }) => e.link)).toEqual([FIX, SETUP]);
    flume(repo, ["stop"]);
  });

  it("s-b25e entries carry task state", async () => {
    const repo = project(BASIC);
    const url = await serve(repo);
    const s = (await get(url, "/api/roadmap")).body.sections;
    expect(s[1].entries[0]).toMatchObject({
      state: "open",
      id: "aaaa",
      title: "Fix redirect",
      label: "Fix it",
    });
    expect(s[1].entries[1]).toMatchObject({
      state: "resolved",
      id: "bbbb",
      note: "- shipped already",
    });
    expect(s[2].entries[0].state).toBeNull();
    flume(repo, ["stop"]);
  });

  it("s-5c0d no roadmap file", async () => {
    const repo = project();
    const url = await serve(repo);
    const r = await get(url, "/api/roadmap");
    expect(r.status).toBe(404);
    expect(typeof r.body.error).toBe("string");
    flume(repo, ["stop"]);
  });

  it("s-a870 show without a roadmap", async () => {
    const repo = project();
    await serve(repo);
    const s = flume(repo, ["roadmap", "show"]);
    expect(s.status).toBe(1);
    expect(s.stderr).toContain("roadmap");
    flume(repo, ["stop"]);
  });

  it("s-7e41 show", async () => {
    const repo = project(`## Now\n- [[${FIX}]]\n- [[${SETUP}]] done early\n`);
    await serve(repo);
    const r = flume(repo, ["roadmap", "show"]);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Now\n");
    expect(r.stdout).toContain("aaaa\topen\tFix redirect");
    expect(r.stdout).toContain("bbbb\tresolved\tSetup");
    flume(repo, ["stop"]);
  });

  it("s-0f93 show as JSON", async () => {
    const repo = project(`## Now\n- [[${FIX}]]\n`);
    await serve(repo);
    const j = flume(repo, ["roadmap", "show", "--json"]);
    expect(JSON.parse(j.stdout).sections[0].entries[0].state).toBe("open");
    flume(repo, ["stop"]);
  });

  it("s-c4b8 show without a daemon", () => {
    const r = flume(project(BASIC), ["roadmap", "show"]);
    expect(r.status).toBe(1);
    expect(r.stderr).toBe(
      "flume: the flume daemon is not running for this workspace.\nAsk the human to start it: flume serve (in its own pane).\n",
    );
  });

  it("s-3d2c clean roadmap", () => {
    const repo = project(`## Now\n- [[${FIX}]]\n\n## Done\n- [[${SETUP}]] (2026-11-16)\n`);
    const r = flume(repo, ["roadmap", "check"]);
    expect(r.stdout).toBe("");
    expect(r.status).toBe(0);
  });

  it("s-e19a link to no task", () => {
    const r = flume(project("## Now\n- [[no-such-task-zzzz]]\n"), ["roadmap", "check"]);
    expect(r.status).toBe(1);
    expect(r.stdout.trim().split("\n")).toHaveLength(1);
    expect(r.stdout).toContain("flume/roadmap.md");
    expect(r.stdout).toContain("line 2");
    expect(r.stdout).toContain("no-such-task-zzzz");
  });

  it("s-4b70 resolved task listed as upcoming", () => {
    const r = flume(project(`## Now\n- [[${SETUP}]]\n`), ["roadmap", "check"]);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("line 2");
    expect(r.stdout).toContain("resolved");
  });

  it("s-8d56 resolved task with a note", () => {
    const r = flume(project(`## Now\n- [[${SETUP}]] reopen planned\n`), ["roadmap", "check"]);
    expect(r.stdout).toBe("");
    expect(r.status).toBe(0);
  });

  it("s-6c1e check as JSON", () => {
    const r = flume(project("## Now\n- [[no-such-task-zzzz]]\n"), ["roadmap", "check", "--json"]);
    expect(r.status).toBe(1);
    const problems = JSON.parse(r.stdout) as { path: string; message: string }[];
    expect(problems).toHaveLength(1);
    expect(problems[0]?.path).toBe("flume/roadmap.md");
    expect(problems[0]?.message).toContain("no-such-task-zzzz");
  });

  it("s-f2e5 check without a roadmap", () => {
    const r = flume(project(), ["roadmap", "check"]);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("roadmap");
  });

  it("s-6a39 flume check reports a roadmap problem", () => {
    const r = flume(project("## Now\n- [[no-such-task-zzzz]]\n"), ["check"]);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("flume/roadmap.md");
  });

  it("s-b0c7 flume check without a roadmap file", () => {
    const r = flume(project(), ["check"]);
    expect(r.stdout).toBe("");
    expect(r.status).toBe(0);
  });
});
