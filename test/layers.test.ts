import { execFileSync, spawn, spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { SHIPPED_DIR } from "../src/core/documents.ts";
import { formatLayerError, mergeLayers, renderSection } from "../src/core/layers.ts";

const LOW = `# Doc

Intro.

## One

First.

### Deep

Deeper.

## Two

Second.
`;

/** Merge upper over LOW; the text, or the errors as "line N: ..." lines. */
function merge(upper: string, low = LOW) {
  const r = mergeLayers([
    { file: "low.md", text: low },
    { file: "up.md", text: upper },
  ]);
  return {
    text: r.doc ? renderSection(r.doc) : "",
    errors: r.errors.map((e) => `${e.file}: ${formatLayerError(e)}`),
    doc: r.doc,
  };
}
const ok = (upper: string) => {
  const r = merge(upper);
  expect(r.errors).toEqual([]);
  return r.text;
};
/** The one error of merging `upper`, which must name up.md, the line and the heading. */
function bad(upper: string, line: number, heading: string, message: RegExp) {
  const r = merge(upper);
  expect(r.errors).toHaveLength(1);
  expect(r.errors[0]).toContain(`up.md: line ${line}: `);
  if (heading) expect(r.errors[0]).toContain(`heading "${heading}"`);
  expect(r.errors[0]).toMatch(message);
}

describe("merging by heading", () => {
  it("s-c78c no tag replaces own text; unmentioned sub-sections stay", () => {
    expect(ok("# DOC\n\n##  one \n\nNew.\n")).toBe(
      "# DOC\n\nIntro.\n\n## one\n\nNew.\n\n### Deep\n\nDeeper.\n\n## Two\n\nSecond.\n",
    );
  });

  it("s-3680 a heading with only sub-headings is a path", () => {
    expect(ok("# Doc\n\n## One\n\n### Deep\n\nNew deep.\n")).toBe(
      LOW.replace("Deeper.", "New deep."),
    );
  });

  it("s-f12e add, append, remove and replace", () => {
    expect(ok("# Doc\n\n## Three @add\n\nThird.\n\n### Sub\n\nS.\n")).toBe(
      `${LOW}\n## Three\n\nThird.\n\n### Sub\n\nS.\n`,
    );
    expect(ok("# Doc\n\n## Two @append\n\nMore.\n")).toBe(
      LOW.replace("Second.", "Second.\n\nMore."),
    );
    expect(ok("# Doc @append\n\nMore intro.\n")).toContain("Intro.\n\nMore intro.\n\n## One");
    expect(ok("# Doc\n\n## One @remove\n")).toBe("# Doc\n\nIntro.\n\n## Two\n\nSecond.\n");
    expect(ok("# Doc\n\n## One @replace\n\nOnly.\n")).toBe(
      "# Doc\n\nIntro.\n\n## One\n\nOnly.\n\n## Two\n\nSecond.\n",
    );
  });

  it("s-f3d7 replace on the H1 stands alone and lower layers are not read", () => {
    const r = merge("# Mine @replace\n\nAll.\n", "not even a document\n");
    expect(r.errors).toEqual([]);
    expect(r.text).toBe("# Mine\n\nAll.\n");
    expect(r.doc?.sources).toEqual(["up.md"]);
  });

  it("sources name the file each section's text came from", () => {
    const d = merge("# Doc\n\n## One\n\nNew.\n\n## Two @append\n\nMore.\n").doc;
    expect(d?.sources).toEqual(["low.md"]);
    expect(d?.children.map((c) => c.sources)).toEqual([["up.md"], ["low.md", "up.md"]]);
  });

  it("headings in fences and comments are text", () => {
    const upper = "# Doc\n\n## One\n\n````md\n```\n## Nope\n```\n````\n\n<!--\n## Hidden\n-->\n";
    expect(ok(upper)).toContain("## Nope\n```\n````\n\n<!--\n## Hidden\n-->\n");
  });

  it("s-b591 what cannot be placed is an error naming file, line and heading", () => {
    bad("# Doc\n\n## Nope\n\nx\n", 3, "## Nope", /matches no heading.*@add/);
    bad("# Doc\n\n## One\n", 3, "## One", /@remove/);
    bad("# Doc\n\n## One @add\n\nx\n", 3, "## One @add", /already/);
    bad("# Doc\n\n## Nope @append\n\nx\n", 3, "## Nope @append", /matches no heading/);
    bad("# Doc\n\n## Nope @remove\n", 3, "## Nope @remove", /matches no heading/);
    bad("# Doc\n\n## Nope @replace\n\nx\n", 3, "## Nope @replace", /matches no heading/);
    bad("# Doc\n\n## One @remove\n\nx\n", 3, "## One @remove", /takes no text/);
    bad("# Doc\n\n## One @remove\n\n### Deep\n", 3, "## One @remove", /no sub-headings/);
    bad("# Doc\n\n## One @append\n", 3, "## One @append", /nothing under/);
    bad("# Doc\n\n## One @replace\n", 3, "## One @replace", /nothing under/);
    bad("# Doc\n\n## One @prepend\n\nx\n", 3, "## One @prepend", /unknown tag @prepend/);
    bad("# Doc\n\n## N @add\n\n### X @append\n\nx\n", 5, "### X @append", /nothing to act on/);
    bad("# Other\n\nx\n", 1, "# Other", /H1 differs/);
    bad("# Doc @remove\n", 1, "# Doc @remove", /not allowed on the H1/);
    bad("# Doc\n\nx\n\n#### Far\n\ny\n", 5, "#### Far", /skips a level/);
    bad("# Doc\n\n## Two\n\na\n\n## two\n\nb\n", 7, "## two", /twice/);
    bad("# Doc\n\nx\n\n# Again\n", 5, "# Again", /second H1/);
    bad("# Doc\n\nx\n\nTwo\n---\n", 6, "Two", /underlined/);
  });

  it("s-b591 a file with no H1 is an error", () => {
    expect(merge("just text\n").errors).toEqual([
      expect.stringContaining("up.md: line 1: text before the H1"),
      expect.stringContaining("up.md: line 1: no H1"),
    ]);
  });

  it("s-b418 each H1 error gives the rule, the problem and both fixes", () => {
    const rule =
      'every layer file has exactly one H1, the same as the H1 of the layer below ("# Doc")';
    const fixOne =
      'start the file with "# Doc" and put your sections under it as ## headings, tagged @add, @append or @remove as needed';
    const fixTwo = 'put @replace on the H1 ("# Doc @replace")';
    const one = (upper: string, problem: RegExp) => {
      const r = merge(upper);
      expect(r.errors).toHaveLength(1);
      expect(r.errors[0]).toMatch(problem);
      expect(r.errors[0]).toContain(rule);
      expect(r.errors[0]).toContain(fixOne);
      expect(r.errors[0]).toContain(fixTwo);
    };
    one("", /up\.md: line 1: no H1\. The rule/);
    one("just text\n# Doc\n\nx\n", /line 1: text before the H1\./);
    one("## Pre\n\n# Doc\n\nx\n", /line 1: heading "## Pre": a heading before the H1\./);
    one("# Doc\n\nx\n\n# Again\n", /second H1\./);
    one("# Other\n\nx\n", /the H1 differs from the H1 below, so it would add another H1\./);
    one("# Doc @add\n", /@add is not allowed on the H1\./);
  });

  it("s-b418 an H1 error in the first layer names no layer below", () => {
    const r = mergeLayers([{ file: "only.md", text: "x\n" }]);
    expect(r.errors.map(formatLayerError)).toEqual([
      expect.stringContaining("text before the H1. The rule: every layer file has exactly one H1"),
      expect.stringContaining("no H1. The rule: every layer file has exactly one H1"),
    ]);
    for (const e of r.errors) {
      expect(e.message).toContain('start the file with its one H1 ("# Title")');
      expect(e.message).not.toContain("layer below");
    }
  });

  it("s-b591 a document with no layer below takes no tags", () => {
    const r = mergeLayers([{ file: "only.md", text: "# R\n\n## A @append\n\nx\n" }]);
    expect(r.errors.map(formatLayerError)).toEqual([
      expect.stringContaining('line 3: heading "## A @append"'),
    ]);
  });
});

// --- through the commands ---

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

/** A running workspace with a stub claude that logs its arguments. */
async function workspace(files: Record<string, string>) {
  const d = realpathSync(mkdtempSync(join(tmpdir(), "flume-layers-")));
  dirs.push(d);
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: d, env });
  mkdirSync(join(d, "bin"));
  writeFileSync(
    join(d, "bin/claude"),
    `#!/bin/sh\nfor a in "$@"; do printf '%s\\n' "$a"; done > "${d}/claude.log"\n`,
  );
  chmodSync(join(d, "bin/claude"), 0o755);
  mkdirSync(join(d, "home"));
  const e = { ...env, HOME: join(d, "home"), PATH: `${join(d, "bin")}:${process.env.PATH}` };
  const flume = (...args: string[]) =>
    spawnSync("node", [bin, ...args], { cwd: d, encoding: "utf8", env: e });
  flume("init");
  for (const [rel, text] of Object.entries(files)) {
    const f = join(d, "flume", rel);
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, text);
  }
  const child = spawn("node", [bin, "serve"], { cwd: d, env: e });
  if (child.pid) pids.push(child.pid);
  await new Promise<void>((res, rej) => {
    child.stdout.once("data", () => res());
    child.once("exit", () => rej(new Error("serve exited")));
  });
  return { d, flume };
}

const shipped = (name: string) => readFileSync(join(SHIPPED_DIR, name), "utf8");

const DOCS = `# Flume workflow @replace

You are agent {name}, stored in $AGENT_NAME.

This repo is documents. When the human asks for an edit, make it directly on
main. No task, no worktree, unless the human asks for one.
`;
const WEB = `# Flume workflow

## Guides @replace

Read the guide testing first.

## Review @add

Before closing, ask the human to review the change in the browser.
`;

describe("layers through the commands", () => {
  it("s-0df4 shipped documents alone come out word for word", async () => {
    const w = await workspace({});
    const out = w.flume("prime", "--name", "a", "--project", "web").stdout;
    const base = shipped("workflow.md").replaceAll("{name}", "a");
    const project = shipped("project.md").replaceAll("{project}", "web");
    expect(out).toContain(`<workflow>\n${base}\n${project}</workflow>\n`);
    for (const p of ["body", "design", "spec", "plan"])
      expect(w.flume("task", "template", p).stdout).toBe(shipped(`templates/${p}.md`));
    w.flume("agent", "--name", "a");
    const first = shipped("first-prompt.md").split("\n").slice(2).join("\n");
    expect(readFileSync(join(w.d, "claude.log"), "utf8").endsWith(`\n--\n${first}`)).toBe(true);
    w.flume("stop");
  }, 30_000);

  it("s-47cb a project can replace or extend the workflow and set the first prompt", async () => {
    const w = await workspace({
      "projects/docs/workflow.md": DOCS,
      "projects/web/workflow.md": WEB,
      "projects/web/first-prompt.md": "# First prompt\n\nHello {name} of {project}.\n",
    });
    const out = w.flume("prime", "--name", "a", "--project", "docs").stdout;
    expect(out).toContain(
      `<workflow>\n# Flume workflow\n\n${DOCS.replace("{name}", "a").split("\n").slice(2).join("\n")}\n# Project\n`,
    );
    expect(out).not.toContain("Working a task");
    const web = w.flume("prime", "--name", "a", "--project", "web").stdout;
    expect(web).toContain("## Guides\n\nRead the guide testing first.\n\n## Review\n");
    expect(web).toContain("## Working a task");
    expect(web).not.toContain("Guides are how-to notes");
    w.flume("agent", "--name", "a", "--project", "web");
    expect(readFileSync(join(w.d, "claude.log"), "utf8")).toContain("\n--\nHello a of web.\n");
    expect(w.flume("check").status).toBe(0);
    w.flume("stop");
  }, 30_000);

  it("s-2b4e a broken file stops prime, agent, template and guide", async () => {
    const GUIDE = "---\nname: g\ndescription: d\n---\n# G\n\nx\n";
    const w = await workspace({
      "workspace/guides/g.md": GUIDE,
      "projects/web/guides/g.md": "---\nname: g\ndescription: d\n---\n# G\n\n## Nope\n\ny\n",
      "projects/web/workflow.md": "# Flume workflow\n\n## Nope\n\ny\n",
      "projects/web/templates/body.md": "# Body\n\n## Nope\n\ny\n",
    });
    const cases: [string[], string][] = [
      [["prime", "--name", "a", "--project", "web"], "projects/web/workflow.md: line 3"],
      [["agent", "--name", "a", "--project", "web"], "projects/web/workflow.md: line 3"],
      [["task", "template", "body", "--project", "web"], "projects/web/templates/body.md: line 3"],
      [["guide", "g", "--project", "web"], "projects/web/guides/g.md: line 7"],
    ];
    for (const [args, where] of cases) {
      const r = w.flume(...args);
      expect([args, r.status, r.stdout]).toEqual([args, 1, ""]);
      expect(r.stderr).toContain(`flume/${where}: heading "## Nope"`);
    }
    expect(() => readFileSync(join(w.d, "claude.log"))).toThrow();
    w.flume("stop");
  }, 30_000);

  it("s-4703 check reports every layered file's errors with file, line and heading", async () => {
    const x = "# X\n\n## Nope @append\n\ny\n";
    const w = await workspace({
      "workspace/workflow.md": "no heading\n",
      "workspace/roles/worker.md": x,
      "projects/web/project.md": "# Project\n\n## Nope\n\ny\n",
      "projects/web/first-prompt.md": "# First prompt @bogus\n\ny\n",
      "projects/web/templates/plan.md": "# Plan\n\n## Nope @remove\n",
      "projects/web/guides/g.md": "---\nname: g\ndescription: d\n---\ntext\n",
    });
    const r = w.flume("check", "--json");
    expect(r.status).toBe(1);
    const found = (JSON.parse(r.stdout) as { path: string; message: string }[]).map(
      (p) => `${p.path} ${p.message.split(":")[0]}`,
    );
    expect(found).toEqual(
      expect.arrayContaining([
        "flume/workspace/workflow.md line 1",
        "flume/workspace/roles/worker.md line 3",
        "flume/projects/web/project.md line 3",
        "flume/projects/web/first-prompt.md line 1",
        "flume/projects/web/templates/plan.md line 3",
        "flume/projects/web/guides/g.md line 5",
      ]),
    );
    expect(w.flume("check").stdout).toContain(
      'flume/projects/web/project.md: line 3: heading "## Nope": ',
    );
    w.flume("stop");
  }, 30_000);

  it("s-cac1 guides merge by heading and keep the project's front matter", async () => {
    const w = await workspace({
      "workspace/guides/g.md": "---\nname: g\ndescription: workspace\n---\n# G\n\n## A\n\nBASE A\n",
      "projects/web/guides/g.md":
        "---\nname: g\ndescription: web\n---\n# G\n\n## B @add\n\nWEB B\n",
    });
    const r = w.flume("guide", "g", "--project", "web");
    expect(r.stdout).toBe('<guide name="g">\n# G\n\n## A\n\nBASE A\n\n## B\n\nWEB B\n</guide>\n');
    expect(w.flume("guide", "--project", "web").stdout).toBe("g\tweb\n");
    w.flume("stop");
  });
});
