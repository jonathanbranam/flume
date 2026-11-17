import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const bin = new URL("../bin/flume.js", import.meta.url).pathname;
let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "flume-agent-"));
  mkdirSync(join(dir, "bin"));
  mkdirSync(join(dir, "home"));
  const claude = `#!/bin/sh
{ echo "AGENT_NAME=$AGENT_NAME"; echo "AGENT_PROJECT=$AGENT_PROJECT"; for a in "$@"; do printf 'ARG:%s\\n' "$(printf %s "$a" | tr '\\n' '\\036')"; done; echo END; } >> "${dir}/claude.log"
exit \${FAKE_CLAUDE_EXIT:-0}
`;
  const tmux = `#!/bin/sh
case "$1" in
  show-options) printf '%s\\n' "$FAKE_PANE_OPT" ;;
  set-option) echo "$@" >> "${dir}/tmux.log" ;;
  list-panes) cat "${dir}/panes" 2>/dev/null ;;
esac
exit 0
`;
  for (const [n, s] of [
    ["claude", claude],
    ["tmux", tmux],
  ] as const) {
    writeFileSync(join(dir, "bin", n), s);
    chmodSync(join(dir, "bin", n), 0o755);
  }
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function flume(args: string[], env: Record<string, string> = {}) {
  const e: Record<string, string> = {
    PATH: `${join(dir, "bin")}:${process.env.PATH}`,
    HOME: join(dir, "home"),
    ...env,
  };
  const r = spawnSync("node", [bin, ...args], { encoding: "utf8", env: e });
  return { out: r.stdout, err: r.stderr, code: r.status };
}
const claudeRuns = () => {
  try {
    return readFileSync(join(dir, "claude.log"), "utf8")
      .split("END\n")
      .filter(Boolean)
      .map((r) => r.split("\n").filter(Boolean));
  } catch {
    return [];
  }
};
const args = (run: string[]) =>
  run.filter((l) => l.startsWith("ARG:")).map((l) => l.slice(4).replaceAll("\u001e", "\n"));
const entry = (n: string) =>
  JSON.parse(readFileSync(join(dir, "home", ".flume", "agents", `${n}.json`), "utf8"));
const writeEntry = (n: string, e: Record<string, string>) => {
  mkdirSync(join(dir, "home", ".flume", "agents"), { recursive: true });
  writeFileSync(join(dir, "home", ".flume", "agents", `${n}.json`), JSON.stringify(e));
};

describe("flume agent specs", () => {
  it("s-a1c1 launch by name", () => {
    const r = flume(["agent", "--name", "alpha"], { FAKE_CLAUDE_EXIT: "3" });
    expect(r.code).toBe(3);
    expect(claudeRuns()).toHaveLength(1);
    expect(claudeRuns()[0]).toContain("AGENT_NAME=alpha");
    expect(entry("alpha").name).toBe("alpha");
  });

  it("s-a2c1 options before the name", () => {
    flume(["agent", "--project", "web", "--name", "alpha"]);
    expect(claudeRuns()[0]).toContain("AGENT_NAME=alpha");
    expect(claudeRuns()[0]).toContain("AGENT_PROJECT=web");
  });

  it("s-a2c2 unrecognized arguments and double dash", () => {
    flume(["agent", "--name", "alpha", "--", "--model=opus", "--force", "-p"]);
    const run = args(claudeRuns()[0] as string[]);
    expect(run.slice(run.indexOf("--model=opus"), run.indexOf("--model=opus") + 3)).toEqual([
      "--model=opus",
      "--force",
      "-p",
    ]);
  });

  it("s-d1c1 value before and after the prompt", () => {
    flume(["agent", "--name", "alpha", "do xyz", "--", "--model", "opus"]);
    const a = args(claudeRuns()[0] as string[]);
    expect(a.slice(a.indexOf("--model"), a.indexOf("--model") + 2)).toEqual(["--model", "opus"]);
    expect(a.at(-1)).toBe("do xyz");
  });

  it("s-d1c2 several values", () => {
    flume(["agent", "--name", "alpha", "do xyz", "--", "--add-dir", "a", "b"]);
    const a = args(claudeRuns()[0] as string[]);
    const i = a.indexOf("--add-dir");
    expect(a.slice(i, i + 3)).toEqual(["--add-dir", "a", "b"]);
    expect(a.at(-1)).toBe("do xyz");
  });

  it("s-d1c3 optional value", () => {
    flume(["agent", "--name", "alpha", "--", "--resume", "--model", "opus"]);
    const a = args(claudeRuns()[0] as string[]);
    const i = a.indexOf("--resume");
    expect(a.slice(i, i + 4)).toEqual(["--resume", "--model", "opus", "--"]);
  });

  it("s-a3c1 project saved and reused", () => {
    flume(["agent", "--name", "alpha", "--project", "web"]);
    flume(["agent", "--name", "alpha"]);
    expect(claudeRuns()[1]).toContain("AGENT_PROJECT=web");
    expect(entry("alpha").project).toBe("web");
  });

  it("s-a4c1 name read from the pane", () => {
    flume(["agent"], { TMUX_PANE: "%1", FAKE_PANE_OPT: "alpha" });
    expect(claudeRuns()[0]).toContain("AGENT_NAME=alpha");
  });

  it("s-a4c2 no name anywhere", () => {
    const r = flume(["agent", "pick up it's xyz", "--", "--model", "opus"]);
    expect(r.code).toBe(2);
    expect(claudeRuns()).toHaveLength(0);
    expect(r.err).toContain("--name");
    expect(r.err.split("\n")).toContain("flume agent 'pick up it'\\''s xyz' -- --model opus");
  });

  it("s-a5c1 refused when tied to another pane", () => {
    writeEntry("alpha", { name: "alpha", project: "", pane: "%7", created: "", last_launch: "" });
    const r = flume(["agent", "--name", "alpha"], { TMUX_PANE: "%1" });
    expect(r.code).toBe(1);
    expect(r.err).toContain("%7");
    expect(claudeRuns()).toHaveLength(0);
  });

  it("s-a5c2 forced", () => {
    writeEntry("alpha", { name: "alpha", project: "", pane: "%7", created: "", last_launch: "" });
    const r = flume(["agent", "--name", "alpha", "--force"], { TMUX_PANE: "%1" });
    expect(r.code).toBe(0);
    expect(claudeRuns()).toHaveLength(1);
    expect(entry("alpha").pane).toBe("%1");
    expect(readFileSync(join(dir, "tmux.log"), "utf8")).toContain("@flume_agent alpha");
  });

  it("s-a6c1 prime in the system prompt", () => {
    flume(["agent", "--name", "alpha", "--project", "web", "pick up xyz"]);
    const a = args(claudeRuns()[0] as string[]);
    const prime = a[a.indexOf("--append-system-prompt") + 1] as string;
    expect(prime).toContain("You are agent alpha");
    expect(prime).toContain("Use the flume CLI to work with tasks; run flume --help to learn it.");
    expect(prime).toContain(
      "Never start flume serve yourself; only the human does. If flume says the server is not running, ask the human to start it.",
    );
    expect(prime).toContain(
      "You are working on the web project. Read that project's CLAUDE.md and follow its instructions.",
    );
    expect(a[a.indexOf("--name") + 1]).toBe("alpha");
    expect(a.at(-1)).toBe("pick up xyz");
  });

  it("s-a7c1 default first prompt", () => {
    flume(["agent", "--name", "alpha", "--", "--add-dir", "x"]);
    const a = args(claudeRuns()[0] as string[]);
    expect(a.at(-1)).not.toBe("");
    expect(a.at(-1)).not.toContain("You are agent alpha");
    expect(a.at(-2)).toBe("--");
  });

  it("s-a1c2 name with an equals sign", () => {
    flume(["agent", "--name=alpha"]);
    expect(claudeRuns()[0]).toContain("AGENT_NAME=alpha");
  });

  it("s-a3c2 name outside the pattern is refused", () => {
    const r = flume(["agent", "--name", "../evil"]);
    expect(r.code).toBe(2);
    expect(r.err).toContain("../evil");
    expect(r.err).toContain("[a-z0-9][a-z0-9-]*");
    expect(claudeRuns()).toHaveLength(0);
    expect(existsSync(join(dir, "home", ".flume"))).toBe(false);
  });

  it("s-a2c3 a bare argument is not a name", () => {
    const r = flume(["agent", "alpha"]);
    expect(r.code).toBe(2);
    expect(claudeRuns()).toHaveLength(0);
    expect(existsSync(join(dir, "home", ".flume", "agents", "alpha.json"))).toBe(false);
  });

  it("s-a2c4 claude option before the double dash", () => {
    const r = flume(["agent", "--name", "alpha", "--add-dir", "../lib", "fix the bug"]);
    expect(r.code).toBe(2);
    expect(r.err).toBe(
      'flume: unknown option --add-dir\nClaude options go after --, as in: flume agent "<prompt>" -- --add-dir ...\n',
    );
    expect(claudeRuns()).toHaveLength(0);
  });

  it("s-a2c5 name option before the double dash", () => {
    const r = flume(["agent", "--name", "alpha", "-n", "other"]);
    expect(r.code).toBe(2);
    expect(r.err).toContain("flume: unknown option -n\n");
    expect(claudeRuns()).toHaveLength(0);
  });

  const refused = (a: string[]) => {
    const r = flume(["agent", "--name", "alpha", ...a]);
    expect(r.code).toBe(2);
    expect(r.err).not.toBe("");
    expect(claudeRuns()).toHaveLength(0);
  };
  it("s-c1c1 two prompts", () => refused(["one", "--", "two"]));
  it("s-c1c2 claude name after the double dash", () => refused(["--", "--name", "other"]));
  it("s-c1c3 appended system prompt", () => refused(["--", "--append-system-prompt", "extra"]));
  it("s-c1c4 repeated single-value option", () =>
    refused(["--", "--model", "opus", "--model", "haiku"]));
  it("s-c1c6 missing value", () => refused(["--", "--model"]));

  it("s-c1c5 several-value option may repeat", () => {
    const r = flume(["agent", "--name", "alpha", "--", "--add-dir", "a", "--add-dir", "b"]);
    expect(r.code).toBe(0);
    const a = args(claudeRuns()[0] as string[]);
    expect(a.join(" ")).toContain("--add-dir a --add-dir b");
  });

  it("s-c2c1 help", () => {
    const r = flume(["agent", "--help"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("[--force]");
    expect(r.out).toContain("[-- <claude-arg>...]");
  });

  it("s-a8c1 templates folder ignored", () => {
    mkdirSync(join(dir, "home", ".flume", "templates"), { recursive: true });
    writeFileSync(join(dir, "home", ".flume", "templates", "base.md"), "Hello {name}");
    const out = flume(["prime", "--name", "alpha"]).out;
    expect(out).not.toContain("Hello alpha");
    expect(out).toContain("You are agent alpha");
  });

  it("s-a9c1 prime with a project", () => {
    const r = flume(["prime", "--name", "alpha", "--project", "web"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("You are agent alpha");
    expect(r.out).toContain("Use the flume CLI to work with tasks; run flume --help to learn it.");
    expect(r.out).toContain(
      "You are working on the web project. Read that project's CLAUDE.md and follow its instructions.",
    );
  });

  it("s-b1c1 list live column", () => {
    for (const [n, p] of [
      ["a", "%1"],
      ["b", "%2"],
      ["c", "%3"],
    ] as const)
      writeEntry(n, { name: n, project: "", pane: p, created: "", last_launch: "t" });
    writeFileSync(join(dir, "panes"), "%1 claude\n%2 zsh\n");
    const r = flume(["agent", "list"]);
    const row = (n: string) =>
      (r.out.split("\n").find((l) => l.startsWith(`${n} `)) ?? "").split(/\s+/);
    expect(r.out).toMatch(/^NAME\s+PANE\s+PROJECT\s+LIVE\s+LAST-LAUNCH/);
    expect(row("a")[3]).toBe("yes");
    expect(row("b")[3]).toBe("pane");
    expect(row("c")[3]).toBe("-");
  });

  it("s-b2c1 show", () => {
    flume(["agent", "--name", "alpha", "--project", "web"]);
    const r = flume(["agent", "show", "alpha"]);
    expect(r.code).toBe(0);
    expect(r.out).toContain('"project": "web"');
    expect(flume(["agent", "show", "nope"]).code).toBe(1);
  });
});
