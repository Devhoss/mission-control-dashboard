"use client";

import { useEffect, useState } from "react";
import { ChevronDown, FolderOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";

export function WorkspaceSwitcher() {
  const { workspace, setWorkspace } = useWorkspace();
  const [workspaces, setWorkspaces] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    const url = workspace ? `/api/workspaces?ws=${encodeURIComponent(workspace)}` : "/api/workspaces";
    fetch(url)
      .then((res) => res.json())
      .then((json: { ok?: boolean; data?: { workspaces?: string[]; error?: string }; workspaces?: string[]; error?: string }) => {
        if (cancelled) return;
        const data = json.ok && json.data ? json.data : json;
        if (data.error) setError(data.error);
        setWorkspaces(Array.isArray(data.workspaces) ? data.workspaces : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(String(err));
          setWorkspaces([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [workspace]);

  const isLoading = workspaces === null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-8 min-w-[7rem] items-center justify-between gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-left text-xs font-medium text-[var(--color-foreground)] backdrop-blur-sm",
            "hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-white/20"
          )}
          aria-label="Switch workspace"
        >
          {isLoading ? (
            <span className="flex-1 animate-pulse text-[var(--color-foreground-muted)]">
              Loading…
            </span>
          ) : (
            <span className="truncate">{workspace}</span>
          )}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[11rem]">
        {isLoading && (
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="h-4 w-4 animate-pulse rounded bg-white/10" />
            <span className="text-xs text-[var(--color-foreground-muted)]">
              Loading workspaces…
            </span>
          </div>
        )}
        {!isLoading && workspaces?.length === 0 && (
          <div className="flex flex-col items-center gap-1 px-2 py-4 text-center">
            <FolderOpen className="h-8 w-8 text-[var(--color-foreground-muted)]" />
            <span className="text-xs text-[var(--color-foreground-muted)]">
              No workspaces found
            </span>
            {error && (
              <span className="text-[10px] text-red-400/80">{error}</span>
            )}
          </div>
        )}
        {!isLoading &&
          workspaces &&
          workspaces.length > 0 &&
          workspaces.map((ws) => (
            <DropdownMenuItem
              key={ws}
              onClick={() => setWorkspace(ws)}
              className={cn(
                "cursor-pointer",
                ws === workspace && "bg-primary/[0.12] text-primary"
              )}
            >
              {ws}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
