"use client";

import { useSearchParams } from "next/navigation";
import { MessageSquare, Terminal } from "lucide-react";
import { TabBar } from "./tab-bar";
import { ChatCenterView } from "./chat-center-view";
import { ChatCommandView } from "./chat-command-view";

const CHAT_TABS = [
  { key: "chat", label: "Chat", icon: <MessageSquare className="h-3.5 w-3.5" /> },
  { key: "command", label: "Command", icon: <Terminal className="h-3.5 w-3.5" /> },
] as const;

export function ChatPageClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? CHAT_TABS[0].key;
  const activeTab = CHAT_TABS.some((t) => t.key === tab) ? tab : CHAT_TABS[0].key;

  return (
    <div className="flex flex-col min-h-[calc(100vh-3rem)]">
      <header className="border-b border-white/[0.06] px-6 py-4">
        <h1 className="text-sm font-semibold text-[var(--color-foreground)]">
          Chat
        </h1>
        <p className="mt-0.5 text-[10px] text-[var(--color-foreground-muted)]">
          Sessions, transcript viewer, and send queue
        </p>
      </header>

      <div className="px-6 pt-4">
        <TabBar tabs={[...CHAT_TABS]} paramKey="tab" />
      </div>

      <div className="flex-1 min-h-0 pt-4">
        {activeTab === "chat" && <ChatCenterView />}
        {activeTab === "command" && (
          <div className="p-6">
            <ChatCommandView />
          </div>
        )}
      </div>
    </div>
  );
}
