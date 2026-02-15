"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, FileText, ScrollText, FolderOutput } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAutoRefreshQuery } from "@/hooks/use-auto-refresh";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";

type Agent = {
  id: string;
  name: string;
  role?: string;
  model?: string;
  level?: "L1" | "L2" | "L3" | "L4";
  status?: "healthy" | "unhealthy" | "unknown";
};

type AgentsListData = {
  workspace: string;
  agents: Agent[];
  summary: { total: number; healthy: number; unhealthy: number };
};

type AgentDetailData = {
  workspace: string;
  agent: {
    id: string;
    name: string;
    role?: string;
    model?: string;
    level?: string;
    status?: string;
    soulMarkdown?: string;
    rulesMarkdown?: string;
    outputs: Array<{ file: string; updatedAt?: string; preview: string }>;
  } | null;
};

function AgentCard({
  agent,
  index,
  onClick,
}: {
  agent: Agent;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
    >
      <Card
        className="glass-card cursor-pointer transition-colors hover:bg-white/[0.06] hover:border-white/[0.08]"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Bot className="h-4 w-4 shrink-0 text-[var(--color-foreground-muted)]" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-[var(--color-foreground)]">
                  {agent.name}
                </p>
                {agent.role && (
                  <p className="truncate text-[10px] text-[var(--color-foreground-muted)]">
                    {agent.role}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              {agent.level && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                  {agent.level}
                </Badge>
              )}
              {agent.status && (
                <Badge
                  variant={
                    agent.status === "healthy"
                      ? "default"
                      : agent.status === "unhealthy"
                        ? "destructive"
                        : "outline"
                  }
                  className="text-[9px] px-1.5 py-0"
                >
                  {agent.status}
                </Badge>
              )}
            </div>
          </div>
          {agent.model && (
            <p className="mt-1.5 text-[10px] text-[var(--color-foreground-muted)]">
              {agent.model}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AgentDetailDrawer({
  agentId,
  onClose,
  workspace,
}: {
  agentId: string;
  onClose: () => void;
  workspace: string;
}) {
  const [data, setData] = useState<AgentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const query = workspace ? `?ws=${encodeURIComponent(workspace)}` : "";

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`/api/agents/${encodeURIComponent(agentId)}${query}`)
      .then((res) => res.json())
      .then((json: { ok?: boolean; data?: AgentDetailData }) => {
        if (json.ok && json.data) setData(json.data);
      })
      .finally(() => setLoading(false));
  }, [agentId, query]);

  const agent = data?.agent ?? null;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 z-50 w-full max-w-lg border-l border-white/[0.06] bg-[var(--color-background-elevated)] shadow-xl backdrop-blur-xl"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
            {loading ? "Loading…" : agent?.name ?? "Agent"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-foreground-muted)] hover:bg-white/[0.06] hover:text-[var(--color-foreground)]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {loading && (
            <div className="space-y-4">
              <div className="h-20 w-full animate-pulse rounded-lg bg-white/10" />
              <div className="h-32 w-full animate-pulse rounded-lg bg-white/10" />
              <div className="h-24 w-full animate-pulse rounded-lg bg-white/10" />
            </div>
          )}
          {!loading && agent && (
            <>
              {agent.role && (
                <p className="text-[10px] text-[var(--color-foreground-muted)]">
                  {agent.role}
                </p>
              )}
              {agent.soulMarkdown && (
                <section>
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--color-foreground)]">
                    <ScrollText className="h-3.5 w-3.5" />
                    SOUL
                  </h3>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <Markdown content={agent.soulMarkdown} />
                  </div>
                </section>
              )}
              {agent.rulesMarkdown && (
                <section>
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--color-foreground)]">
                    <FileText className="h-3.5 w-3.5" />
                    RULES
                  </h3>
                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <Markdown content={agent.rulesMarkdown} />
                  </div>
                </section>
              )}
              <section>
                <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--color-foreground)]">
                  <FolderOutput className="h-3.5 w-3.5" />
                  Recent outputs
                </h3>
                {agent.outputs.length === 0 ? (
                  <p className="text-[10px] text-[var(--color-foreground-muted)]">
                    No outputs yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {agent.outputs.map((o) => (
                      <li
                        key={o.file}
                        className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2"
                      >
                        <p className="text-[10px] font-medium text-[var(--color-foreground)]">
                          {o.file}
                        </p>
                        {o.updatedAt && (
                          <p className="text-[9px] text-[var(--color-foreground-muted)]">
                            {new Date(o.updatedAt).toLocaleString()}
                          </p>
                        )}
                        <p className="mt-1 line-clamp-2 text-[10px] text-[var(--color-foreground-muted)]">
                          {o.preview}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
          {!loading && !agent && (
            <p className="text-[10px] text-[var(--color-foreground-muted)]">
              Agent not found.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function AgentsView() {
  const { workspace } = useWorkspace();
  const query = workspace ? `?ws=${encodeURIComponent(workspace)}` : "";
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, loading, error } = useAutoRefreshQuery<AgentsListData>(
    `/api/agents${query}`,
    { intervalMs: 15000 }
  );

  const agents = data?.agents ?? [];

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-[10px] text-red-400/90">{error}</p>
      )}
      {loading && !data && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="glass-card">
              <CardContent className="p-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
                <div className="mt-2 h-3 w-full animate-pulse rounded bg-white/10" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {!loading && agents.length === 0 && !error && (
        <Card className="glass-card">
          <CardContent className="py-12 text-center text-[10px] text-[var(--color-foreground-muted)]">
            No agents in registry.
          </CardContent>
        </Card>
      )}
      {agents.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent, index) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              index={index}
              onClick={() => setSelectedId(agent.id)}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedId && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              aria-label="Close drawer"
            />
            <AgentDetailDrawer
              agentId={selectedId}
              onClose={() => setSelectedId(null)}
              workspace={workspace ?? ""}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
