import { NextRequest } from "next/server";
import path from "path";
import { resolveWorkspace, resolveWorkspacePath } from "@/lib/workspace-path";
import { safeReadFile } from "@/lib/safe-fs";
import { apiSuccess, apiError } from "@/lib/api-response";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const ws = request.nextUrl.searchParams.get("ws") ?? undefined;
  const workspace = resolveWorkspace(ws);
  const base = resolveWorkspacePath(ws);
  if (base === "") {
    return apiSuccess({
      workspace,
      markdown: "",
      preview: "",
      error: "OPENCLAW_ROOT_PATH is not set",
    });
  }

  try {
    const filePath = path.join(base, "shared-context", "priorities.md");
    const markdown = await safeReadFile(filePath);
    const preview = markdown.slice(0, 500);
    return apiSuccess({ workspace, markdown, preview });
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as NodeJS.ErrnoException).code
        : null;
    if (code === "ENOENT" || String(err).includes("Path not allowed")) {
      return apiSuccess({ workspace, markdown: "", preview: "" });
    }
    return apiError(String(err), 500, {
      workspace,
      markdown: "",
      preview: "",
    });
  }
}
