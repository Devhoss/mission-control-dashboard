"use client";

import { useSearchParams } from "next/navigation";
import { Bot, Cpu } from "lucide-react";
import { TabBar } from "./tab-bar";
import { AgentsView } from "./agents-view";
import { ModelsView } from "./models-view";

const AGENTS_TABS = [
  { key: "agents", label: "Agents", icon: <Bot className="h-3.5 w-3.5" /> },
  { key: "models", label: "Models", icon: <Cpu className="h-3.5 w-3.5" /> },
] as const;

export function AgentsPageClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? AGENTS_TABS[0].key;
  const activeTab = AGENTS_TABS.some((t) => t.key === tab) ? tab : AGENTS_TABS[0].key;

  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)]">
      <header className="border-b border-white/[0.06] px-6 py-4">
        <h1 className="text-sm font-semibold text-[var(--color-foreground)]">
          Agents
        </h1>
        <p className="mt-0.5 text-[10px] text-[var(--color-foreground-muted)]">
          Agent registry and model inventory
        </p>
      </header>

      <div className="px-6 pt-4">
        <TabBar tabs={[...AGENTS_TABS]} paramKey="tab" />
      </div>

      <div className="flex-1 p-6 pt-4">
        {activeTab === "agents" && <AgentsView />}
        {activeTab === "models" && <ModelsView />}
      </div>
    </div>
  );
}
