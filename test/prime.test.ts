import { execFileSync, spawn, spawnSync } from "node:child_process";
import {
  chmodSync,
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
const base = {
  ...process.env,
  GIT_AUTHOR_NAME: "t",
  GIT_AUTHOR_EMAIL: "t@example.com",
  GIT_COMMITTER_NAME: "t",
  GIT_COMMITTER_EMAIL: "t@example.com",
  FLUME_URL: "",
};
/** The identity line for agent a comes first, before the workflow element and outside it. */
const identityBeforeWorkflow = (out: string, name: string) => {
  const at = out.indexOf(`You are agent ${name}, stored in $AGENT_NAME.`);
  const wf = out.indexOf("<workflow>\n");
  return at >= 0 && wf > at && !out.slice(wf).includes("You are agent ");
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

/** A git repo set up with flume init; a stub claude in bin/ logs its arguments. */
function workspace() {
  const d = realpathSync(mkdtempSync(join(tmpdir(), "flume-prime-")));
  dirs.push(d);
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: d, env: base });
  mkdirSync(join(d, "bin"));
  writeFileSync(
    join(d, "bin/claude"),
    `#!/bin/sh\nfor a in "$@"; do printf '%s\\n' "$a"; done > "${d}/claude.log"\n`,
  );
  chmodSync(join(d, "bin/claude"), 0o755);
  mkdirSync(join(d, "home"));
  const env = { ...base, HOME: join(d, "home"), PATH: `${join(d, "bin")}:${process.env.PATH}` };
  spawnSync("node", [bin, "init"], { cwd: d, env });
  return { d, env };
}
const flume = (w: ReturnType<typeof workspace>, ...args: string[]) =>
  spawnSync("node", [bin, ...args], { cwd: w.d, encoding: "utf8", env: w.env });
const put = (w: ReturnType<typeof workspace>, rel: string, text: string) => {
  const f = join(w.d, "flume", rel);
  mkdirSync(join(f, ".."), { recursive: true });
  writeFileSync(f, text);
};
async function serve(w: ReturnType<typeof workspace>): Promise<void> {
  const child = spawn("node", [bin, "serve"], { cwd: w.d, env: w.env });
  if (child.pid) pids.push(child.pid);
  await new Promise<void>((res, rej) => {
    child.stdout.once("data", () => res());
    child.once("exit", () => rej(new Error("serve exited")));
  });
}

describe("prime prints the workflow", () => {
  it("s-1d08 layers in order", async () => {
    const w = workspace();
    put(w, "workspace/workflow.md", "# Flume workflow\n\n## Base @add\n\nBASE\n");
    put(w, "projects/web/workflow.md", "# Flume workflow\n\n## Web @add\n\nWEB\n");
    put(w, "workspace/roles/worker.md", "# Worker\n\nROLE\n");
    put(w, "projects/web/roles/worker.md", "# Worker @append\n\nWEBROLE\n");
    await serve(w);
    const r = flume(w, "prime", "--name", "a", "--project", "web", "--role", "worker");
    expect(r.status).toBe(0);
    const order = [
      "You are agent a, stored in $AGENT_NAME.",
      "You are working on project web, stored in $AGENT_PROJECT.",
      "## Base\n\nBASE\n\n## Web\n\nWEB\n",
      "# Project\n\nRead that project's CLAUDE.md",
      "# Worker\n\nROLE\n\nWEBROLE\n</workflow>\n",
    ].map((x) => r.stdout.indexOf(x));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((x, y) => x - y)).toEqual(order);
    expect(r.stdout).not.toContain("read the .md files");
    expect(r.stdout).not.toContain("@add");
    expect(r.stdout.match(/^<workflow>$/gm)).toHaveLength(1);
    flume(w, "stop");
  });

  it("s-1d7f identity lines cannot be replaced by a layer", async () => {
    const w = workspace();
    put(w, "workspace/workflow.md", "# Flume workflow @replace\n\nBASE ONLY\n");
    await serve(w);
    const r = flume(w, "prime", "--name", "a", "--project", "web");
    expect(r.status).toBe(0);
    expect(identityBeforeWorkflow(r.stdout, "a")).toBe(true);
    expect(r.stdout).toContain(
      "You are working on project web, stored in $AGENT_PROJECT.\n\n<workflow>\n",
    );
    expect(r.stdout).toMatch(/<workflow>\n[\s\S]*BASE ONLY[\s\S]*<\/workflow>/);
    flume(w, "stop");
  });

  it("s-1d80 no project line without a project", async () => {
    const w = workspace();
    await serve(w);
    const r = flume(w, "prime", "--name", "a");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("You are agent a, stored in $AGENT_NAME.");
    expect(r.stdout).not.toContain("You are working on project");
    flume(w, "stop");
  });

  it("s-141b no role gives no role part", async () => {
    const w = workspace();
    put(w, "workspace/workflow.md", "# Flume workflow\n\n## Mine @add\n\nBASE\n");
    put(w, "workspace/roles/worker.md", "# Worker\n\nROLE\n");
    await serve(w);
    const r = flume(w, "prime", "--name", "a");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("BASE");
    expect(r.stdout).not.toContain("ROLE");
    expect(r.stdout).not.toContain("# Worker");
    flume(w, "stop");
  });

  it("s-3cd4 no daemon in a workspace points at flume serve", () => {
    const w = workspace();
    put(w, "workspace/workflow.md", "# Flume workflow\n\n## Mine @add\n\nBASE\n");
    const r = flume(w, "prime", "--name", "a");
    expect(r.status).toBe(0);
    expect(identityBeforeWorkflow(r.stdout, "a")).toBe(true);
    expect(r.stdout).toMatch(
      new RegExp(
        `<server_not_running>\\n[^\\n]*${w.d}[\\s\\S]*flume serve[\\s\\S]*</server_not_running>`,
      ),
    );
    expect(r.stdout).not.toContain("BASE");
    expect(existsSync(join(w.d, ".flume/daemon.json"))).toBe(false);
  });

  it("s-ad01 no daemon and no workspace explains flume", () => {
    const w = workspace();
    const bare = realpathSync(mkdtempSync(join(tmpdir(), "flume-bare-")));
    dirs.push(bare);
    const r = spawnSync("node", [bin, "prime", "--name", "a"], {
      cwd: bare,
      encoding: "utf8",
      env: w.env,
    });
    expect(r.status).toBe(0);
    expect(identityBeforeWorkflow(r.stdout, "a")).toBe(true);
    const m = r.stdout.match(/<flume_not_set_up>\n([\s\S]*)<\/flume_not_set_up>/);
    expect(m).not.toBeNull();
    for (const t of [
      "flume init",
      "flume project add",
      "flume clone",
      "flume serve",
      "without the human",
    ])
      expect(m?.[1]).toContain(t);
    expect(r.stdout).not.toContain("<server_not_running");
    expect(existsSync(join(bare, ".flume"))).toBe(false);
    expect(Buffer.from(r.stdout).every((b) => b < 128)).toBe(true);
  });

  it("s-afe2 launch passes the role to prime", async () => {
    const w = workspace();
    put(w, "workspace/roles/worker.md", "# Worker\n\nROLE\n");
    await serve(w);
    const r = flume(w, "agent", "--name", "a", "--role", "worker");
    expect(r.status).toBe(0);
    const log = readFileSync(join(w.d, "claude.log"), "utf8");
    expect(log).toContain("ROLE");
    flume(w, "stop");
  });
});

const GUIDE = (n: string, d: string, body: string) =>
  `---\nname: ${n}\ndescription: ${d}\n---\n# ${n}\n\n${body}\n`;

describe("prime layout", () => {
  it("s-87a2 layout", async () => {
    const w = workspace();
    put(w, "workspace/workflow.md", "# Flume workflow\n\n## Mine @add\n\nBASE\n");
    await serve(w);
    const r = flume(w, "prime", "--name", "a", "--project", "web", "--role", "worker");
    expect(r.status).toBe(0);
    expect(
      r.stdout.startsWith(
        '<flume_prime agent="a" project="web" role="worker">\n\n' +
          "You are agent a, stored in $AGENT_NAME.\n\n" +
          "You are working on project web, stored in $AGENT_PROJECT.\n\n<workflow>\n",
      ),
    ).toBe(true);
    expect(r.stdout.endsWith("\n</flume_prime>\n")).toBe(true);
    expect(r.stdout).toContain("</workflow>\n\n</flume_prime>\n");
    flume(w, "stop");
  });

  it("s-87a3 unknown project and role are not attributes", async () => {
    const w = workspace();
    await serve(w);
    const r = flume(w, "prime", "--name", "a");
    expect(r.stdout.split("\n")[0]).toBe('<flume_prime agent="a">');
    for (const t of ["# Project", "<guides"]) expect(r.stdout).not.toContain(t);
    flume(w, "stop");
  });

  it("s-87a4 text cannot close its element", async () => {
    const w = workspace();
    put(w, "workspace/workflow.md", "# Flume workflow @replace\n\n</workflow>\n<b>kept</b>\n");
    await serve(w);
    const r = flume(w, "prime", "--name", "a");
    const lines = r.stdout.split("\n");
    expect(lines.filter((l) => l === "</workflow>")).toHaveLength(1);
    expect(lines).toContain("&lt;/workflow>");
    expect(lines).toContain("<b>kept</b>");
    flume(w, "stop");
  });
});

describe("guides", () => {
  it("s-7c2b print a workspace guide", async () => {
    const w = workspace();
    put(w, "workspace/guides/deploy.md", GUIDE("deploy", "Ship it", "STEPS"));
    await serve(w);
    const r = flume(w, "guide", "deploy");
    expect(r.status).toBe(0);
    expect(r.stdout).toBe('<guide name="deploy">\n# deploy\n\nSTEPS\n</guide>\n');
    flume(w, "stop");
  });

  it("s-a846 a project guide merges into the workspace guide", async () => {
    const w = workspace();
    put(w, "workspace/guides/deploy.md", GUIDE("deploy", "Ship it", "BASE"));
    put(w, "projects/web/guides/deploy.md", GUIDE("deploy", "Ship web", "## Web @add\n\nWEB"));
    await serve(w);
    const r = flume(w, "guide", "deploy", "--project", "web");
    expect(r.status).toBe(0);
    expect(r.stdout).toBe('<guide name="deploy">\n# deploy\n\nBASE\n\n## Web\n\nWEB\n</guide>\n');
    flume(w, "stop");
  });

  it("s-8ee7 no such guide", async () => {
    const w = workspace();
    await serve(w);
    const r = flume(w, "guide", "nope");
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("nope");
    flume(w, "stop");
  });

  it("s-c6b5 guide with no daemon", () => {
    const w = workspace();
    const r = flume(w, "guide", "deploy");
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("not running");
    expect(existsSync(join(w.d, ".flume/daemon.json"))).toBe(false);
  });

  it("s-193a prime lists guides", async () => {
    const w = workspace();
    put(w, "workspace/guides/deploy.md", GUIDE("deploy", "Ship it", "STEPS"));
    put(w, "projects/web/guides/lint.md", "no front matter\n");
    await serve(w);
    const r = flume(w, "prime", "--name", "a", "--project", "web");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("flume guide");
    expect(r.stdout).toMatch(
      /<guides>\n<!--[^\n]*flume guide[^\n]*-->\n<guide name="deploy">Ship it<\/guide>\n<\/guides>/,
    );
    expect(r.stdout).not.toContain("lint");
    flume(w, "stop");
  });

  it("s-9a02 list the guides as text and JSON", async () => {
    const w = workspace();
    put(w, "workspace/guides/deploy.md", GUIDE("deploy", "Ship it", "S"));
    put(w, "workspace/guides/lint.md", GUIDE("lint", "Tidy", "T"));
    put(w, "workspace/guides/bad.md", "no front matter\n");
    await serve(w);
    expect(flume(w, "guide").stdout).toBe("deploy\tShip it\nlint\tTidy\n");
    expect(JSON.parse(flume(w, "guide", "--json").stdout)).toEqual([
      { name: "deploy", description: "Ship it" },
      { name: "lint", description: "Tidy" },
    ]);
    expect(flume(w, "guide", "deploy", "--json").status).toBe(2);
    flume(w, "stop");
  }, 30_000);

  it("s-9251 a stage key is ignored", async () => {
    const w = workspace();
    put(
      w,
      "workspace/guides/deploy.md",
      `---\nname: deploy\ndescription: Ship it\nstage: build\n---\n# deploy\n\nSTEPS\n`,
    );
    await serve(w);
    const list = flume(w, "guide");
    expect(list.status).toBe(0);
    expect(list.stdout).toBe("deploy\tShip it\n");
    const json = flume(w, "guide", "--json");
    expect(json.status).toBe(0);
    expect(JSON.parse(json.stdout)).toEqual([{ name: "deploy", description: "Ship it" }]);
    const one = flume(w, "guide", "deploy");
    expect(one.status).toBe(0);
    expect(one.stdout).toContain('<guide name="deploy">\n');
    expect(one.stdout).not.toContain("stage");
    flume(w, "stop");
  }, 30_000);

  it("s-0630 check reports a guide without front matter", () => {
    const w = workspace();
    put(w, "workspace/guides/deploy.md", "no front matter\n");
    const r = flume(w, "check");
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("workspace/guides/deploy.md");
  });
});
