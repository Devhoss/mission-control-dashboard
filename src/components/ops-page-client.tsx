"use client";

import { useSearchParams } from "next/navigation";
import { ClipboardList, ListTodo, Calendar } from "lucide-react";
import { TabBar } from "./tab-bar";
import { OpsView } from "./ops-view";
import { SuggestedTasksView } from "./suggested-tasks-view";
import { OpsCalendarPlaceholder } from "./ops-calendar-placeholder";

const OPS_TABS = [
  { key: "operations", label: "Operations", icon: <ClipboardList className="h-3.5 w-3.5" /> },
  { key: "tasks", label: "Tasks", icon: <ListTodo className="h-3.5 w-3.5" /> },
  { key: "calendar", label: "Calendar", icon: <Calendar className="h-3.5 w-3.5" /> },
] as const;

export function OpsPageClient() {
  const searchParams = useSearchParams();
  const tab =
    searchParams.get("tab") ?? OPS_TABS[0].key;
  const activeTab = OPS_TABS.some((t) => t.key === tab)
    ? tab
    : OPS_TABS[0].key;

  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)]">
      <header className="border-b border-white/[0.06] px-6 py-4">
        <h1 className="text-sm font-semibold text-[var(--color-foreground)]">
          Ops
        </h1>
        <p className="mt-0.5 text-[10px] text-[var(--color-foreground-muted)]">
          Operations, suggested tasks, and calendar
        </p>
      </header>

      <div className="px-6 pt-4">
        <TabBar tabs={[...OPS_TABS]} paramKey="tab" />
      </div>

      <div className="flex-1 p-6 pt-4">
        {activeTab === "operations" && <OpsView />}
        {activeTab === "tasks" && <SuggestedTasksView />}
        {activeTab === "calendar" && <OpsCalendarPlaceholder />}
      </div>
    </div>
  );
}
