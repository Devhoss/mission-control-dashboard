import { NextRequest } from "next/server";
import { resolveWorkspace, resolveWorkspacePath } from "@/lib/workspace-path";
import { safeResolvePath, safeReadFile } from "@/lib/safe-fs";
import { apiSuccess, apiError } from "@/lib/api-response";

export const runtime = "nodejs";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
  channel?: string;
};

function normalizeRole(r: unknown): "user" | "assistant" | "system" {
  const s = String(r ?? "").toLowerCase();
  if (s === "user" || s === "assistant" || s === "system") return s;
  return "user";
}

export async function GET(request: NextRequest) {
  const ws = request.nextUrl.searchParams.get("ws") ?? undefined;
  const fileParam = request.nextUrl.searchParams.get("file");
  const workspace = resolveWorkspace(ws);
  const base = resolveWorkspacePath(ws);
  if (base === "") {
    return apiSuccess({
      workspace,
      file: "",
      messages: [],
      error: "OPENCLAW_ROOT_PATH is not set",
    });
  }
  if (!fileParam || !fileParam.trim()) {
    return apiError("Missing file param", 400, { workspace, file: "", messages: [] });
  }

  const limit = Math.min(
    1000,
    Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") ?? "200", 10) || 200)
  );

  let fullPath: string;
  try {
    fullPath = safeResolvePath(base, fileParam.trim());
  } catch {
    return apiError("Invalid or disallowed file path", 400, {
      workspace,
      file: fileParam,
      messages: [],
    });
  }

  let content: string;
  try {
    content = await safeReadFile(fullPath);
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? (err as NodeJS.ErrnoException).code : null;
    if (code === "ENOENT") {
      return apiSuccess({ workspace, file: fileParam, messages: [] });
    }
    return apiError(String(err), 500, { workspace, file: fileParam, messages: [] });
  }

  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const parsed: Message[] = [];
  for (let i = 0; i < lines.length; i++) {
    try {
      const o = JSON.parse(lines[i]) as Record<string, unknown>;
      const role = normalizeRole(o?.role ?? o?.type);
      const contentStr = typeof o?.content === "string" ? o.content : String(o?.content ?? o?.text ?? "");
      const id = typeof o?.id === "string" ? o.id : `msg-${i}`;
      const createdAt = o?.createdAt != null ? String(o.createdAt) : o?.timestamp != null ? String(o.timestamp) : undefined;
      const channel = o?.channel != null ? String(o.channel) : undefined;
      parsed.push({
        id,
        role,
        content: contentStr,
        createdAt,
        channel,
      });
    } catch {
      // skip invalid JSON lines
    }
  }

  const messages = parsed.slice(-limit);

  return apiSuccess({
    workspace,
    file: fileParam,
    messages,
  });
}
