import { execFileSync, spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
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
  const d = realpathSync(mkdtempSync(join(tmpdir(), "flume-ins-")));
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
const show = (repo: string, id: string) =>
  JSON.parse(flume(repo, ["task", "show", id, "--json"]).stdout);
const yaml = (repo: string, id: string): string =>
  readFileSync(join(repo, show(repo, id).path, "task.yaml"), "utf8");
const history = (repo: string, id: string) =>
  JSON.parse(flume(repo, ["task", "history", id, "--json"]).stdout) as Record<string, string>[];
const push = (repo: string, id: string, name: string, phase: string, ...more: string[]) =>
  flume(repo, ["task", "guide", id, name, "--phase", phase, ...more]);

describe("pushing guides", () => {
  it("s-4a02 push and remove guides", async () => {
    const repo = await project();
    guide(repo, "testing");
    guide(repo, "db-schema");
    const id = mk(repo);
    expect(push(repo, id, "testing", "implement").status).toBe(0);
    expect(push(repo, id, "db-schema", "design").status).toBe(0);
    expect(push(repo, id, "db-schema", "design").status).toBe(0);
    expect(yaml(repo, id)).toMatch(
      /guides:\n {2}design:\n {4}- db-schema\n {2}implement:\n {4}- testing\n/,
    );
    expect(show(repo, id).guides).toEqual({ design: ["db-schema"], implement: ["testing"] });
    expect(flume(repo, ["task", "show", id]).stdout).toContain("- db-schema");
    expect(push(repo, id, "db-schema", "design", "--remove").status).toBe(0);
    expect(push(repo, id, "testing", "implement", "--remove").status).toBe(0);
    expect(yaml(repo, id)).not.toContain("guides");
    expect(flume(repo, ["task", "guide", id, "testing"]).status).toBe(2);
    flume(repo, ["stop"]);
  }, 30_000);

  // 30 s: many process spawns, flaky at 5 s under parallel load (worse with the help walk).
  it("s-4a03 refused pushes change nothing", async () => {
    const repo = await project();
    guide(repo, "testing");
    const id = mk(repo);
    flume(repo, ["task", "phase", id, "plan"]);
    expect(push(repo, id, "testing", "implement").status).toBe(0);
    const before = yaml(repo, id);
    expect(push(repo, id, "nope", "implement").status).toBe(1);
    const early = push(repo, id, "testing", "design");
    expect(early.status).toBe(1);
    expect(early.stderr).toContain(`flume task phase ${id} design`);
    expect(push(repo, id, "testing", "design", "--remove").status).toBe(1);
    expect(push(repo, id, "testing", "plan", "--remove").status).toBe(1);
    expect(yaml(repo, id)).toBe(before);
    expect(push(repo, id, "testing", "plan").status).toBe(0);
    flume(repo, ["task", "phase", id, "specs"]);
    expect(push(repo, id, "testing", "specs").status).toBe(0);
    expect(show(repo, id).guides).toEqual({
      specs: ["testing"],
      plan: ["testing"],
      implement: ["testing"],
    });
    flume(repo, ["stop"]);
  }, 30_000);

  it("s-4a05 history and endpoint", async () => {
    const repo = await project();
    guide(repo, "testing");
    const id = mk(repo);
    const url = JSON.parse(flume(repo, ["status", "--json"]).stdout).address as string;
    const post = async (b: object) =>
      (
        await fetch(`${url}/api/tasks/${id}/guides`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(b),
        })
      ).status;
    expect(await post({ guide: "testing", phase: "design" })).toBe(200);
    expect(await post({ guide: "testing", phase: "design" })).toBe(200);
    expect(await post({ guide: "testing", phase: "design", remove: true })).toBe(200);
    expect(await post({ guide: "nope", phase: "design" })).toBe(400);
    const h = history(repo, id);
    expect(h.map((x) => x.action)).toEqual(["create", "guide_push", "guide_remove"]);
    expect(h[1]).toMatchObject({ guide: "testing", phase: "design" });
    flume(repo, ["stop"]);
  });
});

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
  });
});

const inst = (repo: string, id: string, ...more: string[]) =>
  flume(repo, ["task", "instructions", id, ...more]);

describe("instructions", () => {
  it("s-4c02 instructions for a phase", async () => {
    const repo = await project();
    guide(repo, "db-schema", "DB BODY", "design");
    guide(repo, "testing");
    const id = mk(repo);
    flume(repo, ["task", "phase", id, "design"]);
    push(repo, id, "db-schema", "design");
    push(repo, id, "testing", "implement");
    const r = inst(repo, id);
    expect(r.status).toBe(0);
    expect(r.stdout.split("\n")[0]).toBe(`<flume_instructions task="${id}" phase="design">`);
    expect(r.stdout).toContain('<steps phase="design">');
    expect(r.stdout).toContain(`flume task write ${id} design`);
    expect(r.stdout).toContain('<template part="design">');
    expect(r.stdout).toContain(
      '<guide name="db-schema" stage="design">\n# db-schema\n\nDB BODY\n</guide>',
    );
    expect(r.stdout).not.toContain('<guide name="testing"');
    flume(repo, ["task", "phase", id, "implement"]);
    const i = inst(repo, id).stdout;
    expect(i).toContain('<steps phase="implement">');
    expect(i).not.toContain("<template");
    expect(i).toContain('<guide name="testing">\n# testing\n\nTESTING TEXT\n</guide>');
    flume(repo, ["stop"]);
  });

  it("s-4c03 a pushed guide has disappeared", async () => {
    const repo = await project();
    guide(repo, "db-schema");
    const id = mk(repo);
    push(repo, id, "db-schema", "proposal");
    rmSync(join(repo, "flume/base/guides/db-schema.md"));
    const r = inst(repo, id);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('<guide_missing name="db-schema">');
    expect(r.stdout).not.toContain("<guide name=");
    expect(inst(repo, id, "--json").status).toBe(2);
    expect(inst(repo, "zzzz").status).toBe(1);
    flume(repo, ["stop"]);
  });

  it("s-4c04 the instructions endpoint", async () => {
    const repo = await project();
    const id = mk(repo);
    flume(repo, ["task", "phase", id, "specs"]);
    const url = JSON.parse(flume(repo, ["status", "--json"]).stdout).address as string;
    const ok = await fetch(`${url}/api/tasks/${id}/instructions`, { method: "POST" });
    expect(ok.status).toBe(200);
    const b = (await ok.json()) as { phase: string; text: string };
    expect(b.phase).toBe("specs");
    expect(b.text).toContain("<flume_instructions");
    expect((await fetch(`${url}/api/tasks/zzzz/instructions`, { method: "POST" })).status).toBe(
      404,
    );
    flume(repo, ["stop"]);
  });

  it("s-4c06 next adds the group and implement guides", async () => {
    const repo = await project();
    for (const g of ["api-conventions", "testing", "style"]) guide(repo, g);
    const id = mk(repo);
    writePlan(
      repo,
      id,
      "## 1. First\n\nGuide: api-conventions\nGuide: testing\n\n- [ ] 1.1 a\n\n## 2. Second\n\n- [ ] 2.1 b\n",
    );
    push(repo, id, "testing", "implement");
    push(repo, id, "style", "implement");
    const n1 = flume(repo, ["task", "next", id]).stdout;
    expect(n1).toMatch(/^## 1\. First\n/);
    expect([...n1.matchAll(/<guide name="([^"]+)"/g)].map((m) => m[1])).toEqual([
      "api-conventions",
      "testing",
      "style",
    ]);
    flume(repo, ["task", "done", id, "1.1"]);
    const n2 = flume(repo, ["task", "next", id]).stdout;
    expect(n2).toMatch(/^## 2\. Second\n/);
    expect([...n2.matchAll(/<guide name="([^"]+)"/g)].map((m) => m[1])).toEqual([
      "testing",
      "style",
    ]);
    const j = JSON.parse(flume(repo, ["task", "next", id, "--json"]).stdout);
    expect(j.guides).toEqual([
      { name: "testing", body: "# testing\n\nTESTING TEXT\n" },
      { name: "style", body: "# style\n\nSTYLE TEXT\n" },
    ]);
    flume(repo, ["stop"]);
  });
});

const as = (name: string): NodeJS.ProcessEnv => ({ AGENT_NAME: name });
const phaseOf = (repo: string, id: string) => show(repo, id).phase as string;

describe("reading instructions first", () => {
  it("s-4d02 claim prints the instructions", async () => {
    const repo = await project();
    const id = mk(repo);
    for (let i = 0; i < 2; i++) {
      const r = flume(repo, ["task", "claim", id], undefined, as("scout"));
      expect(r.status).toBe(0);
      expect(r.stdout).toContain(`<flume_instructions task="${id}" phase="proposal">`);
    }
    expect(flume(repo, ["task", "assign", id, "human"], undefined, as("scout")).stdout).toBe("");
    expect(flume(repo, ["task", "assign", id, "scout"]).stdout).toBe("");
    const j = flume(repo, ["task", "claim", id, "--json"], undefined, as("scout"));
    expect(JSON.parse(j.stdout).id).toBe(id);
    const h = history(repo, id).filter((x) => x.action === "instructions");
    expect(h.map((x) => [x.by, x.phase])).toEqual([
      ["scout", "proposal"],
      ["scout", "proposal"],
    ]);
    flume(repo, ["stop"]);
  });

  it("s-4d03 phase ends with the pointer", async () => {
    const repo = await project();
    const id = mk(repo);
    expect(flume(repo, ["task", "phase", id, "design"]).stdout).toBe(
      `next: flume task instructions ${id}\n`,
    );
    const j = flume(repo, ["task", "phase", id, "specs", "--json"]).stdout;
    expect(JSON.parse(j).phase).toBe("specs");
    expect(j).not.toContain("next:");
    flume(repo, ["stop"]);
  });

  it("s-4d05 forward needs the instructions, backward and the human do not", async () => {
    const repo = await project();
    const id = mk(repo);
    const scout = as("scout");
    const go = (phase: string, who?: NodeJS.ProcessEnv) =>
      flume(repo, ["task", "phase", id, phase], undefined, who);
    const lines = () => history(repo, id).length;
    const n = lines();
    const first = go("design", scout);
    expect(first.status).toBe(1);
    expect(first.stderr).toContain(`flume task instructions ${id}`);
    expect([phaseOf(repo, id), lines()]).toEqual(["proposal", n]);
    flume(repo, ["task", "instructions", id], undefined, scout);
    expect(go("design", scout).status).toBe(0);
    flume(repo, ["task", "instructions", id], undefined, as("rook"));
    expect(go("specs", scout).status).toBe(1);
    expect(phaseOf(repo, id)).toBe("design");
    flume(repo, ["task", "instructions", id], undefined, scout);
    expect(go("specs", scout).status).toBe(0);
    expect(go("design", scout).status).toBe(0);
    flume(repo, ["task", "instructions", id], undefined, scout);
    expect(go("specs").status).toBe(0);
    expect(go("design").status).toBe(0);
    expect(go("plan", scout).status).toBe(1);
    expect(go("implement").status).toBe(0);
    flume(repo, ["stop"]);
  });
});
