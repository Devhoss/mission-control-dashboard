import { NextRequest } from "next/server";
import fs from "fs/promises";
import { getOpenClawRootPath, resolveWorkspace } from "@/lib/workspace-path";
import { apiSuccess, apiError } from "@/lib/api-response";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const ws = request.nextUrl.searchParams.get("ws") ?? undefined;
  const workspace = resolveWorkspace(ws);
  const root = getOpenClawRootPath();
  if (root === "") {
    return apiSuccess({
      workspaces: [],
      workspace,
      error: "OPENCLAW_ROOT_PATH is not set",
    });
  }

  try {
    const entries = await fs.readdir(root, { withFileTypes: true });
    const workspaces = entries
      .filter((e) => e.isDirectory() && e.name.startsWith("workspace-"))
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));

    return apiSuccess({ workspaces, workspace });
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? (err as NodeJS.ErrnoException).code : null;
    if (code === "ENOENT" || code === "ENOTDIR") {
      return apiSuccess({ workspaces: [], workspace });
    }
    return apiError(String(err), 500, { workspaces: [], workspace });
  }
}
