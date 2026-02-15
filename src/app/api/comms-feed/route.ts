import { NextRequest } from "next/server";
import path from "path";
import { resolveWorkspace, resolveWorkspacePath } from "@/lib/workspace-path";
import { safeReadFile } from "@/lib/safe-fs";
import { apiSuccess } from "@/lib/api-response";

export const runtime = "nodejs";

type FeedItem = {
  id: string;
  source: "telegram" | "discord" | "system";
  content: string;
  createdAt?: string;
};

function parseJsonl(content: string, prefix: string, source: FeedItem["source"]): FeedItem[] {
  const items: FeedItem[] = [];
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  lines.forEach((line, i) => {
    try {
      const o = JSON.parse(line) as Record<string, unknown>;
      const text = o?.content ?? o?.text ?? o?.message ?? "";
      const createdAt = o?.createdAt ?? o?.timestamp ?? o?.date;
      items.push({
        id: `${prefix}-${i}`,
        source,
        content: typeof text === "string" ? text : String(text),
        createdAt: createdAt != null ? String(createdAt) : undefined,
      });
    } catch {
      // skip
    }
  });
  return items;
}

export async function GET(request: NextRequest) {
  const ws = request.nextUrl.searchParams.get("ws") ?? undefined;
  const workspace = resolveWorkspace(ws);
  const base = resolveWorkspacePath(ws);
  if (base === "") {
    return apiSuccess({ workspace, feed: [], error: "OPENCLAW_ROOT_PATH is not set" });
  }

  const all: FeedItem[] = [];
  const sources: Array<{ path: string; source: FeedItem["source"]; prefix: string }> = [
    { path: "telegram/messages.jsonl", source: "telegram", prefix: "tg" },
    { path: "discord/messages.jsonl", source: "discord", prefix: "dc" },
    { path: "logs/notifications.jsonl", source: "system", prefix: "log" },
  ];

  for (const { path: relPath, source, prefix } of sources) {
    try {
      const fullPath = path.join(base, relPath);
      const content = await safeReadFile(fullPath);
      all.push(...parseJsonl(content, prefix, source));
    } catch {
      continue;
    }
  }

  try {
    const notifPath = path.join(base, "state", "notifications.json");
    const raw = await safeReadFile(notifPath);
    const data = JSON.parse(raw) as { notifications?: Array<Record<string, unknown>> };
    const list = Array.isArray(data?.notifications) ? data.notifications : [];
    list.forEach((o, i) => {
      const text = o?.content ?? o?.text ?? o?.message ?? "";
      all.push({
        id: `sys-${i}`,
        source: "system",
        content: typeof text === "string" ? text : String(text),
        createdAt: o?.createdAt != null ? String(o.createdAt) : undefined,
      });
    });
  } catch {
    // skip
  }

  all.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
  const feed = all.slice(0, 50);
  return apiSuccess({ workspace, feed });
}
