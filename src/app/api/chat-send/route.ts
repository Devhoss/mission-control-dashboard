import { NextRequest } from "next/server";
import path from "path";
import { resolveWorkspace, resolveWorkspacePath } from "@/lib/workspace-path";
import { safeWriteFile, isPathAllowed } from "@/lib/safe-fs";
import { apiSuccess, apiError } from "@/lib/api-response";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const QUEUE_DIR = "delivery-queue";
const QUEUE_FILE = "outbound-messages.jsonl";

export async function POST(request: NextRequest) {
  const ws = request.nextUrl.searchParams.get("ws") ?? undefined;
  const workspace = resolveWorkspace(ws);
  const base = resolveWorkspacePath(ws);
  if (base === "") {
    return apiError("OPENCLAW_ROOT_PATH is not set", 400);
  }

  let body: { content?: string; channel?: string; to?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) {
    return apiError("Missing content", 400);
  }

  const channel =
    body?.channel === "telegram" || body?.channel === "discord" || body?.channel === "webchat"
      ? body.channel
      : "webchat";
  const to = body?.to != null ? String(body.to) : undefined;

  const queueDir = path.join(base, QUEUE_DIR);
  const queuePath = path.join(queueDir, QUEUE_FILE);
  if (!isPathAllowed(queuePath)) {
    return apiError("Queue path not allowed", 403);
  }

  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const line = JSON.stringify({
    id,
    createdAt,
    content,
    channel,
    ...(to !== undefined && { to }),
    status: "queued",
  }) + "\n";

  try {
    const fs = await import("fs/promises");
    await fs.mkdir(queueDir, { recursive: true });
    await fs.appendFile(queuePath, line, "utf-8");
  } catch (err) {
    return apiError(String(err), 500);
  }

  return apiSuccess({
    id,
    createdAt,
    content,
    channel,
    to,
    status: "queued",
  });
}
