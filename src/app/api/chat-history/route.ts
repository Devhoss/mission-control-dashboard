import { NextRequest } from "next/server";
import path from "path";
import {
  resolveWorkspace,
  resolveWorkspacePath,
} from "@/lib/workspace-path";
import {
  safeReadDir,
  safeStat,
  safeReadFile,
  safeResolvePath,
} from "@/lib/safe-fs";
import { apiSuccess, apiError } from "@/lib/api-response";

export const runtime = "nodejs";

const CANDIDATE_DIRS = [
  "sessions",
  "logs",
  "shared-context/chat-history",
  "chat",
  "telegram",
  "discord",
];
const MAX_DEPTH = 4;
const CACHE_MS = 5000;

const cache = new Map<
  string,
  { data: SessionMeta[]; at: number }
>();

type SessionMeta = {
  id: string;
  file: string;
  channel?: string;
  updatedAt?: string;
  messageCount?: number;
  preview?: string;
};

async function findJsonlFiles(
  base: string,
  dir: string,
  depth: number,
  acc: { file: string; relative: string }[]
): Promise<void> {
  if (depth <= 0) return;
  const fullDir = path.join(base, dir);
  try {
    const entries = await safeReadDir(fullDir);
    for (const e of entries) {
      const rel = path.join(dir, e.name);
      if (e.isFile && e.name.endsWith(".jsonl")) {
        acc.push({ file: path.join(fullDir, e.name), relative: rel });
      } else if (e.isDirectory) {
        await findJsonlFiles(base, rel, depth - 1, acc);
      }
    }
  } catch {
    // dir missing or not allowed
  }
}

function parseChannelFromLines(lines: string[]): string | undefined {
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const o = JSON.parse(lines[i]) as { channel?: string };
      if (o.channel) return String(o.channel);
    } catch {
      continue;
    }
  }
  return undefined;
}

function previewFromLines(lines: string[]): string {
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const o = JSON.parse(lines[i]) as { content?: string };
      const c = o?.content;
      if (typeof c === "string" && c.trim()) {
        return c.slice(0, 120).replace(/\n/g, " ");
      }
    } catch {
      continue;
    }
  }
  return "";
}

export async function GET(request: NextRequest) {
  const ws = request.nextUrl.searchParams.get("ws") ?? undefined;
  const workspace = resolveWorkspace(ws);
  const base = resolveWorkspacePath(ws);
  if (base === "") {
    return apiSuccess({
      workspace,
      sessions: [],
      pagination: { page: 1, pageSize: 20, total: 0 },
      error: "OPENCLAW_ROOT_PATH is not set",
    });
  }

  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(request.nextUrl.searchParams.get("pageSize") ?? "20", 10) || 20));
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  const channelFilter = (request.nextUrl.searchParams.get("channel") ?? "").trim().toLowerCase();

  const cacheKey = `${workspace}:${q}:${channelFilter}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.at < CACHE_MS) {
    const total = cached.data.length;
    const start = (page - 1) * pageSize;
    const sessions = cached.data.slice(start, start + pageSize);
    return apiSuccess({
      workspace,
      sessions,
      pagination: { page, pageSize, total },
    });
  }

  const allFiles: { file: string; relative: string }[] = [];
  for (const d of CANDIDATE_DIRS) {
    await findJsonlFiles(base, d, MAX_DEPTH, allFiles);
  }

  const sessions: SessionMeta[] = [];
  for (const { file: fullPath, relative } of allFiles) {
    try {
      const stat = await safeStat(fullPath);
      if (!stat.isFile) continue;
      const content = await safeReadFile(fullPath);
      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const tail = lines.slice(-30);
      const channel = parseChannelFromLines(tail);
      const preview = previewFromLines(tail);
      if (channelFilter && channel?.toLowerCase() !== channelFilter) continue;
      if (q && !preview.toLowerCase().includes(q)) continue;
      sessions.push({
        id: relative.replace(/[/\\]/g, "_").replace(/\.jsonl$/i, "") || relative,
        file: relative,
        channel,
        updatedAt: new Date(stat.mtime).toISOString(),
        messageCount: Math.min(lines.length, 9999),
        preview: preview || undefined,
      });
    } catch {
      continue;
    }
  }

  sessions.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  cache.set(cacheKey, { data: sessions, at: now });

  const total = sessions.length;
  const start = (page - 1) * pageSize;
  const pageSessions = sessions.slice(start, start + pageSize);

  return apiSuccess({
    workspace,
    sessions: pageSessions,
    pagination: { page, pageSize, total },
  });
}
