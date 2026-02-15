import { NextRequest } from "next/server";
import path from "path";
import { resolveWorkspace, resolveWorkspacePath } from "@/lib/workspace-path";
import { safeReadJson } from "@/lib/safe-fs";
import { apiSuccess, apiError } from "@/lib/api-response";

export const runtime = "nodejs";

type RevenueJson = {
  current?: number;
  monthlyBurn?: number;
  net?: number;
  currency?: string;
  [key: string]: unknown;
};

export async function GET(request: NextRequest) {
  const ws = request.nextUrl.searchParams.get("ws") ?? undefined;
  const workspace = resolveWorkspace(ws);
  const base = resolveWorkspacePath(ws);
  if (base === "") {
    return apiSuccess({
      workspace,
      revenue: null,
      error: "OPENCLAW_ROOT_PATH is not set",
    });
  }

  let revenue: {
    current?: number;
    monthlyBurn?: number;
    net?: number;
    currency?: string;
  } | null = null;

  try {
    const revenuePath = path.join(base, "state", "revenue.json");
    const data = (await safeReadJson(revenuePath)) as RevenueJson;
    revenue = {
      current: typeof data.current === "number" ? data.current : undefined,
      monthlyBurn: typeof data.monthlyBurn === "number" ? data.monthlyBurn : undefined,
      net: typeof data.net === "number" ? data.net : undefined,
      currency: data.currency != null ? String(data.currency) : undefined,
    };
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? (err as NodeJS.ErrnoException).code : null;
    if (code !== "ENOENT" && !String(err).includes("Path not allowed")) {
      return apiError(String(err), 500, { workspace, revenue: null });
    }
  }

  return apiSuccess({ workspace, revenue });
}
