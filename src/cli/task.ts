import { readFileSync } from "node:fs";
import { Command } from "@commander-js/extra-typings";
import { formatHistory } from "../core/history.ts";
import { guideBlocks } from "../core/instructions.ts";
import { actorName, isAgent } from "../daemon/actor.ts";
import { daemonUrl, NOT_RUNNING, request } from "../daemon/index.ts";
import { act, Usage } from "./program.ts";

const err = (s: string) => process.stderr.write(`${s}\n`);
const out = (s: string) => process.stdout.write(`${s}\n`);

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

interface Opts {
  kind?: string;
  project?: string;
  parent?: string;
  blockedBy?: string;
  related?: string;
  body?: string;
  bodyFile?: string;
  file?: string;
  remove?: boolean;
  reason?: string;
  dropped?: string;
  phase?: string;
  closed?: boolean;
  all?: boolean;
  assignee?: string;
  text?: string;
  force?: boolean;
  json?: boolean;
}

/** One `flume task <sub>`: `pos` are the declared arguments, `o` the declared options. */
export async function task(cwd: string, sub: string, pos: string[], o: Opts): Promise<number> {
  const json = o.json === true;
  try {
    if (o.body !== undefined && o.bodyFile !== undefined)
      throw new Usage("use --body or --body-file, not both");
    if (o.text !== undefined && o.bodyFile !== undefined)
      throw new Usage("use --text or --body-file, not both");
    if (o.closed && o.all) throw new Usage("use --closed or --all, not both");
    if (sub === "skip" && (o.reason ?? "").trim() === "")
      throw new Usage("skip needs --reason TEXT");
    if (sub === "close" && o.dropped !== undefined && o.dropped.trim() === "")
      throw new Usage("--dropped needs a REASON");
    if (sub === "write" && o.remove && o.file !== undefined)
      throw new Usage("use --file or --remove, not both");
    if (sub === "comment" && o.text === undefined && o.bodyFile === undefined)
      throw new Usage("comment needs --text or --body-file");
    if (sub === "new" && (pos[0] as string).trim() === "") throw new Usage("the title is empty");

    // Read any input before talking to the daemon.
    let body: string | undefined = o.body;
    if (sub === "new" && o.bodyFile !== undefined) body = readText(o.bodyFile);

    const text = sub === "write" && !o.remove ? readText(o.file ?? "-") : undefined;
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
        kind: o.kind ?? "feature",
      };
      if (o.parent !== undefined) payload.parent = o.parent;
      if (o.project !== undefined) payload.project = o.project;
      if (body !== undefined) payload.body = body;
      if (o.blockedBy !== undefined) payload.blocked_by = ids(o.blockedBy);
      if (o.related !== undefined) payload.related = ids(o.related);
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
      const t = o.remove ? await call("DELETE", base) : await call("PUT", base, { text });
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
        phase: o.phase,
        remove: o.remove,
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
        ...(sub === "skip" ? { reason: o.reason } : {}),
      });
      if (json) out(JSON.stringify(t));
    } else if (sub === "template") {
      const q = o.project === undefined ? "" : `?project=${enc(o.project)}`;
      const r = await call("GET", `/api/templates/${enc(pos[0] as string)}${q}`);
      if (json) out(JSON.stringify(r));
      else process.stdout.write(r.text);
    } else if (sub === "list") {
      const q = new URLSearchParams({
        state: o.all ? "all" : o.closed ? "resolved" : "open",
      });
      if (o.kind !== undefined) q.set("kind", o.kind);
      if (o.parent !== undefined) q.set("parent", o.parent);
      if (o.assignee !== undefined) q.set("assignee", o.assignee);
      if (o.phase !== undefined) q.set("phase", o.phase);
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
        force: o.force,
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
      const text = o.text ?? readText(o.bodyFile as string);
      const t = await call("POST", `/api/tasks/${enc(pos[0] as string)}/comments`, {
        text,
        ...(isAgent() ? { author: actorName() } : {}),
      });
      if (json) out(JSON.stringify(t));
    } else {
      const t = await call(
        "POST",
        `/api/tasks/${enc(pos[0] as string)}/${sub}`,
        sub === "close" && o.dropped !== undefined
          ? { dropped: o.dropped, ...(isAgent() ? { author: actorName() } : {}) }
          : undefined,
      );
      if (json) out(JSON.stringify(t));
    }
    return 0;
  } catch (e) {
    if (e instanceof Usage) {
      throw e;
    }
    if (e instanceof Failure) {
      err(e.message);
      return 1;
    }
    throw e;
  }
}

class Failure extends Error {}

/** The `flume task` group: every subcommand declares its arguments and options here. */
export function taskCommand(): Command {
  const group = new Command("task").description(
    "new, show, list, update, comment, assign, claim, phase, write, ...",
  );
  group.addHelpText("after", "\nPaths for --body-file and --file: a dash means standard input.");
  // Each subcommand's action hands its parsed values to task(); a refused combination is a usage error.
  const sub = (name: string, description: string) => {
    const c = new Command(name).description(description);
    group.addCommand(c);
    return c;
  };
  const run = (c: Pick<Command, "error">, name: string, pos: string[], o: Opts) =>
    act(c, () => task(process.cwd(), name, pos, o));
  const J = "--json";
  const JD = "print the daemon's JSON";

  sub("new", "create a task; prints its ID")
    .argument("<title>")
    .option("-k, --kind <kind>", "task kind (default feature)")
    .option("--project <p>", "project")
    .option("--parent <id>", "parent task")
    .option("--blocked-by <ids>", "comma separated task IDs")
    .option("--related <ids>", "comma separated task IDs")
    .option("--body <text>", "the body text")
    .option("--body-file <path>", "the body from a file; a dash means standard input")
    .option(J, JD)
    .action(function (title, o) {
      return run(this, "new", [title], o);
    });
  sub("show", "the task's fields and parts; or one part's text")
    .argument("<id>")
    .argument("[part]", "body, design, spec, plan or comments")
    .option(J, JD)
    .action(function (id, part, o) {
      return run(this, "show", part === undefined ? [id] : [id, part], o);
    });
  sub("write", "replace a part's text (standard input by default), or remove the part")
    .argument("<id>")
    .argument("<part>", "body, design, spec or plan")
    .option("--file <path>", "read the text from a file; a dash means standard input")
    .option("--remove", "remove the part")
    .option(J, JD)
    .action(function (id, part, o) {
      return run(this, "write", [id, part], o);
    });
  sub("instructions", "what to do now: the current phase's steps, template and pushed guides")
    .argument("<id>")
    .addHelpText("after", "\nAgent text; takes no --json.")
    .action(function (id) {
      return run(this, "instructions", [id], {});
    });
  sub("next", "print the current plan group (heading and items)")
    .argument("<id>")
    .option(J, JD)
    .action(function (id, o) {
      return run(this, "next", [id], o);
    });
  sub("done", "mark plan items done, as in: done ID 1.1 1.2")
    .argument("<id>")
    .argument("<items...>")
    .option(J, JD)
    .action(function (id, items, o) {
      return run(this, "done", [id, ...items], o);
    });
  sub("skip", "mark plan items skipped, with the reason")
    .argument("<id>")
    .argument("<items...>")
    .option("--reason <text>", "why the items are skipped")
    .option(J, JD)
    .action(function (id, items, o) {
      return run(this, "skip", [id, ...items], o);
    });
  sub("guide", "push a guide to a later (or the current) phase of the task")
    .argument("<id>")
    .argument("<name>")
    .requiredOption("--phase <phase>", "the phase to push the guide to")
    .option("--remove", "drop the guide")
    .option(J, JD)
    .action(function (id, name, o) {
      return run(this, "guide", [id, name], o);
    });
  sub("template", "print the template to start a part from")
    .argument("<part>")
    .option("--project <p>", "project")
    .option(J, JD)
    .action(function (part, o) {
      return run(this, "template", [part], o);
    });
  sub("history", "print the task's change history, oldest first")
    .argument("<id>")
    .option(J, JD)
    .action(function (id, o) {
      return run(this, "history", [id], o);
    });
  sub("list", "one line per task (tab separated)")
    .option("--closed", "resolved tasks only")
    .option("--all", "open and resolved tasks")
    .option("--kind <k>", "only this kind")
    .option("--parent <id>", "only children of this task")
    .option("--assignee <name>", "only this assignee (a name, or human)")
    .option("--phase <phase>", "only this phase")
    .option(J, JD)
    .action(function (o) {
      return run(this, "list", [], o);
    });
  sub("update", "set a field: title, kind, parent, blocked-by or related")
    .argument("<id>")
    .argument("<field>")
    .argument("<value>")
    .option(J, JD)
    .action(function (id, field, value, o) {
      return run(this, "update", [id, field, value], o);
    });
  sub("comment", "add a comment to comments.md")
    .argument("<id>")
    .option("--text <text>", "the comment")
    .option("--body-file <path>", "the comment from a file; a dash means standard input")
    .option(J, JD)
    .action(function (id, o) {
      return run(this, "comment", [id], o);
    });
  sub("phase", "set the phase: proposal, design, specs, plan, implement")
    .argument("<id>")
    .argument("<phase>")
    .option(J, JD)
    .action(function (id, phase, o) {
      return run(this, "phase", [id, phase], o);
    });
  sub("assign", "hold the task: NAME, or yourself ($AGENT_NAME)")
    .argument("<id>")
    .argument("[name]", "a name, or human")
    .option("--force", "take it even when someone holds it")
    .option(J, JD)
    .action(function (id, name, o) {
      return run(this, "assign", name === undefined ? [id] : [id, name], o);
    });
  sub("claim", "same as: assign ID (to yourself)")
    .argument("<id>")
    .option("--force", "take it even when someone holds it")
    .option(J, JD)
    .action(function (id, o) {
      return run(this, "claim", [id], o);
    });
  sub("close", "resolve the task as done, or as dropped with --dropped REASON")
    .argument("<id>")
    .option("--dropped <reason>", "resolve as dropped (not done); REASON is added as a comment")
    .option(J, JD)
    .action(function (id, o) {
      return run(this, "close", [id], o);
    });
  sub("reopen", "reopen a resolved task")
    .argument("<id>")
    .option(J, JD)
    .action(function (id, o) {
      return run(this, "reopen", [id], o);
    });
  return group;
}
