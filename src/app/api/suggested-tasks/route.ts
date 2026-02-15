import { NextRequest } from "next/server";
import path from "path";
import { resolveWorkspace, resolveWorkspacePath } from "@/lib/workspace-path";
import { safeReadJson, safeWriteFile } from "@/lib/safe-fs";
import { apiSuccess, apiError } from "@/lib/api-response";

export const runtime = "nodejs";

const CATEGORIES = [
  "Revenue",
  "Product",
  "Community",
  "Content",
  "Operations",
  "Clients",
  "Trading",
  "Brand",
] as const;

const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
const EFFORTS = ["XS", "S", "M", "L", "XL"] as const;
const STATUSES = ["pending", "approved", "rejected"] as const;

type Task = {
  id: string;
  category?: string;
  title?: string;
  reasoning?: string;
  nextAction?: string;
  priority?: string;
  effort?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

type SuggestedTasksJson = { tasks?: Task[]; [key: string]: unknown };

function normalizeCategory(c: string): (typeof CATEGORIES)[number] | undefined {
  return CATEGORIES.includes(c as (typeof CATEGORIES)[number])
    ? (c as (typeof CATEGORIES)[number])
    : undefined;
}

function normalizePriority(p: string): (typeof PRIORITIES)[number] | undefined {
  return PRIORITIES.includes(p as (typeof PRIORITIES)[number])
    ? (p as (typeof PRIORITIES)[number])
    : undefined;
}

function normalizeEffort(e: string): (typeof EFFORTS)[number] | undefined {
  return EFFORTS.includes(e as (typeof EFFORTS)[number])
    ? (e as (typeof EFFORTS)[number])
    : undefined;
}

function normalizeStatus(s: string): (typeof STATUSES)[number] | undefined {
  return STATUSES.includes(s as (typeof STATUSES)[number])
    ? (s as (typeof STATUSES)[number])
    : undefined;
}

function toApiTask(t: Task): {
  id: string;
  category: (typeof CATEGORIES)[number];
  title: string;
  reasoning?: string;
  nextAction?: string;
  priority?: (typeof PRIORITIES)[number];
  effort?: (typeof EFFORTS)[number];
  status?: (typeof STATUSES)[number];
  createdAt?: string;
} {
  return {
    id: String(t?.id ?? ""),
    category: normalizeCategory(String(t?.category ?? "Operations")) ?? "Operations",
    title: String(t?.title ?? ""),
    reasoning: t?.reasoning != null ? String(t.reasoning) : undefined,
    nextAction: t?.nextAction != null ? String(t.nextAction) : undefined,
    priority: normalizePriority(String(t?.priority ?? "")),
    effort: normalizeEffort(String(t?.effort ?? "")),
    status: normalizeStatus(String(t?.status ?? "pending")) ?? "pending",
    createdAt: t?.createdAt != null ? String(t.createdAt) : undefined,
  };
}

export async function GET(request: NextRequest) {
  const ws = request.nextUrl.searchParams.get("ws") ?? undefined;
  const workspace = resolveWorkspace(ws);
  const base = resolveWorkspacePath(ws);
  if (base === "") {
    return apiSuccess({
      workspace,
      tasks: [],
      error: "OPENCLAW_ROOT_PATH is not set",
    });
  }

  const tasks: ReturnType<typeof toApiTask>[] = [];

  try {
    const filePath = path.join(base, "state", "suggested-tasks.json");
    const data = (await safeReadJson(filePath)) as SuggestedTasksJson;
    const list = Array.isArray(data.tasks) ? data.tasks : [];
    for (const t of list) {
      tasks.push(toApiTask(t));
    }
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as NodeJS.ErrnoException).code
        : null;
    if (code !== "ENOENT" && !String(err).includes("Path not allowed")) {
      return apiError(String(err), 500, { workspace, tasks: [] });
    }
  }

  return apiSuccess({ workspace, tasks });
}

export async function POST(request: NextRequest) {
  const ws = request.nextUrl.searchParams.get("ws") ?? undefined;
  const workspace = resolveWorkspace(ws);
  const base = resolveWorkspacePath(ws);
  if (base === "") {
    return apiError("OPENCLAW_ROOT_PATH is not set", 400, {
      workspace,
      tasks: [],
    });
  }

  let body: { id?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const id = body?.id != null ? String(body.id).trim() : "";
  const action =
    body?.action === "approve" || body?.action === "reject" ? body.action : null;

  if (!id || !action) {
    return apiError("Missing or invalid id or action (approve | reject)", 400);
  }

  const filePath = path.join(base, "state", "suggested-tasks.json");
  let data: SuggestedTasksJson = { tasks: [] };

  try {
    data = (await safeReadJson(filePath)) as SuggestedTasksJson;
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as NodeJS.ErrnoException).code
        : null;
    if (code !== "ENOENT") {
      return apiError(String(err), 500);
    }
  }

  const list = Array.isArray(data.tasks) ? data.tasks : [];
  const task = list.find((t) => String(t?.id) === id);
  if (!task) {
    return apiError("Task not found", 404, { workspace, tasks: list.map(toApiTask) });
  }

  task.status = action === "approve" ? "approved" : "rejected";
  task.updatedAt = new Date().toISOString();

  try {
    await safeWriteFile(filePath, JSON.stringify({ tasks: list }, null, 2));
  } catch (err) {
    return apiError(String(err), 500);
  }

  return apiSuccess({
    workspace,
    tasks: list.map(toApiTask),
  });
}
