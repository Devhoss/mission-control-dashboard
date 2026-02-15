import { NextRequest } from "next/server";
import path from "path";
import { resolveWorkspace, resolveWorkspacePath } from "@/lib/workspace-path";
import { safeReadJson } from "@/lib/safe-fs";
import { apiSuccess, apiError } from "@/lib/api-response";

export const runtime = "nodejs";

type CronEntry = {
  name?: string;
  schedule?: string;
  lastRun?: string;
  lastStatus?: string;
  consecutiveErrors?: number;
  [key: string]: unknown;
};

type CronsJson = { crons?: CronEntry[]; [key: string]: unknown };

function normalizeCronStatus(
  s: string | undefined
): "success" | "error" | "unknown" {
  if (!s) return "unknown";
  const v = s.toLowerCase();
  if (v === "success" || v === "ok") return "success";
  if (v === "error" || v === "failed") return "error";
  return "unknown";
}

export async function GET(request: NextRequest) {
  const ws = request.nextUrl.searchParams.get("ws") ?? undefined;
  const workspace = resolveWorkspace(ws);
  const base = resolveWorkspacePath(ws);
  if (base === "") {
    return apiSuccess({
      workspace,
      crons: [],
      error: "OPENCLAW_ROOT_PATH is not set",
    });
  }

  const crons: Array<{
    name: string;
    schedule?: string;
    lastRun?: string;
    lastStatus?: "success" | "error" | "unknown";
    consecutiveErrors?: number;
  }> = [];

  try {
    const cronsPath = path.join(base, "state", "crons.json");
    const data = (await safeReadJson(cronsPath)) as CronsJson;
    const list = Array.isArray(data.crons) ? data.crons : [];
    for (const e of list) {
      crons.push({
        name: String(e?.name ?? "unknown"),
        schedule: e?.schedule != null ? String(e.schedule) : undefined,
        lastRun: e?.lastRun != null ? String(e.lastRun) : undefined,
        lastStatus: normalizeCronStatus(e?.lastStatus),
        consecutiveErrors:
          typeof e?.consecutiveErrors === "number"
            ? e.consecutiveErrors
            : undefined,
      });
    }
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as NodeJS.ErrnoException).code
        : null;
    if (code !== "ENOENT" && !String(err).includes("Path not allowed")) {
      return apiError(String(err), 500, { workspace, crons: [] });
    }
  }

  return apiSuccess({ workspace, crons });
}
