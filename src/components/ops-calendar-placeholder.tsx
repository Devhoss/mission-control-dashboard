"use client";

import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 12 }, (_, i) => `${i + 8}:00`);

export function OpsCalendarPlaceholder() {
  return (
    <div className="space-y-4">
      <Card className="glass-card border-dashed border-white/[0.08]">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Calendar className="h-12 w-12 text-[var(--color-foreground-muted)] mb-4" />
          <p className="text-xs font-medium text-[var(--color-foreground)] text-center max-w-sm">
            Calendar will be connected to Convex in Phase 9
          </p>
          <p className="mt-1 text-[10px] text-[var(--color-foreground-muted)] text-center">
            Weekly grid and events will sync here.
          </p>
        </CardContent>
      </Card>

      {/* Fake weekly grid skeleton */}
      <div className="glass-card rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="grid grid-cols-8 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="p-2 text-[10px] text-[var(--color-foreground-muted)]" />
          {DAYS.map((d) => (
            <div
              key={d}
              className="p-2 text-center text-[10px] font-medium text-[var(--color-foreground-muted)] border-l border-white/[0.06]"
            >
              {d}
            </div>
          ))}
        </div>
        {HOURS.slice(0, 6).map((hour) => (
          <div
            key={hour}
            className="grid grid-cols-8 border-b border-white/[0.04] min-h-[3rem]"
          >
            <div className="p-1.5 text-[10px] text-[var(--color-foreground-muted)] border-r border-white/[0.04]">
              {hour}
            </div>
            {DAYS.map((d) => (
              <div
                key={d}
                className="p-1 border-l border-white/[0.04] bg-white/[0.01]"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
