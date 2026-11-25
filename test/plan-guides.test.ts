import { execFileSync, spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
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

const flume = (cwd: string, args: string[], input?: string, extra: NodeJS.ProcessEnv = {}) =>
  spawnSync("node", [bin, ...args], { cwd, encoding: "utf8", env: { ...env, ...extra }, input });

/** A repo with a real `flume serve` process (stopped by pid in afterAll). */
async function project(): Promise<string> {
  const d = realpathSync(mkdtempSync(join(tmpdir(), "flume-pg-")));
  dirs.push(d);
  const git = (...a: string[]) => execFileSync("git", a, { cwd: d, env });
  git("init", "-q", "-b", "main");
  writeFileSync(join(d, "README.md"), "x\n");
  git("add", "-A");
  git("commit", "-qm", "init");
  spawnSync("node", [bin, "init"], { cwd: d, env });
  const child = spawn("node", [bin, "serve"], { cwd: d, env });
  if (child.pid) pids.push(child.pid);
  await new Promise<void>((res, rej) => {
    child.stdout.once("data", () => res());
    child.once("exit", () => rej(new Error("serve exited")));
  });
  return d;
}

const put = (repo: string, rel: string, text: string) => {
  const f = join(repo, "flume", rel);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, text);
};
const guide = (repo: string, name: string, body = `${name.toUpperCase()} TEXT`, stage = "") =>
  put(
    repo,
    `base/guides/${name}.md`,
    `---\nname: ${name}\ndescription: About ${name}\n${stage ? `stage: ${stage}\n` : ""}---\n# ${name}\n\n${body}\n`,
  );

function mk(repo: string, title = "A task"): string {
  const r = flume(repo, ["task", "new", title]);
  expect(r.status).toBe(0);
  return r.stdout.trim();
}

const PLAN = (guides: string) =>
  `## 1. Add the login API\n\n${guides}\n- [ ] 1.1 add the route\n- [ ] 1.2 unit tests\n\n## 2. Docs\n\n- [ ] 2.1 write docs\n`;
const writePlan = (repo: string, id: string, text: string) =>
  flume(repo, ["task", "write", id, "plan"], text);
const plan = (repo: string, id: string) => flume(repo, ["task", "show", id, "plan"]).stdout;

describe("plan groups name guides", () => {
  it("s-4b02 guide lines are checked and kept", async () => {
    const repo = await project();
    guide(repo, "testing");
    guide(repo, "api-conventions");
    const id = mk(repo);
    const good = PLAN("Guide: api-conventions\nGuide: testing\n");
    expect(writePlan(repo, id, good).status).toBe(0);
    expect(plan(repo, id)).toContain(
      "## 1. Add the login API\n\nGuide: api-conventions\nGuide: testing\n\n- [ ] 1.1",
    );
    expect(flume(repo, ["task", "done", id, "1.1"]).status).toBe(0);
    expect(plan(repo, id)).toContain("Guide: api-conventions\nGuide: testing\n\n- [x] 1.1");
    const before = plan(repo, id);
    const nope = writePlan(repo, id, PLAN("Guide: nope\n"));
    expect(nope.status).toBe(1);
    expect(nope.stderr).toContain("nope");
    const late = writePlan(repo, id, "## 1. G\n\n- [ ] 1.1 a\nGuide: testing\n");
    expect(late.status).toBe(1);
    expect(plan(repo, id)).toBe(before);
    flume(repo, ["stop"]);
  }, 30_000);

  it("s-0b7c the group's guides follow it", async () => {
    const repo = await project();
    guide(repo, "api-conventions", "API BODY", "build");
    guide(repo, "testing");
    const id = mk(repo);
    writePlan(
      repo,
      id,
      "## 1. First\n\nGuide: api-conventions\nGuide: testing\n\n- [ ] 1.1 a\n\n## 2. Second\n\n- [ ] 2.1 b\n",
    );
    const next = () => flume(repo, ["task", "next", id]);
    const names = (out: string) => [...out.matchAll(/<guide name="([^"]+)"/g)].map((m) => m[1]);
    const n1 = next().stdout;
    expect(n1).toMatch(/^## 1\. First\n/);
    expect(names(n1)).toEqual(["api-conventions", "testing"]);
    expect(n1).toContain('<guide name="api-conventions" stage="build">\n');
    const j = JSON.parse(flume(repo, ["task", "next", id, "--json"]).stdout);
    expect(j.guides).toEqual([
      { name: "api-conventions", stage: "build", body: "# api-conventions\n\nAPI BODY\n" },
      { name: "testing", body: "# testing\n\nTESTING TEXT\n" },
    ]);
    rmSync(join(repo, "flume/base/guides/testing.md"));
    const gone = next();
    expect(gone.status).toBe(0);
    expect(gone.stdout).toContain('<guide_missing name="testing">');
    flume(repo, ["task", "done", id, "1.1"]);
    const n2 = next().stdout;
    expect(n2).toMatch(/^## 2\. Second\n/);
    expect(n2).not.toContain("<guide");
    flume(repo, ["stop"]);
  }, 30_000);
});
