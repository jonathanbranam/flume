import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { userInfo } from "node:os";
import { version } from "../cli/version.ts";
import { touchSeen } from "../core/agents.ts";
import {
  addComment,
  appendHistory,
  assignTask,
  BrokenLayers,
  checkProject,
  createTask,
  formatGroup,
  groupGuides,
  type HistoryData,
  joinedText,
  listGuides,
  listTaskFiles,
  markPlan,
  nextGroup,
  PATCH_FIELDS,
  primeDocuments,
  readGuide,
  readHistory,
  readPart,
  readRoadmap,
  removePart,
  reopenTask,
  resolveRef,
  resolveTask,
  roadmapPath,
  roadmapView,
  SEGMENT_RE,
  type TaskEntry,
  taskObject,
  templateFor,
  updateTask,
  writePart,
} from "../core/index.ts";
import { commitPaths, inRepo } from "./git.ts";

/**
 * Who made a request, for the task history: the X-Flume-Agent header every command sends from
 * AGENT_NAME, else "human". Clients decide it with actorName (src/daemon/actor.ts); this is the one place the daemon reads it.
 */
const actorOf = (req: IncomingMessage): string => {
  const who = req.headers["x-flume-agent"];
  return typeof who === "string" && who.trim() !== "" ? who.trim() : "human";
};

class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface Daemon {
  server: Server;
  url: string;
  /** Stop listening and drop every connection. */
  close(): Promise<void>;
}

type Json = Record<string, unknown>;

/**
 * Start the daemon for the task root `root` on 127.0.0.1. Every handler that writes is
 * synchronous from reading the files to making the commit, and the event loop runs one handler
 * at a time, so writes are serialized without a lock.
 */
export function startDaemon(opts: {
  root: string;
  port?: number;
  onStop?: () => void;
}): Promise<Daemon> {
  const { root } = opts;
  const commits = inRepo(root);
  const commit = (id: string, change: string, paths: string[]) => {
    if (!commits) return;
    try {
      commitPaths(root, paths, `task ${id}: ${change}`);
    } catch (e) {
      throw new HttpError(
        500,
        `the file was written but the commit failed: ${(e as Error).message}`,
      );
    }
  };

  const find = (ref: string): TaskEntry => {
    const e = resolveRef(listTaskFiles(root), ref);
    if (!e) throw new HttpError(404, `no task ${ref}`);
    return e;
  };
  const bad = <T>(f: () => T): T => {
    try {
      return f();
    } catch (e) {
      if (e instanceof HttpError) throw e;
      // 422: a layered workflow file has an error; clients print it and exit 1.
      if (e instanceof BrokenLayers) throw new HttpError(422, e.message);
      throw new HttpError(400, (e as Error).message);
    }
  };

  const handle = (method: string, url: URL, body: Json, by: string): [number, unknown] => {
    const log = (e: TaskEntry, action: string, data: HistoryData = {}) =>
      appendHistory(root, e.path, by, action, data);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] !== "api") throw new HttpError(404, `no such path ${url.pathname}`);
    const [, a, id, c] = parts;
    const allow = (...ms: string[]) => {
      if (!ms.includes(method)) throw new HttpError(405, `${method} not allowed here`);
    };
    if (a === "status" && parts.length === 2) {
      allow("GET");
      return [200, { version: version(), root }];
    }
    if (a === "check" && parts.length === 2) {
      allow("GET");
      const problems = checkProject(root);
      return [200, { ok: problems.length === 0, problems }];
    }
    if (a === "roadmap" && parts.length === 2) {
      allow("GET");
      const text = readRoadmap(root);
      if (text === undefined) throw new HttpError(404, `there is no ${roadmapPath(root)}`);
      return [200, { sections: roadmapView(root, text) }];
    }
    if (a === "prime" && parts.length === 2) {
      allow("GET");
      const project = url.searchParams.get("project") ?? "";
      const role = url.searchParams.get("role") ?? "";
      const { first_prompt, ...parts } = bad(() => primeDocuments(root, project, role));
      return [
        200,
        {
          text: joinedText({ ...parts, first_prompt }),
          parts,
          first_prompt,
          guides: bad(() => listGuides(root, project)),
        },
      ];
    }
    if (a === "guides" && parts.length === 3) {
      allow("GET");
      const name = decodeURIComponent(parts[2] as string);
      const project = url.searchParams.get("project") ?? "";
      const r = bad(() => readGuide(root, project, name));
      if (!r) throw new HttpError(404, `no guide ${name}`);
      if (!r.ok) throw new HttpError(r.layers ? 422 : 400, r.error);
      return [200, r.guide];
    }
    if (a === "templates" && parts.length === 3) {
      allow("GET");
      const part = decodeURIComponent(parts[2] as string);
      const project = url.searchParams.get("project") ?? "";
      return [200, { part, text: bad(() => templateFor(root, project, part)) }];
    }
    if (a === "stop" && parts.length === 2) {
      allow("POST");
      return [200, { ok: true }];
    }
    if (a !== "tasks") throw new HttpError(404, `no such path ${url.pathname}`);
    if (parts.length === 2) {
      allow("GET", "POST");
      if (method === "POST") {
        const { title, kind, parent, project, body: text, blocked_by, related, ...rest } = body;
        const unknown = Object.keys(rest);
        if (unknown.length) throw new HttpError(400, `unknown field ${unknown[0]}`);
        if (typeof title !== "string" || title.trim() === "")
          throw new HttpError(400, "title is required");
        if (kind !== undefined && typeof kind !== "string")
          throw new HttpError(400, "kind must be a string");
        if (parent !== undefined && parent !== null && typeof parent !== "string")
          throw new HttpError(400, "parent must be a task ID");
        if (project !== undefined && (typeof project !== "string" || !SEGMENT_RE.test(project)))
          throw new HttpError(400, "project must be a plain name");
        if (text !== undefined && typeof text !== "string")
          throw new HttpError(400, "body must be a string");
        for (const [k, v] of [
          ["blocked_by", blocked_by],
          ["related", related],
        ] as const)
          if (v !== undefined && (!Array.isArray(v) || v.some((x) => typeof x !== "string")))
            throw new HttpError(400, `${k} must be a list of task IDs`);
        const e = bad(() =>
          createTask(root, {
            title,
            kind: (kind as string | undefined) ?? "feature",
            parent: (parent as string | null | undefined) ?? undefined,
            project: project as string | undefined,
            body: text as string | undefined,
            blockedBy: blocked_by as string[] | undefined,
            related: related as string[] | undefined,
          }),
        );
        log(e, "create", { title, kind: taskObject(e).kind });
        commit(e.nameId, `create ${title}`, [e.path]);
        return [201, taskObject(e)];
      }
      const state = url.searchParams.get("state") ?? "open";
      if (!["open", "resolved", "all"].includes(state))
        throw new HttpError(400, "state must be open, resolved or all");
      const kind = url.searchParams.get("kind");
      const parent = url.searchParams.get("parent");
      const assignee = url.searchParams.get("assignee");
      const entries = listTaskFiles(root);
      const parentId = parent === null ? null : (resolveRef(entries, parent)?.nameId ?? parent);
      const tasks = entries
        .filter((e) => state === "all" || e.state === state)
        .flatMap((e) => {
          try {
            const { body: _body, comments: _comments, fields: _fields, ...t } = taskObject(e);
            return [t];
          } catch {
            return [];
          }
        })
        .filter(
          (t) =>
            (kind === null || t.kind === kind) &&
            (parentId === null || t.parent === parentId) &&
            (assignee === null || t.assignee === assignee),
        )
        .sort((x, y) => x.created.localeCompare(y.created) || x.id.localeCompare(y.id));
      return [200, tasks];
    }
    if (parts.length === 4 && c === "history") {
      allow("GET");
      const e = find(id as string);
      return [200, bad(() => readHistory(root, e.nameId))];
    }
    if (parts.length === 5 && c === "plan") {
      const e = find(id as string);
      const what = parts[4];
      if (what === "next") {
        allow("GET");
        const group = bad(() => nextGroup(root, e.nameId));
        return [
          200,
          {
            complete: group === undefined,
            group: group ?? null,
            text: group ? formatGroup(group) : "",
            guides: group ? bad(() => groupGuides(root, e.nameId, group)) : [],
          },
        ];
      }
      if (what === "done" || what === "skip") {
        allow("POST");
        const items = body.items;
        if (!Array.isArray(items)) throw new HttpError(400, "items must be a list");
        const to = what === "done" ? "done" : "skipped";
        const reason = typeof body.reason === "string" ? body.reason : undefined;
        const u = bad(() => markPlan(root, e.nameId, items as string[], to, reason));
        log(u, `plan_${what}`, { items: items as string[], ...(reason ? { reason } : {}) });
        commit(e.nameId, `plan ${what} ${items.join(" ")}`, [u.path]);
        return [200, taskObject(u)];
      }
      throw new HttpError(404, `no such path ${url.pathname}`);
    }
    if (parts.length === 5 && c === "parts") {
      allow("GET", "PUT", "DELETE");
      const e = find(id as string);
      const part = decodeURIComponent(parts[4] as string);
      if (method === "GET") {
        const text = bad(() => readPart(root, e.nameId, part));
        if (text === undefined)
          throw new HttpError(
            404,
            `task ${e.nameId} has no ${part} yet; start from the template: flume task template ${part}`,
          );
        return [200, { part, text }];
      }
      if (method === "PUT") {
        if (typeof body.text !== "string") throw new HttpError(400, "text is required");
        const u = bad(() => writePart(root, e.nameId, part, body.text as string));
        log(u, "write", { part });
        commit(e.nameId, `write ${part}`, [u.path]);
        return [200, taskObject(u)];
      }
      const u = bad(() => removePart(root, e.nameId, part));
      log(u, "remove", { part });
      commit(e.nameId, `remove ${part}`, [u.path]);
      return [200, taskObject(u)];
    }
    if (parts.length === 3 || (parts.length === 4 && c !== undefined)) {
      const ref = id as string;
      if (parts.length === 3) {
        allow("GET", "PATCH");
        const e = find(ref);
        if (method === "GET") return [200, taskObject(e)];
        const unknown = Object.keys(body).filter(
          (k) => !(PATCH_FIELDS as readonly string[]).includes(k),
        );
        if (unknown.length) throw new HttpError(400, `unknown field ${unknown[0]}`);
        const was = taskObject(e) as Json;
        const u = bad(() => updateTask(root, ref, body));
        const now = taskObject(u) as Json;
        for (const k of Object.keys(body))
          if (JSON.stringify(was[k]) !== JSON.stringify(now[k]))
            log(u, "update", { field: k, from: was[k], to: now[k] });
        commit(u.nameId, `update ${Object.keys(body).join(", ")}`, [u.path]);
        return [200, taskObject(u)];
      }
      if (c === "comments") {
        allow("POST");
        const e = find(ref);
        const author =
          typeof body.author === "string" && body.author.trim() !== ""
            ? body.author.trim()
            : userInfo().username;
        const u = bad(() => addComment(root, ref, body.text as string, author));
        log(u, "comment");
        commit(e.nameId, "add a comment", [u.path]);
        return [200, taskObject(u)];
      }
      if (c === "assign") {
        allow("POST");
        const e = find(ref);
        const { assignee, actor, force } = body;
        if (typeof assignee !== "string") throw new HttpError(400, "assignee is required");
        if (actor !== undefined && typeof actor !== "string")
          throw new HttpError(400, "actor must be a string");
        const r = bad(() => assignTask(root, ref, assignee, actor, force === true));
        if (r.changed) {
          log(r.entry, "assign", {
            field: "assignee",
            from: taskObject(e).assignee,
            to: assignee,
          });
          commit(e.nameId, `assign to ${assignee}`, [e.path]);
        }
        return [200, taskObject(r.entry)];
      }
      if (c === "close" || c === "reopen") {
        allow("POST");
        const e = find(ref);
        if (c === "close" && e.state === "resolved")
          throw new HttpError(409, `task ${ref} is already resolved`);
        if (c === "reopen" && e.state === "open")
          throw new HttpError(409, `task ${ref} is already open`);
        let dropped: string | undefined;
        if (c === "close" && body.dropped !== undefined) {
          if (typeof body.dropped !== "string" || body.dropped.trim() === "")
            throw new HttpError(400, "dropped needs a reason");
          dropped = body.dropped.trim();
        }
        if (dropped !== undefined) {
          const author =
            typeof body.author === "string" && body.author.trim() !== ""
              ? body.author.trim()
              : userInfo().username;
          bad(() => addComment(root, ref, dropped as string, author));
        }
        const u =
          c === "close"
            ? bad(() =>
                resolveTask(root, ref, new Date(), dropped === undefined ? "done" : "dropped"),
              )
            : reopenTask(root, ref);
        log(u, c, c === "close" ? { resolution: dropped === undefined ? "done" : "dropped" } : {});
        commit(e.nameId, c === "close" ? "close" : "reopen", [e.path, u.path]);
        return [200, taskObject(u)];
      }
    }
    throw new HttpError(404, `no such path ${url.pathname}`);
  };

  const send = (res: ServerResponse, status: number, payload: unknown) => {
    const text = JSON.stringify(payload);
    res.writeHead(status, {
      "content-type": "application/json; charset=utf-8",
      "content-length": Buffer.byteLength(text),
    });
    res.end(text);
  };

  // Browser attacks: DNS rebinding (foreign Host) and cross-site writes (foreign Origin).
  const guard = (req: IncomingMessage) => {
    const { port } = server.address() as AddressInfo;
    const own = [`127.0.0.1:${port}`, `localhost:${port}`];
    if (!own.includes(req.headers.host ?? "")) throw new HttpError(403, "foreign Host header");
    const origin = req.headers.origin;
    if (origin !== undefined && req.method !== "GET" && req.method !== "HEAD") {
      if (!own.some((h) => origin === `http://${h}`))
        throw new HttpError(403, "foreign Origin header");
    }
  };

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const chunks: Buffer[] = [];
    req.on("data", (d: Buffer) => chunks.push(d));
    req.on("end", () => {
      try {
        guard(req);
        const who = req.headers["x-flume-agent"];
        if (typeof who === "string" && who) {
          try {
            touchSeen(who);
          } catch {}
        }
        const url = new URL(req.url ?? "/", "http://127.0.0.1");
        const raw = Buffer.concat(chunks).toString("utf8");
        let body: Json = {};
        if (raw.trim() !== "") {
          try {
            const j = JSON.parse(raw);
            if (j === null || typeof j !== "object" || Array.isArray(j)) throw new Error();
            body = j as Json;
          } catch {
            throw new HttpError(400, "the request body is not a JSON object");
          }
        }
        const [status, payload] = handle(req.method ?? "GET", url, body, actorOf(req));
        if (url.pathname === "/api/stop") {
          res.on("finish", () => opts.onStop?.());
        }
        send(res, status, payload);
      } catch (e) {
        if (e instanceof HttpError) send(res, e.status, { error: e.message });
        else send(res, 500, { error: (e as Error).message });
      }
    });
  });

  return new Promise((resolveStart, reject) => {
    server.once("error", reject);
    server.listen(opts.port ?? 0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolveStart({
        server,
        url: `http://127.0.0.1:${port}`,
        close: () =>
          new Promise<void>((done) => {
            server.close(() => done());
            server.closeAllConnections();
          }),
      });
    });
  });
}
