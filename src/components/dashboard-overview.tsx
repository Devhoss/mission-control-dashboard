"use client";

import {
  Server,
  Bot,
  Clock,
  DollarSign,
  FileText,
  Activity,
  CircleDot,
  CircleAlert,
  CircleHelp,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAutoRefreshQuery } from "@/hooks/use-auto-refresh";
import { cn } from "@/lib/utils";

type SystemStateData = {
  workspace: string;
  services: Array<{
    name: string;
    status: "up" | "down" | "unknown";
    port?: number;
    lastCheck?: string;
    message?: string;
  }>;
  branch?: {
    branch?: string;
    clean?: boolean;
    lastCommit?: string;
    lastChecked?: string;
  } | null;
};

type CronHealthData = {
  workspace: string;
  crons: Array<{
    name: string;
    schedule?: string;
    lastRun?: string;
    lastStatus?: "success" | "error" | "unknown";
    consecutiveErrors?: number;
  }>;
};

type RevenueData = {
  workspace: string;
  revenue: {
    current?: number;
    monthlyBurn?: number;
    net?: number;
    currency?: string;
  } | null;
};

type ContentPipelineData = {
  workspace: string;
  columns: { draft: number; review: number; approved: number; published: number };
  rawPreview?: string;
};

type AgentsData = {
  workspace: string;
  agents: Array<{
    id: string;
    name: string;
    role?: string;
    model?: string;
    level?: "L1" | "L2" | "L3" | "L4";
    status?: "healthy" | "unhealthy" | "unknown";
  }>;
  summary: { total: number; healthy: number; unhealthy: number };
};

function SkeletonCard({ className }: { className?: string }) {
  return (
    <Card className={cn("glass-card", className)}>
      <CardHeader className="pb-2">
        <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-white/10" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-white/10" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-white/10" />
      </CardContent>
    </Card>
  );
}

function SystemHealthCard({
  data,
  loading,
  error,
  lastFetched,
}: {
  data: SystemStateData | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}) {
  if (loading && !data) return <SkeletonCard />;
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium flex items-center gap-1.5">
          <Server className="h-3.5 w-3.5" />
          System Health
        </CardTitle>
        {lastFetched != null && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            AUTO 15S
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-[10px] text-red-400/90">{error}</p>
        )}
        {data?.services?.length === 0 && !error && (
          <p className="text-[10px] text-[var(--color-foreground-muted)]">
            No services configured.
          </p>
        )}
        {data?.services && data.services.length > 0 && (
          <ul className="space-y-1.5">
            {data.services.map((s) => (
              <li
                key={s.name}
                className="flex items-center justify-between text-[10px] gap-2"
              >
                <span className="truncate text-[var(--color-foreground)]">
                  {s.name}
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  {s.status === "up" && (
                    <CircleDot className="h-3 text-emerald-500" />
                  )}
                  {s.status === "down" && (
                    <XCircle className="h-3 text-red-400" />
                  )}
                  {s.status === "unknown" && (
                    <CircleHelp className="h-3 text-[var(--color-foreground-muted)]" />
                  )}
                  <span
                    className={cn(
                      s.status === "up" && "text-emerald-500",
                      s.status === "down" && "text-red-400",
                      s.status === "unknown" && "text-[var(--color-foreground-muted)]"
                    )}
                  >
                    {s.status}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {data?.branch && (
          <div className="mt-2 pt-2 border-t border-white/[0.06] text-[10px] text-[var(--color-foreground-muted)]">
            Branch: {data.branch.branch ?? "—"} {data.branch.clean === true && "(clean)"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AgentStatusCard({
  data,
  loading,
  error,
  lastFetched,
}: {
  data: AgentsData | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}) {
  if (loading && !data) return <SkeletonCard />;
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium flex items-center gap-1.5">
          <Bot className="h-3.5 w-3.5" />
          Agent Status
        </CardTitle>
        {lastFetched != null && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            AUTO 15S
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-[10px] text-red-400/90">{error}</p>
        )}
        {data?.agents?.length === 0 && !error && (
          <p className="text-[10px] text-[var(--color-foreground-muted)]">
            No agents in registry.
          </p>
        )}
        {data?.summary && data.summary.total > 0 && (
          <>
            <div className="flex gap-2 text-[10px] mb-2">
              <span className="text-emerald-500">{data.summary.healthy} healthy</span>
              <span className="text-red-400">{data.summary.unhealthy} unhealthy</span>
            </div>
            <ul className="space-y-1">
              {data.agents.slice(0, 5).map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between text-[10px]"
                >
                  <span className="truncate">{a.name}</span>
                  {a.status === "healthy" && (
                    <CheckCircle2 className="h-3 text-emerald-500 shrink-0" />
                  )}
                  {a.status === "unhealthy" && (
                    <CircleAlert className="h-3 text-red-400 shrink-0" />
                  )}
                  {a.status === "unknown" && (
                    <CircleHelp className="h-3 text-[var(--color-foreground-muted)] shrink-0" />
                  )}
                </li>
              ))}
              {data.agents.length > 5 && (
                <li className="text-[10px] text-[var(--color-foreground-muted)]">
                  +{data.agents.length - 5} more
                </li>
              )}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function CronHealthCard({
  data,
  loading,
  error,
  lastFetched,
}: {
  data: CronHealthData | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}) {
  if (loading && !data) return <SkeletonCard />;
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          Cron Health
        </CardTitle>
        {lastFetched != null && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            AUTO 15S
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-[10px] text-red-400/90">{error}</p>
        )}
        {data?.crons?.length === 0 && !error && (
          <p className="text-[10px] text-[var(--color-foreground-muted)]">
            No crons configured.
          </p>
        )}
        {data?.crons && data.crons.length > 0 && (
          <ul className="space-y-1.5">
            {data.crons.map((c) => (
              <li
                key={c.name}
                className="flex items-center justify-between text-[10px]"
              >
                <span className="truncate">{c.name}</span>
                <span
                  className={cn(
                    c.lastStatus === "success" && "text-emerald-500",
                    c.lastStatus === "error" && "text-red-400",
                    c.lastStatus === "unknown" && "text-[var(--color-foreground-muted)]"
                  )}
                >
                  {c.lastStatus ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function RevenueTrackerCard({
  data,
  loading,
  error,
  lastFetched,
}: {
  data: RevenueData | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}) {
  if (loading && !data) return <SkeletonCard />;
  const rev = data?.revenue;
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5" />
          Revenue Tracker
        </CardTitle>
        {lastFetched != null && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            AUTO 15S
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-[10px] text-red-400/90">{error}</p>
        )}
        {(!rev || (rev.current == null && rev.net == null && rev.monthlyBurn == null)) && !error && (
          <p className="text-[10px] text-[var(--color-foreground-muted)]">
            No revenue data.
          </p>
        )}
        {rev && (rev.current != null || rev.net != null || rev.monthlyBurn != null) && (
          <div className="space-y-1 text-[10px]">
            {rev.current != null && (
              <p>
                Current: {rev.currency ?? ""} {rev.current.toLocaleString()}
              </p>
            )}
            {rev.monthlyBurn != null && (
              <p className="text-[var(--color-foreground-muted)]">
                Burn: {rev.currency ?? ""} {rev.monthlyBurn.toLocaleString()}/mo
              </p>
            )}
            {rev.net != null && (
              <p className={rev.net >= 0 ? "text-emerald-500" : "text-red-400"}>
                Net: {rev.currency ?? ""} {rev.net.toLocaleString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ContentPipelineCard({
  data,
  loading,
  error,
  lastFetched,
}: {
  data: ContentPipelineData | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}) {
  if (loading && !data) return <SkeletonCard />;
  const col = data?.columns;
  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Content Pipeline
        </CardTitle>
        {lastFetched != null && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            AUTO 15S
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-[10px] text-red-400/90">{error}</p>
        )}
        {(!col || (col.draft === 0 && col.review === 0 && col.approved === 0 && col.published === 0)) && !error && (
          <p className="text-[10px] text-[var(--color-foreground-muted)]">
            No queue data.
          </p>
        )}
        {col && (col.draft > 0 || col.review > 0 || col.approved > 0 || col.published > 0) && (
          <div className="grid grid-cols-4 gap-1 text-[10px]">
            <div className="rounded bg-white/[0.04] px-2 py-1 text-center">
              <div className="font-medium text-[var(--color-foreground)]">{col.draft}</div>
              <div className="text-[var(--color-foreground-muted)]">Draft</div>
            </div>
            <div className="rounded bg-white/[0.04] px-2 py-1 text-center">
              <div className="font-medium text-[var(--color-foreground)]">{col.review}</div>
              <div className="text-[var(--color-foreground-muted)]">Review</div>
            </div>
            <div className="rounded bg-white/[0.04] px-2 py-1 text-center">
              <div className="font-medium text-[var(--color-foreground)]">{col.approved}</div>
              <div className="text-[var(--color-foreground-muted)]">Approved</div>
            </div>
            <div className="rounded bg-white/[0.04] px-2 py-1 text-center">
              <div className="font-medium text-emerald-500">{col.published}</div>
              <div className="text-[var(--color-foreground-muted)]">Published</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickStatsCard({
  systemState,
  agentsData,
  cronData,
  revenueData,
  contentData,
}: {
  systemState: SystemStateData | null;
  agentsData: AgentsData | null;
  cronData: CronHealthData | null;
  revenueData: RevenueData | null;
  contentData: ContentPipelineData | null;
}) {
  const servicesUp =
    systemState?.services?.filter((s) => s.status === "up").length ?? 0;
  const servicesTotal = systemState?.services?.length ?? 0;
  const agentsHealthy = agentsData?.summary?.healthy ?? 0;
  const agentsTotal = agentsData?.summary?.total ?? 0;
  const cronsOk = cronData?.crons?.filter((c) => c.lastStatus === "success").length ?? 0;
  const cronsTotal = cronData?.crons?.length ?? 0;
  const contentTotal =
    contentData?.columns != null
      ? contentData.columns.draft +
        contentData.columns.review +
        contentData.columns.approved +
        contentData.columns.published
      : 0;
  const revenue = revenueData?.revenue?.current ?? revenueData?.revenue?.net ?? null;

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5" />
          Quick Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="rounded bg-white/[0.04] px-2 py-1.5">
            <span className="text-[var(--color-foreground-muted)]">Services</span>
            <p className="font-medium text-[var(--color-foreground)]">
              {servicesUp}/{servicesTotal} up
            </p>
          </div>
          <div className="rounded bg-white/[0.04] px-2 py-1.5">
            <span className="text-[var(--color-foreground-muted)]">Agents</span>
            <p className="font-medium text-[var(--color-foreground)]">
              {agentsHealthy}/{agentsTotal} healthy
            </p>
          </div>
          <div className="rounded bg-white/[0.04] px-2 py-1.5">
            <span className="text-[var(--color-foreground-muted)]">Crons</span>
            <p className="font-medium text-[var(--color-foreground)]">
              {cronsOk}/{cronsTotal} ok
            </p>
          </div>
          <div className="rounded bg-white/[0.04] px-2 py-1.5">
            <span className="text-[var(--color-foreground-muted)]">Content</span>
            <p className="font-medium text-[var(--color-foreground)]">
              {contentTotal} items
            </p>
          </div>
          {revenue != null && (
            <div className="col-span-2 rounded bg-white/[0.04] px-2 py-1.5">
              <span className="text-[var(--color-foreground-muted)]">Revenue</span>
              <p className="font-medium text-[var(--color-foreground)]">
                {revenue.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardOverview() {
  const { workspace } = useWorkspace();
  const query = workspace ? `?ws=${encodeURIComponent(workspace)}` : "";

  const systemState = useAutoRefreshQuery<SystemStateData>(
    `/api/system-state${query}`,
    { intervalMs: 15000 }
  );
  const cronHealth = useAutoRefreshQuery<CronHealthData>(
    `/api/cron-health${query}`,
    { intervalMs: 15000 }
  );
  const revenue = useAutoRefreshQuery<RevenueData>(`/api/revenue${query}`, {
    intervalMs: 15000,
  });
  const contentPipeline = useAutoRefreshQuery<ContentPipelineData>(
    `/api/content-pipeline${query}`,
    { intervalMs: 15000 }
  );
  const agents = useAutoRefreshQuery<AgentsData>(`/api/agents${query}`, {
    intervalMs: 15000,
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-[var(--color-foreground)]">
          Mission Control
        </h1>
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"
            title="Live"
          />
          <Badge variant="secondary" className="text-[10px]">
            AUTO 15S
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SystemHealthCard
          data={systemState.data}
          loading={systemState.loading}
          error={systemState.error}
          lastFetched={systemState.lastFetched}
        />
        <AgentStatusCard
          data={agents.data}
          loading={agents.loading}
          error={agents.error}
          lastFetched={agents.lastFetched}
        />
        <CronHealthCard
          data={cronHealth.data}
          loading={cronHealth.loading}
          error={cronHealth.error}
          lastFetched={cronHealth.lastFetched}
        />
        <RevenueTrackerCard
          data={revenue.data}
          loading={revenue.loading}
          error={revenue.error}
          lastFetched={revenue.lastFetched}
        />
        <ContentPipelineCard
          data={contentPipeline.data}
          loading={contentPipeline.loading}
          error={contentPipeline.error}
          lastFetched={contentPipeline.lastFetched}
        />
        <QuickStatsCard
          systemState={systemState.data}
          agentsData={agents.data}
          cronData={cronHealth.data}
          revenueData={revenue.data}
          contentData={contentPipeline.data}
        />
      </div>
    </div>
  );
}
