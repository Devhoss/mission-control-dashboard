"use client";

import { useState, useMemo } from "react";
import { MessageSquare, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAutoRefreshQuery } from "@/hooks/use-auto-refresh";

type FeedItem = {
  id: string;
  source: "telegram" | "discord" | "system";
  content: string;
  createdAt?: string;
};

type CommsFeedData = { workspace: string; feed: FeedItem[] };

function formatDay(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString();
}

export function CommsView() {
  const { workspace } = useWorkspace();
  const query = workspace ? `?ws=${encodeURIComponent(workspace)}` : "";
  const [searchQ, setSearchQ] = useState("");

  const { data, loading } = useAutoRefreshQuery<CommsFeedData>(
    `/api/comms-feed${query}`,
    { intervalMs: 15000 }
  );

  const feed = useMemo(() => data?.feed ?? [], [data?.feed]);
  const filtered = useMemo(() => {
    if (!searchQ.trim()) return feed;
    const q = searchQ.toLowerCase();
    return feed.filter((f) => f.content.toLowerCase().includes(q));
  }, [feed, searchQ]);

  let lastDay = "";

  return (
    <div className="space-y-4 p-6">
      <div className="relative max-w-xs">
        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-foreground-muted)]" />
        <input
          type="text"
          placeholder="Search feed..."
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          className="h-8 w-full rounded-md border border-white/[0.06] bg-white/[0.04] pl-8 pr-3 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-muted)] focus:outline-none focus:ring-2 focus:ring-white/20"
        />
      </div>

      {loading && !data && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-white/10" />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] py-12 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-[var(--color-foreground-muted)]" />
          <p className="mt-2 text-[10px] text-[var(--color-foreground-muted)]">No comms feed items.</p>
        </div>
      )}

      <ul className="space-y-2">
        {filtered.map((item) => {
          const day = formatDay(item.createdAt);
          const showDay = day && day !== lastDay;
          if (showDay) lastDay = day;
          return (
            <li key={item.id}>
              {showDay && (
                <p className="py-2 text-center text-[9px] text-[var(--color-foreground-muted)]">— {day} —</p>
              )}
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={item.source === "system" ? "secondary" : "default"} className="text-[8px] px-1.5 py-0">
                    {item.source}
                  </Badge>
                  {item.createdAt && (
                    <span className="text-[8px] text-[var(--color-foreground-muted)]">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[var(--color-foreground)] whitespace-pre-wrap break-words">
                  {item.content}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
