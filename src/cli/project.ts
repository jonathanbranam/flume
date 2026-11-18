import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { isMap, parseDocument } from "yaml";
import { FLUME_YAML, isGitUrl, readProjects, repoName, validProjectName } from "../core/index.ts";
import {
  cloneRepo,
  commitPaths,
  findInitialized,
  findProject,
  inRepo,
  originUrl,
  readConfigRoot,
} from "../daemon/index.ts";
import { init } from "./init.ts";

const err = (s: string) => process.stderr.write(`${s}\n`);
const out = (s: string) => process.stdout.write(`${s}\n`);

const HELP = `usage: flume project <command> [options]

Commands:
  list [--json]                                 projects in flume.yaml: name, url, branch
  clone [<name>...] [--json]                    clone the named projects (default all) into the workspace
  add <git-url | name> [--name N] [--branch B]  add a project to flume.yaml and commit it; a URL is cloned,
                                                a bare name is added with no url (warns)

These work on files and git directly; they do not use the daemon.
`;

/** The workspace folder and the task root for the folder `cwd`, or an error message. */
function locate(cwd: string): { ws: string; taskRoot: string } | string {
  const ws = findInitialized(cwd);
  if (!ws) return "no flume workspace here: run flume init first";
  const taskRoot = readConfigRoot(ws) ?? findProject(ws)?.mainCheckout;
  if (!taskRoot || !inRepo(taskRoot)) return "no task root: run flume init --root PATH";
  return { ws, taskRoot };
}

function list(cwd: string, args: string[]): number {
  const json = args.includes("--json");
  const extra = args.filter((a) => a !== "--json");
  if (extra.length > 0) {
    err(`flume: unexpected argument '${extra[0]}'\nusage: flume project list [--json]`);
    return 2;
  }
  const loc = locate(cwd);
  if (typeof loc === "string") {
    err(`flume: ${loc}`);
    return 1;
  }
  let rows: { name: string; url: string; branch: string }[];
  try {
    rows = readProjects(loc.taskRoot).map((p) => ({
      name: p.name,
      url: p.url ?? "",
      branch: p.branch ?? "",
    }));
  } catch (e) {
    err(`flume: ${(e as Error).message}`);
    return 1;
  }
  if (json) out(JSON.stringify(rows));
  else for (const r of rows) out(`${r.name}\t${r.url}\t${r.branch}`);
  return 0;
}

function add(cwd: string, args: string[]): number {
  const usage = "usage: flume project add <git-url | name> [--name NAME] [--branch BRANCH]";
  let arg: string | undefined;
  let name: string | undefined;
  let branch: string | undefined;
  for (let i = 0; i < args.length; i++) {
    const a = args[i] as string;
    if (a === "--name" || a === "--branch") {
      const v = args[++i];
      if (v === undefined) {
        err(`flume: ${a} needs a value\n${usage}`);
        return 2;
      }
      if (a === "--name") name = v;
      else branch = v;
    } else if (a.startsWith("--") || arg !== undefined) {
      err(`flume: unexpected argument '${a}'\n${usage}`);
      return 2;
    } else arg = a;
  }
  if (arg === undefined) {
    err(`flume: project add needs a git url or a project name\n${usage}`);
    return 2;
  }
  // A URL is cloned; a bare name is added with no url (no clone, and a warning).
  const url = isGitUrl(arg) ? arg : undefined;
  if (url === undefined && name !== undefined) {
    err(`flume: ${arg} is a name, so --name is not needed\n${usage}`);
    return 2;
  }
  if (url === undefined && branch !== undefined) {
    err(`flume: a project with no url has no branch to check out; drop --branch\n${usage}`);
    return 2;
  }
  const use = url === undefined ? arg : (name ?? repoName(url));
  if (!validProjectName(use)) {
    err(`flume: '${use}' is not a valid project folder name; give one with --name`);
    return 2;
  }
  const loc = locate(cwd);
  if (typeof loc === "string") {
    err(`flume: ${loc}`);
    return 1;
  }
  const { ws, taskRoot } = loc;
  const file = join(taskRoot, FLUME_YAML);
  if (!existsSync(file)) {
    err(`flume: no ${FLUME_YAML} in the task root: run flume init first`);
    return 1;
  }
  let existing: ReturnType<typeof readProjects>;
  try {
    existing = readProjects(taskRoot);
  } catch (e) {
    err(`flume: ${(e as Error).message}`);
    return 1;
  }
  if (existing.some((p) => p.name === use)) {
    err(`flume: project ${use} is already in ${FLUME_YAML}; nothing changed`);
    return 1;
  }
  const dest = join(ws, use);
  const there = existsSync(dest);
  if (url !== undefined && there && !(inRepo(dest) && originUrl(dest) === url)) {
    err(`flume: ${dest} already exists and is not a clone of ${url}; nothing changed`);
    return 1;
  }
  const doc = parseDocument(readFileSync(file, "utf8"));
  if (!doc.getIn(["projects"], true) || !isMap(doc.get("projects", true)))
    doc.set("projects", doc.createNode({}));
  doc.setIn(["projects", use], url === undefined ? {} : branch ? { url, branch } : { url });
  writeFileSync(file, String(doc));
  commitPaths(taskRoot, [FLUME_YAML], `flume project add: ${use}`);
  out(`added project ${use} to ${FLUME_YAML}`);
  if (url === undefined) {
    err(
      `flume: warning: project ${use} has no URL, so flume clone and flume project clone cannot set it up on another machine; add a url to ${FLUME_YAML} by hand`,
    );
    return 0;
  }
  if (there) {
    out(`project ${use}: already there`);
    return 0;
  }
  const e = cloneRepo(url, dest, branch);
  if (e !== undefined) {
    err(`flume: clone of project ${use} (${url}) failed: ${e}`);
    return 1;
  }
  out(`project ${use}: cloned`);
  return 0;
}

type Result = { name: string; status: "cloned" | "skipped" | "failed"; reason?: string };

/** `flume project clone [<name>...] [--json]`: clone projects of flume.yaml into <workspace>/<name>. */
function cloneProjects(cwd: string, args: string[]): number {
  const usage = "usage: flume project clone [<name>...] [--json]";
  const json = args.includes("--json");
  const names = args.filter((a) => a !== "--json");
  const bad = names.find((a) => a.startsWith("-"));
  if (bad) {
    err(`flume: unknown option '${bad}'\n${usage}`);
    return 2;
  }
  const loc = locate(cwd);
  if (typeof loc === "string") {
    err(`flume: ${loc}`);
    return 1;
  }
  let all: ReturnType<typeof readProjects>;
  try {
    all = readProjects(loc.taskRoot);
  } catch (e) {
    err(`flume: ${(e as Error).message}`);
    return 1;
  }
  const unknown = names.find((n) => !all.some((p) => p.name === n));
  if (unknown !== undefined) {
    err(`flume: no project ${unknown} in ${FLUME_YAML}\n${usage}`);
    return 2;
  }
  const chosen = names.length > 0 ? all.filter((p) => names.includes(p.name)) : all;
  const results: Result[] = [];
  for (const p of chosen) {
    const dest = join(loc.ws, p.name);
    if (!validProjectName(p.name)) {
      results.push({ name: p.name, status: "skipped", reason: "bad name" });
    } else if (p.url === undefined) {
      results.push({ name: p.name, status: "skipped", reason: "no url" });
    } else if (existsSync(dest)) {
      results.push({ name: p.name, status: "skipped", reason: "folder exists" });
    } else {
      const e = cloneRepo(p.url, dest, p.branch);
      if (e === undefined) results.push({ name: p.name, status: "cloned" });
      else {
        results.push({ name: p.name, status: "failed", reason: e });
        err(`flume: clone of project ${p.name} (${p.url}) failed: ${e}`);
      }
    }
  }
  if (json) out(JSON.stringify(results));
  else
    for (const r of results) {
      if (r.status === "failed") continue;
      out(`project ${r.name}: ${r.status}${r.status === "skipped" ? ` (${r.reason})` : ""}`);
    }
  return results.some((r) => r.status === "failed") ? 1 : 0;
}

/** `flume project ...`; returns the exit code. */
export function project(cwd: string, args: string[]): number {
  const [sub, ...rest] = args;
  if (sub === undefined || sub === "--help" || sub === "-h" || sub === "help") {
    (sub === undefined ? process.stderr : process.stdout).write(HELP);
    return sub === undefined ? 2 : 0;
  }
  if (rest.includes("--help") || rest.includes("-h")) {
    process.stdout.write(HELP);
    return 0;
  }
  if (sub === "list") return list(cwd, rest);
  if (sub === "add") return add(cwd, rest);
  if (sub === "clone") return cloneProjects(cwd, rest);
  err(`flume: unknown project command '${sub}'\n\n${HELP.trimEnd()}`);
  return 2;
}

/** `flume clone <git-url> [<workspace>]`: clone the tasks repo into the workspace, then project clone. */
export function cloneCmd(cwd: string, args: string[]): number {
  const usage = "usage: flume clone <git-url> [<workspace>]";
  if (args.includes("--help") || args.includes("-h")) {
    out(usage);
    return 0;
  }
  const bad = args.find((a) => a.startsWith("-"));
  if (bad || args.length < 1 || args.length > 2) {
    err(bad ? `flume: unknown option '${bad}'\n${usage}` : `flume: ${usage}`);
    return 2;
  }
  const url = args[0] as string;
  const ws = resolve(cwd, args[1] ?? ".");
  const name = repoName(url);
  if (!validProjectName(name)) {
    err(`flume: cannot name a folder from the url ${url}`);
    return 2;
  }
  if (existsSync(ws) && !statSync(ws).isDirectory()) {
    err(`flume: ${ws} is not a folder`);
    return 1;
  }
  const dest = join(ws, name);
  if (existsSync(dest)) {
    err(`flume: ${dest} already exists; nothing cloned`);
    return 1;
  }
  mkdirSync(ws, { recursive: true });
  const e = cloneRepo(url, dest);
  if (e !== undefined) {
    err(`flume: clone of ${url} failed: ${e}`);
    return 1;
  }
  out(`cloned the tasks repository into ${dest}`);
  const code = init(ws, ["--root", dest]);
  if (code !== 0) return code;
  const c2 = cloneProjects(ws, []);
  out("next: run flume serve in this folder");
  return c2;
}
