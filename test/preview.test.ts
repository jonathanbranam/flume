import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";

const bin = new URL("../bin/flume.js", import.meta.url).pathname;
const env = { ...process.env, FLUME_URL: "" };
const dirs: string[] = [];
afterAll(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

/** A tasks repo with flume's folder (flume/) and the given files under it. */
function repo(files: Record<string, string>): string {
  const d = realpathSync(mkdtempSync(join(tmpdir(), "flume-preview-")));
  dirs.push(d);
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: d, env });
  for (const [rel, text] of Object.entries(files)) {
    const f = join(d, "flume", rel);
    mkdirSync(join(f, ".."), { recursive: true });
    writeFileSync(f, text);
  }
  return d;
}

const preview = (d: string, ...args: string[]) =>
  spawnSync("node", [bin, "preview", ...args], { cwd: d, encoding: "utf8", env });

/** The base adds Extra; the acme project replaces it. */
const OVERRIDE = {
  "base/workflow.md": "# Flume workflow\n\n## Extra @add\n\nBase text.\n",
  "projects/acme/workflow.md": "# Flume workflow\n\n## Extra\n\nProject text.\n",
};

describe("preview prints a merged document", () => {
  it("s-0117 a project's override in the preview", () => {
    const d = repo(OVERRIDE);
    const r = preview(d, "workflow", "--project", "acme");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("## Extra\n\nProject text.");
    expect(r.stdout).not.toContain("Base text.");
    expect(r.stdout).not.toContain("You are agent");
  }, 30_000);

  it("s-d4a8 each other target prints its document", () => {
    const d = repo({
      "base/roles/worker.md": "# Worker\n\nRole text.\n",
      "base/guides/g.md": "---\nname: g\ndescription: a guide\n---\n# G\n\nGuide text.\n",
      "base/templates/body.md": "# Body\n\nTemplate text.\n",
    });
    const role = preview(d, "role", "worker");
    const guide = preview(d, "guide", "g");
    const template = preview(d, "template", "body");
    expect(role.status).toBe(0);
    expect(role.stdout).toContain("Role text.");
    expect(guide.status).toBe(0);
    expect(guide.stdout).toContain("Guide text.");
    expect(template.status).toBe(0);
    expect(template.stdout).toContain("Template text.");
  }, 30_000);

  it("s-9c6a sources mark each section's file", () => {
    const d = repo(OVERRIDE);
    const r = preview(d, "workflow", "--project", "acme", "--layers");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("<!-- from: flume/projects/acme/workflow.md -->\n## Extra");
    expect(r.stdout).toContain("<!-- from: flume's own base/workflow.md -->");
  }, 30_000);

  it("s-abcd preview as JSON with each section's sources", () => {
    const d = repo(OVERRIDE);
    const r = preview(d, "workflow", "--json");
    expect(r.status).toBe(0);
    const root = JSON.parse(r.stdout) as {
      name: string;
      children: { name: string; sources: string[] }[];
    };
    expect(root.name).toBe("Flume workflow");
    const extra = root.children.find((c) => c.name === "Extra");
    expect(extra?.sources).toEqual(["flume/base/workflow.md"]);
  }, 30_000);

  it("s-830d a broken project layer prints file, line and heading and exits 1", () => {
    const d = repo({
      ...OVERRIDE,
      "projects/acme/workflow.md": "# Flume workflow\n\n## Missing\n\nNo such heading below.\n",
    });
    const r = preview(d, "workflow", "--project", "acme");
    expect(r.status).toBe(1);
    expect(r.stdout).toBe("");
    expect(r.stderr).toContain("flume/projects/acme/workflow.md: line 3");
    expect(r.stderr).toContain('heading "## Missing"');
  }, 30_000);

  it("s-f7b7 a document no layer has exits 1", () => {
    const d = repo({});
    const r = preview(d, "guide", "nope");
    expect(r.status).toBe(1);
    expect(r.stdout).toBe("");
    expect(r.stderr).toContain("guides/nope.md");
  }, 30_000);

  it("s-ce44 a template name that is not plain is refused", () => {
    const d = repo({});
    const r = preview(d, "template", "../escape");
    expect([r.status, r.stdout]).toEqual([1, ""]);
    expect(r.stderr).toContain("../escape");
  }, 30_000);
});
