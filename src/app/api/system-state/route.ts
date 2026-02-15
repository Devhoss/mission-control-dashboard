import { NextRequest } from "next/server";
import path from "path";
import { resolveWorkspace, resolveWorkspacePath } from "@/lib/workspace-path";
import { safeReadJson } from "@/lib/safe-fs";
import { apiSuccess, apiError } from "@/lib/api-response";

export const runtime = "nodejs";

type ServerEntry = {
  name?: string;
  status?: string;
  port?: number;
  lastCheck?: string;
  message?: string;
};

type ServersJson = { servers?: ServerEntry[]; [key: string]: unknown };

type BranchCheckJson = {
  branch?: string;
  clean?: boolean;
  lastCommit?: string;
  lastChecked?: string;
  [key: string]: unknown;
};

function normalizeStatus(s: string | undefined): "up" | "down" | "unknown" {
  if (!s) return "unknown";
  const v = s.toLowerCase();
  if (v === "up" || v === "running" || v === "ok") return "up";
  if (v === "down" || v === "stopped" || v === "error") return "down";
  return "unknown";
}

export async function GET(request: NextRequest) {
  const ws = request.nextUrl.searchParams.get("ws") ?? undefined;
  const workspace = resolveWorkspace(ws);
  const base = resolveWorkspacePath(ws);
  if (base === "") {
    return apiSuccess({
      workspace,
      services: [],
      branch: null,
      error: "OPENCLAW_ROOT_PATH is not set",
    });
  }

  const services: Array<{
    name: string;
    status: "up" | "down" | "unknown";
    port?: number;
    lastCheck?: string;
    message?: string;
  }> = [];

  try {
    const serversPath = path.join(base, "state", "servers.json");
    const serversData = (await safeReadJson(serversPath)) as ServersJson;
    const list = Array.isArray(serversData.servers) ? serversData.servers : [];
    for (const e of list) {
      services.push({
        name: String(e?.name ?? "unknown"),
        status: normalizeStatus(e?.status),
        port: typeof e?.port === "number" ? e.port : undefined,
        lastCheck: e?.lastCheck ? String(e.lastCheck) : undefined,
        message: e?.message ? String(e.message) : undefined,
      });
    }
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as NodeJS.ErrnoException).code
        : null;
    if (code !== "ENOENT" && !String(err).includes("Path not allowed")) {
      return apiError(String(err), 500, {
        workspace,
        services: [],
        branch: null,
      });
    }
  }

  let branch: {
    branch?: string;
    clean?: boolean;
    lastCommit?: string;
    lastChecked?: string;
  } | null = null;

  try {
    const branchPath = path.join(base, "state", "branch-check.json");
    const branchData = (await safeReadJson(branchPath)) as BranchCheckJson;
    branch = {
      branch:
        branchData.branch != null ? String(branchData.branch) : undefined,
      clean:
        typeof branchData.clean === "boolean" ? branchData.clean : undefined,
      lastCommit:
        branchData.lastCommit != null
          ? String(branchData.lastCommit)
          : undefined,
      lastChecked:
        branchData.lastChecked != null
          ? String(branchData.lastChecked)
          : undefined,
    };
  } catch {
    // optional file
  }

  return apiSuccess({
    workspace,
    services,
    branch,
  });
}
