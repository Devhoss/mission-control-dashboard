"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAutoRefreshQuery } from "@/hooks/use-auto-refresh";
import { cn } from "@/lib/utils";

type Draft = {
  id: string;
  file: string;
  title: string;
  platform?: string;
  status: "draft" | "review" | "approved" | "published";
  preview: string;
  updatedAt?: string;
};

type ContentDraftsData = { workspace: string; drafts: Draft[] };

const COLUMNS: { key: Draft["status"]; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "review", label: "Review" },
  { key: "approved", label: "Approved" },
  { key: "published", label: "Published" },
];

export function ContentView() {
  const { workspace } = useWorkspace();
  const query = workspace ? `?ws=${encodeURIComponent(workspace)}` : "";
  const [searchQ, setSearchQ] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const { data, loading, refetch } = useAutoRefreshQuery<ContentDraftsData>(
    `/api/content-drafts${query}`,
    { intervalMs: 30000 }
  );

  const drafts = useMemo(() => data?.drafts ?? [], [data?.drafts]);
  const filtered = useMemo(() => {
    return drafts.filter((d) => {
      if (searchQ && !d.title.toLowerCase().includes(searchQ.toLowerCase()) && !d.preview.toLowerCase().includes(searchQ.toLowerCase()))
        return false;
      if (platformFilter && d.platform?.toLowerCase() !== platformFilter.toLowerCase()) return false;
      return true;
    });
  }, [drafts, searchQ, platformFilter]);

  const byStatus = useMemo(() => {
    const map = new Map<Draft["status"], Draft[]>();
    COLUMNS.forEach((c) => map.set(c.key, []));
    filtered.forEach((d) => {
      const list = map.get(d.status) ?? [];
      list.push(d);
      map.set(d.status, list);
    });
    return map;
  }, [filtered]);

  const openEditor = async (file: string) => {
    setEditingFile(file);
    try {
      const res = await fetch(`/api/content-draft${query}&file=${encodeURIComponent(file)}`);
      const json = await res.json();
      if (json?.ok && json?.data?.content != null) setEditContent(json.data.content);
      else setEditContent("");
    } catch {
      setEditContent("");
    }
  };

  const saveDraft = async () => {
    if (!editingFile || saving || !workspace) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/content-draft${query}&file=${encodeURIComponent(editingFile)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        setEditingFile(null);
        refetch();
      }
    } finally {
      setSaving(false);
    }
  };

  const platforms = useMemo(() => {
    const set = new Set(drafts.map((d) => d.platform).filter(Boolean));
    return Array.from(set).sort();
  }, [drafts]);

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-foreground-muted)]" />
          <input
            type="text"
            placeholder="Search drafts..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="h-8 w-full rounded-md border border-white/[0.06] bg-white/[0.04] pl-8 pr-3 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-muted)] focus:outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="h-8 rounded-md border border-white/[0.06] bg-white/[0.04] px-2 text-[10px] text-[var(--color-foreground)]"
        >
          <option value="">All platforms</option>
          {platforms.map((p) => (
            <option key={p} value={p ?? ""}>{p}</option>
          ))}
        </select>
      </div>

      {loading && !data && (
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.key} className="space-y-2">
              <div className="h-5 w-20 animate-pulse rounded bg-white/10" />
              {[1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-white/10" />
              ))}
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.key} className="flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
              <h3 className="mb-2 text-[10px] font-semibold uppercase text-[var(--color-foreground-muted)]">
                {col.label}
              </h3>
              <div className="space-y-2">
                {(byStatus.get(col.key) ?? []).length === 0 && (
                  <p className="py-4 text-center text-[10px] text-[var(--color-foreground-muted)]">
                    Empty
                  </p>
                )}
                {(byStatus.get(col.key) ?? []).map((draft, i) => (
                  <motion.div
                    key={draft.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card
                      className="glass-card cursor-pointer transition-colors hover:bg-white/[0.06]"
                      onClick={() => openEditor(draft.file)}
                    >
                      <CardContent className="p-3">
                        <p className="text-[10px] font-medium text-[var(--color-foreground)] line-clamp-1">
                          {draft.title}
                        </p>
                        {draft.platform && (
                          <Badge variant="secondary" className="mt-1 text-[8px] px-1.5 py-0">
                            {draft.platform}
                          </Badge>
                        )}
                        <p className="mt-1 line-clamp-2 text-[9px] text-[var(--color-foreground-muted)]">
                          {draft.preview}
                        </p>
                        {draft.updatedAt && (
                          <p className="mt-1 text-[8px] text-[var(--color-foreground-muted)]">
                            {new Date(draft.updatedAt).toLocaleDateString()}
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

      {editingFile && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setEditingFile(null)}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/[0.06] bg-[var(--color-background-elevated)] p-4 shadow-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-[var(--color-foreground)]">
                Edit draft
              </h3>
              <button
                type="button"
                onClick={() => setEditingFile(null)}
                className="rounded p-1 text-[var(--color-foreground-muted)] hover:bg-white/[0.06]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="h-64 w-full rounded-lg border border-white/[0.06] bg-white/[0.04] p-3 text-xs text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Markdown content..."
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditingFile(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={saveDraft} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
