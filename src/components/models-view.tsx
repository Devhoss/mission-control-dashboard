"use client";

import { Cpu, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PLACEHOLDER_MODELS = [
  { name: "qwen2.5:7b", provider: "OpenAI-compatible", type: "Chat", cost: "—", routing: "Primary", failover: "—" },
  { name: "qwen2.5:3b-optimized", provider: "OpenAI-compatible", type: "Chat", cost: "—", routing: "Fallback", failover: "qwen2.5:7b" },
  { name: "llama3.1:8b", provider: "OpenAI-compatible", type: "Chat", cost: "—", routing: "Secondary", failover: "qwen2.5:3b-optimized" },
];

export function ModelsView() {
  return (
    <div className="space-y-4">
      <Card className="glass-card border-amber-500/20 bg-amber-500/5">
        <CardContent className="flex items-start gap-3 py-3">
          <Info className="h-4 w-4 shrink-0 text-amber-400/90" />
          <p className="text-[10px] text-[var(--color-foreground-muted)]">
            Inventory placeholder until routing integration phase. Model list and routing will be wired to Convex later.
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-foreground-muted)]">Model name</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-foreground-muted)]">Provider</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-foreground-muted)]">Type</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-foreground-muted)]">Cost</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-foreground-muted)]">Routing</th>
                <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-foreground-muted)]">Failover</th>
              </tr>
            </thead>
            <tbody>
              {PLACEHOLDER_MODELS.map((row, i) => (
                <tr key={row.name} className={cn("border-b border-white/[0.04] hover:bg-white/[0.03]", i % 2 === 1 && "bg-white/[0.01]")}>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2 text-[10px] font-medium text-[var(--color-foreground)]">
                      <Cpu className="h-3 w-3 text-[var(--color-foreground-muted)]" />
                      {row.name}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[10px] text-[var(--color-foreground-muted)]">{row.provider}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{row.type}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-[10px] text-[var(--color-foreground-muted)]">{row.cost}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={row.routing === "Primary" ? "default" : "outline"} className="text-[9px] px-1.5 py-0">{row.routing}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-[10px] text-[var(--color-foreground-muted)]">{row.failover}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
