import { NextRequest } from "next/server";
import path from "path";
import { resolveWorkspace, resolveWorkspacePath } from "@/lib/workspace-path";
import { safeReadDir, safeStat, safeReadFile } from "@/lib/safe-fs";
import { apiSuccess } from "@/lib/api-response";

export const runtime = "nodejs";

type ClientStatus = "prospect" | "contacted" | "meeting" | "proposal" | "active";

function normalizeStatus(s: string): ClientStatus {
  const lower = s.toLowerCase();
  if (lower.includes("active")) return "active";
  if (lower.includes("proposal")) return "proposal";
  if (lower.includes("meeting")) return "meeting";
  if (lower.includes("contacted")) return "contacted";
  if (lower.includes("prospect")) return "prospect";
  return "prospect";
}

function parseField(content: string, label: string): string | undefined {
  const re = new RegExp(`${label}:\\s*([^\n]+)`, "i");
  const m = content.match(re);
  return m ? m[1].trim() : undefined;
}

function parseContacts(content: string): string[] {
  const raw = parseField(content, "Contact");
  if (!raw) return [];
  return raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
}

export async function GET(request: NextRequest) {
  const ws = request.nextUrl.searchParams.get("ws") ?? undefined;
  const workspace = resolveWorkspace(ws);
  const base = resolveWorkspacePath(ws);
  if (base === "") {
    return apiSuccess({
      workspace,
      clients: [],
      error: "OPENCLAW_ROOT_PATH is not set",
    });
  }

  const clientsDir = path.join(base, "clients");
  const clients: Array<{
    id: string;
    file: string;
    name: string;
    status: ClientStatus;
    contacts?: string[];
    lastInteraction?: string;
    nextAction?: string;
    preview?: string;
    updatedAt?: string;
  }> = [];

  try {
    const entries = await safeReadDir(clientsDir);
    const mdFiles = entries.filter((e) => e.isFile && e.name.endsWith(".md"));
    for (const e of mdFiles) {
      const relativeFile = path.join("clients", e.name);
      const fullPath = path.join(base, relativeFile);
      try {
        const stat = await safeStat(fullPath);
        const content = await safeReadFile(fullPath);
        const id = e.name.replace(/\.md$/i, "");
        const name = parseField(content, "Name") ?? content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? id;
        const statusRaw = parseField(content, "Status");
        const status = statusRaw ? normalizeStatus(statusRaw) : "prospect";
        const contacts = parseContacts(content);
        const lastInteraction = parseField(content, "Last Interaction");
        const nextAction = parseField(content, "Next Action");
        const preview = content.replace(/^#+\s+/gm, "").replace(/\n+/g, " ").trim().slice(0, 150);
        clients.push({
          id,
          file: relativeFile,
          name,
          status,
          contacts: contacts.length ? contacts : undefined,
          lastInteraction,
          nextAction,
          preview,
          updatedAt: new Date(stat.mtime).toISOString(),
        });
      } catch {
        continue;
      }
    }
  } catch {
    // directory missing
  }

  return apiSuccess({ workspace, clients });
}
