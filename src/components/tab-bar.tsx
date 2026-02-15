"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TabItem = {
  key: string;
  label: string;
  icon?: ReactNode;
};

type TabBarProps = {
  tabs: TabItem[];
  paramKey?: string;
  className?: string;
};

export function TabBar({
  tabs,
  paramKey = "tab",
  className,
}: TabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(paramKey);
  const activeKey =
    tabs.some((t) => t.key === current) ? current : tabs[0]?.key ?? null;

  const setTab = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === tabs[0]?.key) {
      params.delete(paramKey);
    } else {
      params.set(paramKey, key);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  if (tabs.length === 0) return null;

  return (
    <div
      className={cn(
        "flex w-full rounded-xl border border-white/[0.06] bg-white/[0.03] p-1 backdrop-blur-sm",
        "overflow-x-auto scrollbar-thin",
        className
      )}
    >
      <div className="relative flex min-w-0 flex-1 gap-0.5">
        {tabs.map((tab) => {
          const isActive = activeKey === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTab(tab.key)}
              className={cn(
                "relative z-10 flex min-w-0 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
                isActive
                  ? "text-[var(--color-foreground)]"
                  : "text-[var(--color-foreground-muted)] hover:bg-white/[0.04] hover:text-[var(--color-foreground)]"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId={`tab-${paramKey}`}
                  className="absolute inset-0 rounded-lg bg-white/[0.08] border border-white/[0.06]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                />
              )}
              <span className="relative flex items-center gap-1.5">
                {tab.icon}
                <span className="truncate">{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
