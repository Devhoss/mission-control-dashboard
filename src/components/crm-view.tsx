"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAutoRefreshQuery } from "@/hooks/use-auto-refresh";
import { Markdown } from "@/components/markdown";

type Client = {
  id: string;
  file: string;
  name: string;
  status: "prospect" | "contacted" | "meeting" | "proposal" | "active";
  contacts?: string[];
  lastInteraction?: string;
  nextAction?: string;
  preview?: string;
  updatedAt?: string;
};

type ClientsData = { workspace: string; clients: Client[] };

const CRM_COLUMNS: { key: Client["status"]; label: string }[] = [
  { key: "prospect", label: "Prospect" },
  { key: "contacted", label: "Contacted" },
  { key: "meeting", label: "Meeting" },
  { key: "proposal", label: "Proposal" },
  { key: "active", label: "Active" },
];

export function CrmView() {
  const { workspace } = useWorkspace();
  const query = workspace ? `?ws=${encodeURIComponent(workspace)}` : "";
  const [clientFile, setClientFile] = useState<string | null>(null);
  const [clientContent, setClientContent] = useState("");
  const [contentLoading, setContentLoading] = useState(false);

  const { data, loading } = useAutoRefreshQuery<ClientsData>(
    `/api/clients${query}`,
    { intervalMs: 30000 }
  );

  const clients = data?.clients ?? [];
  const byStatus = new Map<Client["status"], Client[]>();
  CRM_COLUMNS.forEach((c) => byStatus.set(c.key, []));
  clients.forEach((c) => {
    const list = byStatus.get(c.status) ?? [];
    list.push(c);
    byStatus.set(c.status, list);
  });

  useEffect(() => {
    if (!clientFile || !workspace) return;
    setContentLoading(true);
    fetch(`/api/client${query}&file=${encodeURIComponent(clientFile)}`)
      .then((res) => res.json())
      .then((json: { ok?: boolean; data?: { content?: string } }) => {
        if (json?.ok && json?.data?.content != null) setClientContent(json.data.content);
        else setClientContent("");
      })
      .finally(() => setContentLoading(false));
  }, [clientFile, query, workspace]);

  return (
    <div className="space-y-4 p-6">
      {loading && !data && (
        <div className="grid grid-cols-5 gap-4">
          {CRM_COLUMNS.map((col) => (
            <div key={col.key} className="space-y-2">
              <div className="h-5 w-24 animate-pulse rounded bg-white/10" />
              {[1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-white/10" />
              ))}
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-5 gap-4">
          {CRM_COLUMNS.map((col) => (
            <div
              key={col.key}
              className="flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-2"
            >
              <h3 className="mb-2 text-[10px] font-semibold uppercase text-[var(--color-foreground-muted)]">
                {col.label}
              </h3>
              <div className="space-y-2">
                {(byStatus.get(col.key) ?? []).length === 0 && (
                  <p className="py-4 text-center text-[10px] text-[var(--color-foreground-muted)]">
                    Empty
                  </p>
                )}
                {(byStatus.get(col.key) ?? []).map((client, i) => (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card
                      className="glass-card cursor-pointer transition-colors hover:bg-white/[0.06]"
                      onClick={() => setClientFile(client.file)}
                    >
                      <CardContent className="p-3">
                        <p className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--color-foreground)]">
                          <User className="h-3 w-3 shrink-0" />
                          {client.name}
                        </p>
                        {client.contacts && client.contacts.length > 0 && (
                          <p className="mt-1 text-[9px] text-[var(--color-foreground-muted)] line-clamp-1">
                            {client.contacts.join(", ")}
                          </p>
                        )}
                        {client.nextAction && (
                          <p className="mt-1 text-[9px] text-primary/90 line-clamp-1">
                            Next: {client.nextAction}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {clientFile && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setClientFile(null)}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed left-1/2 top-1/2 z-50 max-h-[80vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-white/[0.06] bg-[var(--color-background-elevated)] shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] p-3">
              <h3 className="text-xs font-semibold text-[var(--color-foreground)]">
                Client details
              </h3>
              <button
                type="button"
                onClick={() => setClientFile(null)}
                className="rounded p-1 text-[var(--color-foreground-muted)] hover:bg-white/[0.06]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {contentLoading && (
                <div className="space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-white/10" />
                </div>
              )}
              {!contentLoading && clientContent && (
                <Markdown content={clientContent} />
              )}
              {!contentLoading && !clientContent && (
                <p className="text-[10px] text-[var(--color-foreground-muted)]">
                  No content.
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
