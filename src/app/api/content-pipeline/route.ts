import { NextRequest } from "next/server";
import path from "path";
import { resolveWorkspace, resolveWorkspacePath } from "@/lib/workspace-path";
import { safeReadFile } from "@/lib/safe-fs";
import { apiSuccess, apiError } from "@/lib/api-response";

export const runtime = "nodejs";

function parseQueueMarkdown(content: string): {
  draft: number;
  review: number;
  approved: number;
  published: number;
} {
  const lines = content.split(/\r?\n/);
  let draft = 0;
  let review = 0;
  let approved = 0;
  let published = 0;
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes("draft")) draft++;
    else if (lower.includes("review")) review++;
    else if (lower.includes("approved")) approved++;
    else if (lower.includes("published") || (lower.includes("[x]") && !lower.includes("published"))) published++;
  }
  return { draft, review, approved, published };
}

export async function GET(request: NextRequest) {
  const ws = request.nextUrl.searchParams.get("ws") ?? undefined;
  const workspace = resolveWorkspace(ws);
  const base = resolveWorkspacePath(ws);
  if (base === "") {
    return apiSuccess({
      workspace,
      columns: { draft: 0, review: 0, approved: 0, published: 0 },
      error: "OPENCLAW_ROOT_PATH is not set",
    });
  }

  const emptyColumns = { draft: 0, review: 0, approved: 0, published: 0 };

  try {
    const queuePath = path.join(base, "content", "queue.md");
    const content = await safeReadFile(queuePath);
    const columns = parseQueueMarkdown(content);
    const rawPreview = content.slice(0, 500);
    return apiSuccess({
      workspace,
      columns,
      rawPreview,
    });
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? (err as NodeJS.ErrnoException).code : null;
    if (code === "ENOENT" || String(err).includes("Path not allowed")) {
      return apiSuccess({
        workspace,
        columns: emptyColumns,
      });
    }
    return apiError(String(err), 500, {
      workspace,
      columns: emptyColumns,
    });
  }
}
