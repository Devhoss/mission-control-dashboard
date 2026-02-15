"use client";

import { useSearchParams } from "next/navigation";
import { MessageSquare, Users } from "lucide-react";
import { TabBar } from "./tab-bar";
import { CommsView } from "./comms-view";
import { CrmView } from "./crm-view";

const COMMS_TABS = [
  { key: "comms", label: "Comms", icon: <MessageSquare className="h-3.5 w-3.5" /> },
  { key: "crm", label: "CRM", icon: <Users className="h-3.5 w-3.5" /> },
] as const;

export function CommsPageClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? COMMS_TABS[0].key;
  const activeTab = COMMS_TABS.some((t) => t.key === tab) ? tab : COMMS_TABS[0].key;

  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)]">
      <header className="border-b border-white/[0.06] px-6 py-4">
        <h1 className="text-sm font-semibold text-[var(--color-foreground)]">Comms</h1>
        <p className="mt-0.5 text-[10px] text-[var(--color-foreground-muted)]">
          Comms feed and CRM kanban
        </p>
      </header>
      <div className="px-6 pt-4">
        <TabBar tabs={[...COMMS_TABS]} paramKey="tab" />
      </div>
      <div className="flex-1 min-h-0">
        {activeTab === "comms" && <CommsView />}
        {activeTab === "crm" && <CrmView />}
      </div>
    </div>
  );
}
