import { readFileSync } from "node:fs";
import { formatHistory } from "../core/history.ts";
import { guideBlocks } from "../core/instructions.ts";
import { actorName, isAgent } from "../daemon/actor.ts";
import { daemonUrl, NOT_RUNNING, request } from "../daemon/index.ts";

const err = (s: string) => process.stderr.write(`${s}\n`);
const out = (s: string) => process.stdout.write(`${s}\n`);

const HELP = `usage: flume task <command> [options]

Commands:
  new TITLE [-k KIND] [--project P] [--parent ID] [--blocked-by IDS] [--related IDS]
            [--body TEXT | --body-file PATH]    create a task; prints its ID
  show ID [PART]                                the task's fields and parts; or one part's text
                                                (PART: body, design, spec, plan, comments)
  write ID PART [--file PATH|-] [--remove]      replace a part's text (standard input by default),
                                                or remove the part (PART: body, design, spec, plan)
  instructions ID                               what to do now: the current phase's steps, template and
                                                pushed guides (agent text; no --json)
  next ID                                       print the current plan group (heading and items)
  done ID ITEM...                               mark plan items done, as in: done ID 1.1 1.2
  skip ID ITEM... --reason TEXT                 mark plan items skipped, with the reason
  guide ID NAME --phase PHASE [--remove]        push a guide to a later (or the current) phase of the
                                                task, so its instructions include it; --remove drops it
  template PART [--project P]                   print the template to start a part from
  history ID                                    print the task's change history, oldest first
  list [--closed | --all] [--kind K] [--parent ID] [--assignee NAME|human] [--phase PHASE]
                                                one line per task (tab separated)
  update ID FIELD VALUE                         FIELD: title, kind, parent, blocked-by, related
  comment ID [--text TEXT | --body-file PATH]   add a comment to comments.md
  phase ID PHASE                                set the phase: proposal, design, specs, plan, implement
  assign ID [NAME|human] [--force]              hold the task: NAME, or yourself ($AGENT_NAME)
  claim ID [--force]                            same as: assign ID (to yourself)
  close ID                                      resolve the task
  reopen ID                                     reopen a resolved task

Every command takes --json (print the daemon's JSON) and --help.
Paths for --body-file: a dash means standard input. IDS is a comma separated list.
`;

const COMMANDS: Record<string, { opts: string[]; flags: string[]; pos: number; usage: string }> = {
  new: {
    opts: [
      "-k",
      "--kind",
      "--project",
      "--parent",
      "--blocked-by",
      "--related",
      "--body",
      "--body-file",
    ],
    flags: [],
    pos: 1,
    usage:
      "flume task new TITLE [-k KIND] [--project P] [--parent ID] [--blocked-by IDS] [--related IDS] [--body TEXT | --body-file PATH]",
  },
  show: { opts: [], flags: [], pos: -2, usage: "flume task show ID [PART]" },
  write: {
    opts: ["--file"],
    flags: ["--remove"],
    pos: 2,
    usage: "flume task write ID PART [--file PATH|-] [--remove]",
  },
  phase: { opts: [], flags: [], pos: 2, usage: "flume task phase ID PHASE" },
  instructions: { opts: [], flags: [], pos: 1, usage: "flume task instructions ID" },
  next: { opts: [], flags: [], pos: 1, usage: "flume task next ID" },
  done: { opts: [], flags: [], pos: -99, usage: "flume task done ID ITEM..." },
  skip: {
    opts: ["--reason"],
    flags: [],
    pos: -99,
    usage: "flume task skip ID ITEM... --reason TEXT",
  },
  guide: {
    opts: ["--phase"],
    flags: ["--remove"],
    pos: 2,
    usage: "flume task guide ID NAME --phase PHASE [--remove]",
  },
  template: {
    opts: ["--project"],
    flags: [],
    pos: 1,
    usage: "flume task template PART [--project P]",
  },
  list: {
    opts: ["--kind", "--parent", "--assignee", "--phase"],
    flags: ["--closed", "--all"],
    pos: 0,
    usage:
      "flume task list [--closed | --all] [--kind K] [--parent ID] [--assignee NAME|human] [--phase PHASE]",
  },
  history: { opts: [], flags: [], pos: 1, usage: "flume task history ID" },
  update: { opts: [], flags: [], pos: 3, usage: "flume task update ID FIELD VALUE" },
  comment: {
    opts: ["--text", "--body-file"],
    flags: [],
    pos: 1,
    usage: "flume task comment ID [--text TEXT | --body-file PATH]",
  },
  assign: {
    opts: [],
    flags: ["--force"],
    pos: -2,
    usage: "flume task assign ID [NAME|human] [--force]",
  },
  claim: { opts: [], flags: ["--force"], pos: 1, usage: "flume task claim ID [--force]" },
  close: { opts: [], flags: [], pos: 1, usage: "flume task close ID" },
  reopen: { opts: [], flags: [], pos: 1, usage: "flume task reopen ID" },
};

class Usage extends Error {}

function readText(path: string): string {
  try {
    return readFileSync(path === "-" ? 0 : path, "utf8");
  } catch (e) {
    throw new Usage(
      `cannot read ${path === "-" ? "standard input" : path}: ${(e as Error).message}`,
    );
  }
}

const ids = (v: string) =>
  v
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x !== "");

/** Task fields as the CLI names them; the API uses underscores. */
const FIELDS: Record<string, string> = {
  title: "title",
  kind: "kind",
  parent: "parent",
  "blocked-by": "blocked_by",
  related: "related",
};

// biome-ignore lint/suspicious/noExplicitAny: JSON from the daemon
type Task = any;

function human(r: Task): string {
  return `${r.id}\t${r.kind}\t${r.state}\t${r.phase}\t${r.assignee}\t${r.title}`;
}

/** `flume task ...`; returns the exit code. */
export async function task(cwd: string, args: string[]): Promise<number> {
  const [sub, ...rest] = args;
  if (sub === undefined || sub === "--help" || sub === "-h" || sub === "help") {
    (sub === undefined ? process.stderr : process.stdout).write(HELP);
    return sub === undefined ? 2 : 0;
  }
  const spec = COMMANDS[sub];
  if (!spec) {
    err(`flume: unknown task command '${sub}'\n\n${HELP.trimEnd()}`);
    return 2;
  }
  if (rest.includes("--help") || rest.includes("-h")) {
    out(`usage: ${spec.usage} [--json]`);
    return 0;
  }
  let json = false;
  const pos: string[] = [];
  const opt: Record<string, string> = {};
  const flag = new Set<string>();
  try {
    for (let i = 0; i < rest.length; i++) {
      const a = rest[i] as string;
      if (a === "--json") json = true;
      else if (spec.flags.includes(a)) flag.add(a);
      else if (spec.opts.includes(a)) {
        const v = rest[++i];
        if (v === undefined) throw new Usage(`${a} needs a value`);
        opt[a] = v;
      } else if (a.startsWith("-") && a !== "-" && !(sub === "update" && pos.length >= 2))
        throw new Usage(`unknown option '${a}'`);
      else pos.push(a);
    }
    const max = spec.pos < 0 ? -spec.pos : spec.pos;
    const min = spec.pos === -99 ? 2 : spec.pos < 0 ? max - 1 : spec.pos;
    if (pos.length < min) throw new Usage(`missing argument\n`);
    if (pos.length > max) throw new Usage(`unexpected argument '${pos[max]}'`);
    if (opt["--body"] !== undefined && opt["--body-file"] !== undefined)
      throw new Usage("use --body or --body-file, not both");
    if (opt["--text"] !== undefined && opt["--body-file"] !== undefined)
      throw new Usage("use --text or --body-file, not both");
    if (flag.has("--closed") && flag.has("--all"))
      throw new Usage("use --closed or --all, not both");
    if (sub === "skip" && (opt["--reason"] ?? "").trim() === "")
      throw new Usage("skip needs --reason TEXT");
    if (sub === "instructions" && json)
      throw new Usage("instructions is agent text and takes no --json");
    if (sub === "guide" && opt["--phase"] === undefined)
      throw new Usage("guide needs --phase PHASE");
    if (sub === "write" && flag.has("--remove") && opt["--file"] !== undefined)
      throw new Usage("use --file or --remove, not both");
    if (sub === "comment" && opt["--text"] === undefined && opt["--body-file"] === undefined)
      throw new Usage("comment needs --text or --body-file");
    if (sub === "new" && (pos[0] as string).trim() === "") throw new Usage("the title is empty");

    // Read any input before talking to the daemon.
    let body: string | undefined = opt["--body"];
    if (sub === "new" && opt["--body-file"] !== undefined) body = readText(opt["--body-file"]);

    const text =
      sub === "write" && !flag.has("--remove") ? readText(opt["--file"] ?? "-") : undefined;
    if (sub === "update" && !((pos[1] as string) in FIELDS))
      throw new Failure(
        `flume: unknown field '${pos[1]}'; fields: ${Object.keys(FIELDS).join(", ")}`,
      );
    const url = daemonUrl(cwd);
    const call = async (method: string, path: string, payload?: unknown) => {
      const r = url ? await request(url, method, path, payload) : undefined;
      if (!r) throw new Failure(NOT_RUNNING.trimEnd());
      if (r.status >= 400)
        throw new Failure(`flume: ${r.body?.error ?? `request failed (${r.status})`}`);
      return r.body;
    };
    const show = (t: Task, text: string) => out(json ? JSON.stringify(t) : text);
    const enc = encodeURIComponent;

    if (sub === "new") {
      const payload: Record<string, unknown> = {
        title: pos[0],
        kind: opt["-k"] ?? opt["--kind"] ?? "feature",
      };
      if (opt["--parent"] !== undefined) payload.parent = opt["--parent"];
      if (opt["--project"] !== undefined) payload.project = opt["--project"];
      if (body !== undefined) payload.body = body;
      if (opt["--blocked-by"] !== undefined) payload.blocked_by = ids(opt["--blocked-by"]);
      if (opt["--related"] !== undefined) payload.related = ids(opt["--related"]);
      const t = await call("POST", "/api/tasks", payload);
      show(t, t.id);
    } else if (sub === "show" && pos[1] !== undefined) {
      const r = await call("GET", `/api/tasks/${enc(pos[0] as string)}/parts/${enc(pos[1])}`);
      if (json) out(JSON.stringify(r));
      else process.stdout.write(r.text);
    } else if (sub === "show") {
      const t = await call("GET", `/api/tasks/${enc(pos[0] as string)}`);
      if (json) out(JSON.stringify(t));
      else
        process.stdout.write(
          `${t.fields}\nparts: ${t.parts.join(", ")}\nFor what to do now: flume task instructions ${pos[0]}\n`,
        );
    } else if (sub === "write") {
      const base = `/api/tasks/${enc(pos[0] as string)}/parts/${enc(pos[1] as string)}`;
      const t = flag.has("--remove")
        ? await call("DELETE", base)
        : await call("PUT", base, { text });
      if (json) out(JSON.stringify(t));
    } else if (sub === "phase") {
      const t = await call("POST", `/api/tasks/${enc(pos[0] as string)}/phase`, {
        phase: pos[1],
      });
      if (json) out(JSON.stringify(t));
      else out(`next: flume task instructions ${pos[0]}`);
    } else if (sub === "guide") {
      const t = await call("POST", `/api/tasks/${enc(pos[0] as string)}/guides`, {
        guide: pos[1],
        phase: opt["--phase"],
        remove: flag.has("--remove"),
      });
      if (json) out(JSON.stringify(t));
    } else if (sub === "next") {
      const r = await call("GET", `/api/tasks/${enc(pos[0] as string)}/plan/next`);
      if (json) out(JSON.stringify(r));
      else if (r.complete) out("The plan is complete: every item is done or skipped.");
      else {
        process.stdout.write(r.text);
        if (r.guides.length > 0) process.stdout.write(`\n${guideBlocks(r.guides).join("\n")}`);
      }
    } else if (sub === "instructions") {
      const r = await call("POST", `/api/tasks/${enc(pos[0] as string)}/instructions`);
      process.stdout.write(r.text);
    } else if (sub === "done" || sub === "skip") {
      const t = await call("POST", `/api/tasks/${enc(pos[0] as string)}/plan/${sub}`, {
        items: pos.slice(1),
        ...(sub === "skip" ? { reason: opt["--reason"] } : {}),
      });
      if (json) out(JSON.stringify(t));
    } else if (sub === "template") {
      const q = opt["--project"] === undefined ? "" : `?project=${enc(opt["--project"])}`;
      const r = await call("GET", `/api/templates/${enc(pos[0] as string)}${q}`);
      if (json) out(JSON.stringify(r));
      else process.stdout.write(r.text);
    } else if (sub === "list") {
      const q = new URLSearchParams({
        state: flag.has("--all") ? "all" : flag.has("--closed") ? "resolved" : "open",
      });
      if (opt["--kind"] !== undefined) q.set("kind", opt["--kind"]);
      if (opt["--parent"] !== undefined) q.set("parent", opt["--parent"]);
      if (opt["--assignee"] !== undefined) q.set("assignee", opt["--assignee"]);
      if (opt["--phase"] !== undefined) q.set("phase", opt["--phase"]);
      const list: Task[] = await call("GET", `/api/tasks?${q}`);
      if (json) out(JSON.stringify(list));
      else for (const t of list) out(human(t));
    } else if (sub === "history") {
      const list: Task[] = await call("GET", `/api/tasks/${enc(pos[0] as string)}/history`);
      if (json) out(JSON.stringify(list));
      else for (const h of list) out(formatHistory(h));
    } else if (sub === "assign" || sub === "claim") {
      const who = pos[1] ?? process.env.AGENT_NAME;
      if (!who)
        throw new Usage(
          '$AGENT_NAME is not set, so there is no "yourself" to assign to: name who to assign the task to, or launch the agent with flume agent',
        );
      const t = await call("POST", `/api/tasks/${enc(pos[0] as string)}/assign`, {
        assignee: who,
        force: flag.has("--force"),
        ...(isAgent() ? { actor: actorName() } : {}),
      });
      if (json) out(JSON.stringify(t));
      else if (isAgent() && who === actorName()) {
        const r = await call("POST", `/api/tasks/${enc(pos[0] as string)}/instructions`);
        process.stdout.write(r.text);
      }
    } else if (sub === "update") {
      const key = FIELDS[pos[1] as string] as string;
      const v = pos[2] as string;
      const value = key === "blocked_by" || key === "related" ? ids(v) : v;
      const t = await call("PATCH", `/api/tasks/${enc(pos[0] as string)}`, {
        [key]: v === "" && (key === "parent" || Array.isArray(value)) ? null : value,
      });
      if (json) out(JSON.stringify(t));
    } else if (sub === "comment") {
      const text = opt["--text"] ?? readText(opt["--body-file"] as string);
      const t = await call("POST", `/api/tasks/${enc(pos[0] as string)}/comments`, {
        text,
        ...(isAgent() ? { author: actorName() } : {}),
      });
      if (json) out(JSON.stringify(t));
    } else {
      const t = await call("POST", `/api/tasks/${enc(pos[0] as string)}/${sub}`);
      if (json) out(JSON.stringify(t));
    }
    return 0;
  } catch (e) {
    if (e instanceof Usage) {
      err(`flume: ${e.message}\nusage: ${spec.usage}`);
      return 2;
    }
    if (e instanceof Failure) {
      err(e.message);
      return 1;
    }
    throw e;
  }
}

class Failure extends Error {}
