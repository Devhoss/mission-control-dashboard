import { NextRequest } from "next/server";
import path from "path";
import { resolveWorkspace, resolveWorkspacePath } from "@/lib/workspace-path";
import { safeReadJson, safeReadFile, safeListDir } from "@/lib/safe-fs";
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

async function tryRead(
  base: string,
  candidates: string[]
): Promise<string | undefined> {
  for (const p of candidates) {
    const full = path.join(base, p);
    try {
      return await safeReadFile(full);
    } catch {
      continue;
    }
  }
  return undefined;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ws = request.nextUrl.searchParams.get("ws") ?? undefined;
  const workspace = resolveWorkspace(ws);
  const base = resolveWorkspacePath(ws);
  if (base === "") {
    return apiSuccess({
      workspace,
      agent: null,
      error: "OPENCLAW_ROOT_PATH is not set",
    });
  }

  let agentRecord: AgentEntry | null = null;
  try {
    const registryPath = path.join(base, "agents", "registry.json");
    const data = (await safeReadJson(registryPath)) as RegistryJson;
    const list = Array.isArray(data.agents) ? data.agents : [];
    agentRecord =
      list.find((a) => String(a?.id) === id || String(a?.name) === id) ?? null;
  } catch {
    return apiSuccess({ workspace, agent: null });
  }

  if (!agentRecord) {
    return apiSuccess({ workspace, agent: null });
  }

  const name = String(agentRecord.name ?? agentRecord.id ?? id);
  const idLower = id.toLowerCase();
  const nameLower = name.toLowerCase();

  const soulCandidates = [
    `agents/${id}/SOUL.md`,
    `agents/${id}/RULES.md`,
    `agents/${idLower}/SOUL.md`,
    `agents/${idLower}/RULES.md`,
    `agents/${name}/SOUL.md`,
    `agents/${name}/RULES.md`,
    `agents/${nameLower}/SOUL.md`,
    `agents/${nameLower}/RULES.md`,
  ];
  const soulPaths = soulCandidates.filter((p) => p.endsWith("SOUL.md"));
  const rulesPaths = soulCandidates.filter((p) => p.endsWith("RULES.md"));

  const soulMarkdown = await tryRead(base, soulPaths);
  const rulesMarkdown = await tryRead(base, rulesPaths);

  const outputs: Array<{ file: string; updatedAt?: string; preview: string }> = [];
  const outputsDir = path.join(base, "shared-context", "agent-outputs");
  try {
    const entries = await safeListDir(outputsDir);
    entries.sort((a, b) => b.mtime - a.mtime);
    const top10 = entries.slice(0, 10);
    for (const e of top10) {
      const full = path.join(outputsDir, e.name);
      let preview = "";
      try {
        const content = await safeReadFile(full);
        preview = content.slice(0, 300).replace(/\n/g, " ");
      } catch {
        preview = "[unable to read]";
      }
      outputs.push({
        file: e.name,
        updatedAt: new Date(e.mtime).toISOString(),
        preview,
      });
    }
  } catch {
    // directory missing or not allowed
  }

  const agent = {
    id: String(agentRecord.id ?? id),
    name: String(agentRecord.name ?? name),
    role: agentRecord.role != null ? String(agentRecord.role) : undefined,
    model: agentRecord.model != null ? String(agentRecord.model) : undefined,
    level: agentRecord.level != null ? String(agentRecord.level) : undefined,
    status: agentRecord.status != null ? String(agentRecord.status) : undefined,
    soulMarkdown,
    rulesMarkdown,
    outputs,
  };

  return apiSuccess({ workspace, agent });
}
