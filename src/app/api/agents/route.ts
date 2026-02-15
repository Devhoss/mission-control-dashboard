import { NextRequest } from "next/server";
import path from "path";
import { resolveWorkspace, resolveWorkspacePath } from "@/lib/workspace-path";
import { safeReadJson } from "@/lib/safe-fs";
import { apiSuccess, apiError } from "@/lib/api-response";

export const runtime = "nodejs";

type AgentEntry = {
  id?: string;
  name?: string;
  role?: string;
  model?: string;
  level?: string;
  status?: string;
  [key: string]: unknown;
};

type RegistryJson = { agents?: AgentEntry[]; [key: string]: unknown };

function normalizeStatus(s: string | undefined): "healthy" | "unhealthy" | "unknown" {
  if (!s) return "unknown";
  const v = s.toLowerCase();
  if (v === "healthy" || v === "up" || v === "ok") return "healthy";
  if (v === "unhealthy" || v === "down" || v === "error") return "unhealthy";
  return "unknown";
}

function normalizeLevel(l: string | undefined): "L1" | "L2" | "L3" | "L4" | undefined {
  if (!l) return undefined;
  const v = l.toUpperCase();
  if (v === "L1" || v === "L2" || v === "L3" || v === "L4") return v as "L1" | "L2" | "L3" | "L4";
  return undefined;
}

export async function GET(request: NextRequest) {
  const ws = request.nextUrl.searchParams.get("ws") ?? undefined;
  const workspace = resolveWorkspace(ws);
  const base = resolveWorkspacePath(ws);
  if (base === "") {
    return apiSuccess({
      workspace,
      agents: [],
      summary: { total: 0, healthy: 0, unhealthy: 0 },
      error: "OPENCLAW_ROOT_PATH is not set",
    });
  }

  const agents: Array<{
    id: string;
    name: string;
    role?: string;
    model?: string;
    level?: "L1" | "L2" | "L3" | "L4";
    status?: "healthy" | "unhealthy" | "unknown";
  }> = [];

  try {
    const registryPath = path.join(base, "agents", "registry.json");
    const data = (await safeReadJson(registryPath)) as RegistryJson;
    const list = Array.isArray(data.agents) ? data.agents : [];
    for (const e of list) {
      agents.push({
        id: String(e?.id ?? "unknown"),
        name: String(e?.name ?? "unknown"),
        role: e?.role != null ? String(e.role) : undefined,
        model: e?.model != null ? String(e.model) : undefined,
        level: normalizeLevel(e?.level),
        status: normalizeStatus(e?.status),
      });
    }
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? (err as NodeJS.ErrnoException).code : null;
    if (code !== "ENOENT" && !String(err).includes("Path not allowed")) {
      return apiError(String(err), 500, {
        workspace,
        agents: [],
        summary: { total: 0, healthy: 0, unhealthy: 0 },
      });
    }
  }

  const healthy = agents.filter((a) => a.status === "healthy").length;
  const unhealthy = agents.filter((a) => a.status === "unhealthy").length;

  return apiSuccess({
    workspace,
    agents,
    summary: {
      total: agents.length,
      healthy,
      unhealthy,
    },
  });
}
