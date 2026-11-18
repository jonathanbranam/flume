import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { userInfo } from "node:os";
import { version } from "../cli/version.ts";
import { touchSeen } from "../core/agents.ts";
import {
  addComment,
  checkProject,
  createTask,
  listGuides,
  listTaskFiles,
  PATCH_FIELDS,
  readGuide,
  readRoadmap,
  reopenTask,
  resolveRef,
  resolveTask,
  roadmapPath,
  roadmapView,
  SEGMENT_RE,
  type TaskEntry,
  taskObject,
  updateTask,
  workflowText,
} from "../core/index.ts";
import { commitPaths, inRepo } from "./git.ts";

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
      throw new HttpError(400, (e as Error).message);
    }
  };

  const handle = (method: string, url: URL, body: Json): [number, unknown] => {
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
      return [
        200,
        {
          text: bad(() => workflowText(root, project, role)),
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
      if (!r.ok) throw new HttpError(400, r.error);
      return [200, r.guide];
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
        commit(e.nameId, `create ${title}`, [e.path]);
        return [201, taskObject(e)];
      }
      const state = url.searchParams.get("state") ?? "open";
      if (!["open", "resolved", "all"].includes(state))
        throw new HttpError(400, "state must be open, resolved or all");
      const kind = url.searchParams.get("kind");
      const parent = url.searchParams.get("parent");
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
          (t) => (kind === null || t.kind === kind) && (parentId === null || t.parent === parentId),
        )
        .sort((x, y) => x.created.localeCompare(y.created) || x.id.localeCompare(y.id));
      return [200, tasks];
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
        const u = bad(() => updateTask(root, ref, body));
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
        commit(e.nameId, "add a comment", [u.path]);
        return [200, taskObject(u)];
      }
      if (c === "close" || c === "reopen") {
        allow("POST");
        const e = find(ref);
        if (c === "close" && e.state === "resolved")
          throw new HttpError(409, `task ${ref} is already resolved`);
        if (c === "reopen" && e.state === "open")
          throw new HttpError(409, `task ${ref} is already open`);
        const u = c === "close" ? resolveTask(root, ref) : reopenTask(root, ref);
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
        const [status, payload] = handle(req.method ?? "GET", url, body);
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
