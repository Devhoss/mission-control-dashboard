"use client";

import { Zap, Pause, Clock, ListTodo, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COMMANDS = [
  { id: "restart-gateway", label: "Restart Gateway", icon: Zap },
  { id: "pause-agents", label: "Pause Agents", icon: Pause },
  { id: "run-cron", label: "Run Cron Sweep", icon: Clock },
  { id: "suggested-tasks", label: "Generate Suggested Tasks", icon: ListTodo },
  { id: "clear-queue", label: "Clear Delivery Queue", icon: Trash2 },
] as const;

export function ChatCommandView() {
  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardContent className="py-6">
          <h2 className="text-xs font-semibold text-[var(--color-foreground)] mb-4">
            Quick Commands
          </h2>
          <p className="text-[10px] text-[var(--color-foreground-muted)] mb-4">
            Placeholder — commands will be wired in a later phase.
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMANDS.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant="outline"
                size="sm"
                className={cn(
                  "text-[10px] border-white/[0.06] bg-white/[0.03]",
                  "hover:bg-white/[0.06] cursor-default"
                )}
                disabled
              >
                <Icon className="h-3.5 w-3.5 mr-1.5" />
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
