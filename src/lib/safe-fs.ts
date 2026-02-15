import fs from "fs/promises";
import path from "path";
import { getOpenClawRootPath } from "./workspace-path";

const BLOCKED_SEGMENTS = new Set([
  "credentials",
  ".ssh",
  ".env",
  "identity",
  "tokens",
  "secrets",
]);

/**
 * Returns true only if fullPath is under OPENCLAW_ROOT_PATH and
 * contains none of: credentials, .ssh, .env, identity, tokens, secrets.
 */
export function isPathAllowed(fullPath: string): boolean {
  const root = getOpenClawRootPath();
  if (root === "") return false;

  const resolved = path.resolve(fullPath);
  const resolvedRoot = path.resolve(root);
  if (!resolved.startsWith(resolvedRoot)) return false;

  const relative = path.relative(resolvedRoot, resolved);
  const segments = relative.split(path.sep).filter(Boolean);
  for (const segment of segments) {
    if (BLOCKED_SEGMENTS.has(segment)) return false;
  }
  return true;
}

/**
 * Reads file as UTF-8 if path is allowed. Throws if blocked or not under root.
 */
export async function safeReadFile(fullPath: string): Promise<string> {
  if (!isPathAllowed(fullPath)) {
    throw new Error(`Path not allowed: ${fullPath}`);
  }
  return fs.readFile(fullPath, "utf-8");
}

/**
 * Reads file and parses as JSON. Throws if blocked or invalid JSON.
 */
export async function safeReadJson<T = unknown>(fullPath: string): Promise<T> {
  const content = await safeReadFile(fullPath);
  return JSON.parse(content) as T;
}

/**
 * Writes file (UTF-8) if path is allowed. Throws if blocked or not under root.
 * Creates parent directories if needed.
 */
export async function safeWriteFile(
  fullPath: string,
  content: string
): Promise<void> {
  if (!isPathAllowed(fullPath)) {
    throw new Error(`Path not allowed: ${fullPath}`);
  }
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, "utf-8");
}

/**
 * Lists directory entries with mtime. Returns names and mtime for sorting.
 * Throws if path not allowed.
 */
export async function safeListDir(
  dirPath: string
): Promise<Array<{ name: string; mtime: number }>> {
  if (!isPathAllowed(dirPath)) {
    throw new Error(`Path not allowed: ${dirPath}`);
  }
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const result: Array<{ name: string; mtime: number }> = [];
  for (const e of entries) {
    if (!e.isFile()) continue;
    const full = path.join(dirPath, e.name);
    if (!isPathAllowed(full)) continue;
    try {
      const stat = await fs.stat(full);
      result.push({ name: e.name, mtime: stat.mtimeMs });
    } catch {
      // skip unreadable
    }
  }
  return result;
}

/**
 * Lists directory entries (files and directories). Throws if path not allowed.
 */
export async function safeReadDir(
  dirPath: string
): Promise<Array<{ name: string; isFile: boolean; isDirectory: boolean }>> {
  if (!isPathAllowed(dirPath)) {
    throw new Error(`Path not allowed: ${dirPath}`);
  }
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries.map((e) => ({
    name: e.name,
    isFile: e.isFile(),
    isDirectory: e.isDirectory(),
  }));
}

/**
 * Stats a path if allowed. Throws if blocked or not under root.
 */
export async function safeStat(
  fullPath: string
): Promise<{ mtime: number; size: number; isFile: boolean }> {
  if (!isPathAllowed(fullPath)) {
    throw new Error(`Path not allowed: ${fullPath}`);
  }
  const stat = await fs.stat(fullPath);
  return {
    mtime: stat.mtimeMs,
    size: stat.size,
    isFile: stat.isFile(),
  };
}

/**
 * Reads last N lines from file (efficient tail). Throws if path not allowed.
 */
export async function safeReadLines(
  fullPath: string,
  maxLines: number
): Promise<string[]> {
  const content = await safeReadFile(fullPath);
  const lines = content.split(/\r?\n/).filter((l) => l.length > 0);
  return lines.slice(-maxLines);
}

/**
 * Resolves relativePath against workspace base. Returns full path only if
 * result is inside base and allowed. Throws otherwise.
 */
export function safeResolvePath(
  workspaceBase: string,
  relativePath: string
): string {
  const normalized = path.normalize(path.join(workspaceBase, relativePath));
  const resolved = path.resolve(normalized);
  const baseResolved = path.resolve(workspaceBase);
  if (!resolved.startsWith(baseResolved)) {
    throw new Error(`Path escapes workspace: ${relativePath}`);
  }
  if (!isPathAllowed(resolved)) {
    throw new Error(`Path not allowed: ${resolved}`);
  }
  return resolved;
}
