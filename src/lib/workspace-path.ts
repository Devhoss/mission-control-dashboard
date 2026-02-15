import path from "path";

const OPENCLAW_ROOT_ENV = "OPENCLAW_ROOT_PATH";
const DEFAULT_WORKSPACE_ENV = "DEFAULT_WORKSPACE";

const DEFAULT_ROOT_FALLBACK = "/root/.openclaw";
const DEFAULT_WORKSPACE_FALLBACK = "workspace-main";

/**
 * Root path for OpenClaw data (from OPENCLAW_ROOT_PATH).
 * Empty string if not set.
 */
export function getOpenClawRootPath(): string {
  const value = process.env[OPENCLAW_ROOT_ENV];
  if (value == null || value.trim() === "") return "";
  return path.resolve(value.trim());
}

/**
 * Default workspace name (from DEFAULT_WORKSPACE).
 */
export function getDefaultWorkspace(): string {
  const value = process.env[DEFAULT_WORKSPACE_ENV];
  if (value == null || value.trim() === "") return DEFAULT_WORKSPACE_FALLBACK;
  return value.trim();
}

/**
 * Resolves to a workspace name. Uses ws if provided and non-empty, else default.
 */
export function resolveWorkspace(ws?: string): string {
  const name = ws != null ? ws.trim() : "";
  return name !== "" ? name : getDefaultWorkspace();
}

/**
 * Full filesystem path for a workspace: path.join(OPENCLAW_ROOT_PATH, workspace).
 */
export function resolveWorkspacePath(ws?: string): string {
  const root = getOpenClawRootPath();
  if (root === "") return "";
  const workspace = resolveWorkspace(ws);
  return path.join(root, workspace);
}
