"use client";

import { ContentView } from "./content-view";

export function ContentPageClient() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)]">
      <header className="border-b border-white/[0.06] px-6 py-4">
        <h1 className="text-sm font-semibold text-[var(--color-foreground)]">Content</h1>
        <p className="mt-0.5 text-[10px] text-[var(--color-foreground-muted)]">Content pipeline kanban</p>
      </header>
      <ContentView />
    </div>
  );
}
