import { NextRequest } from "next/server";
import path from "path";
import { resolveWorkspace, resolveWorkspacePath } from "@/lib/workspace-path";
import { safeReadDir, safeStat, safeReadFile } from "@/lib/safe-fs";
import { apiSuccess, apiError } from "@/lib/api-response";

export const runtime = "nodejs";

type Status = "draft" | "review" | "approved" | "published";

function detectStatus(content: string): Status {
  const lower = content.toLowerCase();
  if (lower.includes("status: published")) return "published";
  if (lower.includes("status: approved")) return "approved";
  if (lower.includes("status: review")) return "review";
  if (lower.includes("status: draft")) return "draft";
  return "draft";
}

function detectPlatform(content: string): string | undefined {
  const match = content.match(/Platform:\s*(.+)/i);
  if (match) return match[1].trim();
  const lower = content.toLowerCase();
  if (lower.includes("twitter") || lower.includes("x.com")) return "twitter";
  if (lower.includes("youtube")) return "youtube";
  if (lower.includes("tiktok")) return "tiktok";
  if (lower.includes("instagram")) return "instagram";
  if (lower.includes("blog")) return "blog";
  return undefined;
}

function firstHeading(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

function stripMarkdownPreview(text: string, maxLen: number): string {
  const stripped = text
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\n+/g, " ")
    .trim();
  return stripped.slice(0, maxLen);
}

export async function GET(request: NextRequest) {
  const ws = request.nextUrl.searchParams.get("ws") ?? undefined;
  const workspace = resolveWorkspace(ws);
  const base = resolveWorkspacePath(ws);
  if (base === "") {
    return apiSuccess({
      workspace,
      drafts: [],
      error: "OPENCLAW_ROOT_PATH is not set",
    });
  }

  const draftsDir = path.join(base, "content", "drafts");
  const drafts: Array<{
    id: string;
    file: string;
    title: string;
    platform?: string;
    status: Status;
    preview: string;
    updatedAt?: string;
  }> = [];

  try {
    const entries = await safeReadDir(draftsDir);
    const mdFiles = entries.filter((e) => e.isFile && e.name.endsWith(".md"));
    for (const e of mdFiles) {
      const relativeFile = path.join("content", "drafts", e.name);
      const fullPath = path.join(base, relativeFile);
      try {
        const stat = await safeStat(fullPath);
        const content = await safeReadFile(fullPath);
        const id = e.name.replace(/\.md$/i, "");
        const title = firstHeading(content) || id;
        const status = detectStatus(content);
        const platform = detectPlatform(content);
        const preview = stripMarkdownPreview(content, 200);
        drafts.push({
          id,
          file: relativeFile,
          title,
          platform,
          status,
          preview,
          updatedAt: new Date(stat.mtime).toISOString(),
        });
      } catch {
        continue;
      }
    }
  } catch {
    // directory missing
  }

  return apiSuccess({ workspace, drafts });
}
