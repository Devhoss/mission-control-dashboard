"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Search,
  Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAutoRefreshQuery } from "@/hooks/use-auto-refresh";
import { cn } from "@/lib/utils";

const CATEGORY_EMOJI: Record<string, string> = {
  Revenue: "💰",
  Product: "📦",
  Community: "👥",
  Content: "📝",
  Operations: "⚙️",
  Clients: "🤝",
  Trading: "📈",
  Brand: "🏷️",
};

type Task = {
  id: string;
  category: string;
  title: string;
  reasoning?: string;
  nextAction?: string;
  priority?: string;
  effort?: string;
  status?: string;
  createdAt?: string;
};

type SuggestedTasksData = { workspace: string; tasks: Task[] };

export function SuggestedTasksView() {
  const { workspace } = useWorkspace();
  const query = workspace ? `?ws=${encodeURIComponent(workspace)}` : "";

  const { data, loading, error, refetch } = useAutoRefreshQuery<SuggestedTasksData>(
    `/api/suggested-tasks${query}`,
    { intervalMs: 15000 }
  );

  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchText, setSearchText] = useState("");

  const tasks = useMemo(() => data?.tasks ?? [], [data?.tasks]);
  const categories = useMemo(() => {
    const set = new Set(tasks.map((t) => t.category).filter(Boolean));
    return Array.from(set).sort();
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (
        searchText.trim() &&
        !t.title?.toLowerCase().includes(searchText.trim().toLowerCase())
      )
        return false;
      return true;
    });
  }, [tasks, statusFilter, categoryFilter, searchText]);

  const byCategory = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of filtered) {
      const cat = t.category || "Other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(t);
    }
    return map;
  }, [filtered]);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/suggested-tasks${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const json = await res.json();
      if (json.ok) await refetch();
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="h-9 w-full max-w-sm animate-pulse rounded-lg bg-white/10" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
                <div className="mt-2 h-3 w-full animate-pulse rounded bg-white/10" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
        <div className="relative flex-1 min-w-[8rem]">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-foreground-muted)]" />
          <Input
            placeholder="Search by title..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-8 pl-8 text-xs bg-white/[0.04] border-white/[0.06]"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-[var(--color-foreground-muted)]" />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as typeof statusFilter)
            }
            className="h-8 rounded-md border border-white/[0.06] bg-white/[0.04] px-2 text-[10px] text-[var(--color-foreground)]"
          >
            <option value="all">All status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 rounded-md border border-white/[0.06] bg-white/[0.04] px-2 text-[10px] text-[var(--color-foreground)]"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-[10px] text-red-400/90">{error}</p>
      )}

      {tasks.length === 0 && !error && (
        <Card className="glass-card">
          <CardContent className="py-8 text-center text-[10px] text-[var(--color-foreground-muted)]">
            No suggested tasks.
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 && tasks.length > 0 && (
        <p className="text-[10px] text-[var(--color-foreground-muted)]">
          No tasks match filters.
        </p>
      )}

      <div className="space-y-6">
        {Array.from(byCategory.entries()).map(([category, items]) => (
          <div key={category}>
            <h2 className="mb-2 flex items-center gap-2 text-xs font-medium text-[var(--color-foreground)]">
              <span>{CATEGORY_EMOJI[category] ?? "📌"}</span>
              {category}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((task) => (
                <Card
                  key={task.id}
                  className={cn(
                    "glass-card",
                    task.status === "approved" && "border-emerald-500/20",
                    task.status === "rejected" && "border-red-500/20 opacity-80"
                  )}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[10px] font-medium text-[var(--color-foreground)] leading-tight">
                        {task.title || "Untitled"}
                      </h3>
                      <div className="flex shrink-0 gap-1">
                        {task.status === "pending" && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-emerald-500 hover:bg-emerald-500/10"
                              onClick={() => handleAction(task.id, "approve")}
                              disabled={updatingId === task.id}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-red-400 hover:bg-red-500/10"
                              onClick={() => handleAction(task.id, "reject")}
                              disabled={updatingId === task.id}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    {task.reasoning && (
                      <p className="mt-1.5 text-[10px] text-[var(--color-foreground-muted)] line-clamp-2">
                        {task.reasoning}
                      </p>
                    )}
                    {task.nextAction && (
                      <p className="mt-1 text-[10px] text-primary/90">
                        Next: {task.nextAction}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {task.priority && (
                        <Badge
                          variant={
                            task.priority === "Critical"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-[9px] px-1.5 py-0"
                        >
                          {task.priority}
                        </Badge>
                      )}
                      {task.effort && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                          {task.effort}
                        </Badge>
                      )}
                      {task.status && task.status !== "pending" && (
                        <Badge
                          variant={
                            task.status === "approved" ? "default" : "destructive"
                          }
                          className="text-[9px] px-1.5 py-0"
                        >
                          {task.status}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
