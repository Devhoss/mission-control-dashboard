import { NextRequest } from "next/server";
import { resolveWorkspace, resolveWorkspacePath } from "@/lib/workspace-path";
import { safeResolvePath, safeReadFile, safeWriteFile } from "@/lib/safe-fs";
import { apiSuccess, apiError } from "@/lib/api-response";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const ws = request.nextUrl.searchParams.get("ws") ?? undefined;
  const fileParam = request.nextUrl.searchParams.get("file");
  const workspace = resolveWorkspace(ws);
  const base = resolveWorkspacePath(ws);
  if (base === "") return apiError("OPENCLAW_ROOT_PATH is not set", 400);
  if (!fileParam?.trim()) return apiError("Missing file param", 400);
  try {
    const fullPath = safeResolvePath(base, fileParam.trim());
    const content = await safeReadFile(fullPath);
    return apiSuccess({ workspace, file: fileParam, content });
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? (err as NodeJS.ErrnoException).code : null;
    if (code === "ENOENT") return apiError("File not found", 404);
    return apiError(String(err), 400);
  }
}

export async function POST(request: NextRequest) {
  const ws = request.nextUrl.searchParams.get("ws") ?? undefined;
  const fileParam = request.nextUrl.searchParams.get("file");
  const workspace = resolveWorkspace(ws);
  const base = resolveWorkspacePath(ws);
  if (base === "") return apiError("OPENCLAW_ROOT_PATH is not set", 400);
  if (!fileParam?.trim()) return apiError("Missing file param", 400);
  let body: { content?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }
  const content = typeof body?.content === "string" ? body.content : "";
  try {
    const fullPath = safeResolvePath(base, fileParam.trim());
    await safeWriteFile(fullPath, content);
    return apiSuccess({ workspace, file: fileParam, content });
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? (err as NodeJS.ErrnoException).code : null;
    if (code === "ENOENT") return apiError("Parent path not found", 404);
    return apiError(String(err), 400);
  }
}
