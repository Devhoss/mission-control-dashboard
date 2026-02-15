"use client";

import { useState } from "react";
import { FileText, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAutoRefreshQuery } from "@/hooks/use-auto-refresh";
import { cn } from "@/lib/utils";

type PrioritiesData = { workspace: string; markdown: string; preview: string };
type ObservationsData = { workspace: string; markdown: string; preview: string };

function MarkdownPreview({
  content,
  className,
  maxHeight,
}: {
  content: string;
  className?: string;
  maxHeight?: string;
}) {
  if (!content.trim()) return null;
  return (
    <div
      className={cn(
        "prose prose-invert prose-sm max-w-none text-[10px] leading-relaxed overflow-y-auto",
        "prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0",
        className
      )}
      style={maxHeight ? { maxHeight } : undefined}
    >
      {content.split("\n").map((line, i) => {
        if (line.startsWith("### "))
          return <h3 key={i} className="text-xs font-semibold mt-2 first:mt-0">{line.slice(4)}</h3>;
        if (line.startsWith("## "))
          return <h2 key={i} className="text-xs font-semibold mt-3 first:mt-0">{line.slice(3)}</h2>;
        if (line.startsWith("# "))
          return <h1 key={i} className="text-xs font-semibold mt-2 first:mt-0">{line.slice(2)}</h1>;
        if (line.startsWith("- ") || line.startsWith("* "))
          return <li key={i} className="ml-4">{line.slice(2)}</li>;
        if (line.trim() === "") return <br key={i} />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

function InlineSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-3 w-full animate-pulse rounded bg-white/10" />
      <div className="h-3 w-4/5 animate-pulse rounded bg-white/10" />
      <div className="h-3 w-3/5 animate-pulse rounded bg-white/10" />
    </div>
  );
}

export function OpsView() {
  const { workspace } = useWorkspace();
  const query = workspace ? `?ws=${encodeURIComponent(workspace)}` : "";

  const priorities = useAutoRefreshQuery<PrioritiesData>(
    `/api/priorities${query}`,
    { intervalMs: 15000 }
  );
  const observations = useAutoRefreshQuery<ObservationsData>(
    `/api/observations${query}`,
    { intervalMs: 15000 }
  );

  const [prioritiesExpanded, setPrioritiesExpanded] = useState(false);
  const prioritiesContent =
    priorities.data?.markdown ?? "";
  const prioritiesPreview = priorities.data?.preview ?? "";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* System Priorities */}
      <Card className="glass-card flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-medium flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            System Priorities
          </CardTitle>
          {prioritiesContent && (
            <button
              type="button"
              onClick={() => setPrioritiesExpanded((e) => !e)}
              className="text-[10px] text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)] flex items-center gap-1"
            >
              {prioritiesExpanded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {prioritiesExpanded ? "Collapse" : "Open full"}
            </button>
          )}
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
          {priorities.loading && !priorities.data && <InlineSkeleton />}
          {priorities.error && (
            <p className="text-[10px] text-red-400/90">{priorities.error}</p>
          )}
          {!priorities.loading && !prioritiesContent && !priorities.error && (
            <p className="text-[10px] text-[var(--color-foreground-muted)]">
              No priorities set.
            </p>
          )}
          {prioritiesContent && (
            <MarkdownPreview
              content={prioritiesExpanded ? prioritiesContent : prioritiesPreview}
              maxHeight={prioritiesExpanded ? "none" : "12rem"}
            />
          )}
        </CardContent>
      </Card>

      {/* Observations Feed */}
      <Card className="glass-card flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Observations Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
          {observations.loading && !observations.data && <InlineSkeleton />}
          {observations.error && (
            <p className="text-[10px] text-red-400/90">{observations.error}</p>
          )}
          {!observations.loading && !observations.data?.markdown?.trim() && !observations.error && (
            <p className="text-[10px] text-[var(--color-foreground-muted)]">
              No observations yet.
            </p>
          )}
          {observations.data?.markdown?.trim() && (
            <MarkdownPreview
              content={observations.data.preview || observations.data.markdown.slice(0, 500)}
              maxHeight="12rem"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
