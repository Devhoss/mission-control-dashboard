"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Send, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAutoRefreshQuery } from "@/hooks/use-auto-refresh";
import { VoiceInput } from "@/components/voice-input";
import { cn } from "@/lib/utils";

type SessionItem = {
  id: string;
  file: string;
  channel?: string;
  updatedAt?: string;
  messageCount?: number;
  preview?: string;
};

type ChatHistoryData = {
  workspace: string;
  sessions: SessionItem[];
  pagination: { page: number; pageSize: number; total: number };
};

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
  channel?: string;
};

type ChatSessionData = {
  workspace: string;
  file: string;
  messages: Message[];
};

export function ChatCenterView() {
  const { workspace } = useWorkspace();
  const query = workspace ? `?ws=${encodeURIComponent(workspace)}` : "";
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [channel, setChannel] = useState<"telegram" | "discord" | "webchat">("webchat");
  const [sending, setSending] = useState(false);
  const [optimisticMessage, setOptimisticMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listQuery = `${query}&page=1&pageSize=50${searchQ ? `&q=${encodeURIComponent(searchQ)}` : ""}${channelFilter ? `&channel=${encodeURIComponent(channelFilter)}` : ""}`;

  const history = useAutoRefreshQuery<ChatHistoryData>(
    `/api/chat-history${listQuery}`,
    { intervalMs: 15000 }
  );

  const sessionUrl =
    selectedFile && workspace
      ? `/api/chat-session${query}&file=${encodeURIComponent(selectedFile)}`
      : null;

  const session = useAutoRefreshQuery<ChatSessionData | null>(
    sessionUrl ?? "",
    { intervalMs: 10000, enabled: !!sessionUrl }
  );

  const messages = session.data?.messages ?? [];
  const displayMessages = optimisticMessage
    ? [...messages, optimisticMessage]
    : messages;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (selectedFile && (session.data || session.loading === false)) {
      scrollToBottom();
    }
  }, [selectedFile, session.data, session.loading, scrollToBottom]);

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || sending || !workspace) return;
    setInputValue("");
    const tempId = `opt-${Date.now()}`;
    setOptimisticMessage({
      id: tempId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
      channel,
    });
    setSending(true);
    try {
      const res = await fetch(`/api/chat-send${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, channel }),
      });
      if (res.ok) {
        history.refetch();
      }
    } finally {
      setSending(false);
      setOptimisticMessage(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setInputValue((prev) => (prev ? `${prev} ${text}` : text));
  };

  const formatDate = (iso?: string) => {
    if (!iso) return null;
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    return d.toLocaleDateString();
  };

  let lastDate: string | null = null;

  return (
    <div className="flex h-[calc(100vh-3rem-8rem)] min-h-0">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-white/[0.06] flex flex-col bg-white/[0.02]">
        <div className="p-2 border-b border-white/[0.06] flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-[var(--color-foreground-muted)]" />
          <Input
            placeholder="Search sessions..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="h-8 text-xs bg-white/[0.04] border-white/[0.06] flex-1"
          />
        </div>
        <div className="p-2">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="w-full h-7 rounded-md border border-white/[0.06] bg-white/[0.04] px-2 text-[10px] text-[var(--color-foreground)]"
          >
            <option value="">All channels</option>
            <option value="telegram">Telegram</option>
            <option value="discord">Discord</option>
            <option value="webchat">Webchat</option>
          </select>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {history.loading && !history.data && (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg bg-white/10 animate-pulse"
                />
              ))}
            </>
          )}
          {!history.loading && history.data?.sessions?.length === 0 && (
            <p className="text-[10px] text-[var(--color-foreground-muted)] p-2">
              No sessions found.
            </p>
          )}
          {history.data?.sessions?.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedFile(s.file)}
              className={cn(
                "w-full text-left rounded-lg p-2 border transition-colors",
                selectedFile === s.file
                  ? "bg-primary/[0.12] border-primary/30"
                  : "border-transparent hover:bg-white/[0.04]"
              )}
            >
              <p className="text-[10px] font-medium text-[var(--color-foreground)] truncate">
                {s.file.split("/").pop() ?? s.file}
              </p>
              {s.preview && (
                <p className="text-[9px] text-[var(--color-foreground-muted)] truncate mt-0.5">
                  {s.preview}
                </p>
              )}
              <div className="flex items-center gap-1.5 mt-1">
                {s.channel && (
                  <Badge variant="secondary" className="text-[8px] px-1 py-0">
                    {s.channel}
                  </Badge>
                )}
                {s.updatedAt && (
                  <span className="text-[8px] text-[var(--color-foreground-muted)]">
                    {new Date(s.updatedAt).toLocaleString()}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedFile ? (
          <>
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
              <p className="text-[10px] text-[var(--color-foreground-muted)] truncate">
                {selectedFile}
              </p>
              <Badge variant="secondary" className="text-[9px]">
                LIVE
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {session.loading && selectedFile && !session.data && (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-12 rounded-lg animate-pulse bg-white/10",
                        i % 2 === 0 ? "ml-8" : "mr-8"
                      )}
                    />
                  ))}
                </>
              )}
              {!session.loading &&
                displayMessages.map((msg) => {
                  const dateLabel = formatDate(msg.createdAt);
                  const showDate = dateLabel && dateLabel !== lastDate;
                  if (showDate) lastDate = dateLabel;
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <p className="text-center text-[9px] text-[var(--color-foreground-muted)] py-2">
                          — {dateLabel} —
                        </p>
                      )}
                      <div
                        className={cn(
                          "flex",
                          msg.role === "user" && "justify-end",
                          msg.role === "assistant" && "justify-start",
                          msg.role === "system" && "justify-center"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-lg px-3 py-2 text-[10px]",
                            msg.role === "user" &&
                              "bg-primary/20 text-[var(--color-foreground)]",
                            msg.role === "assistant" &&
                              "bg-white/[0.06] text-[var(--color-foreground)]",
                            msg.role === "system" &&
                              "bg-white/[0.03] text-[var(--color-foreground-muted)] text-center"
                          )}
                        >
                          {msg.channel && (
                            <Badge
                              variant="outline"
                              className="text-[8px] mb-1 mr-1"
                            >
                              {msg.channel}
                            </Badge>
                          )}
                          <p className="whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                          {msg.createdAt && (
                            <p className="text-[8px] opacity-70 mt-1">
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              <div ref={messagesEndRef} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--color-foreground-muted)]">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Select a session from the sidebar</p>
            </div>
          </div>
        )}

        {/* Composer */}
        <div className="border-t border-white/[0.06] p-3 bg-white/[0.02]">
          <div className="flex gap-2 items-end">
            <div className="flex-1 flex flex-col gap-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
                className="w-full min-h-[2.5rem] max-h-32 resize-y rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-foreground-muted)] focus:outline-none focus:ring-2 focus:ring-white/20"
                rows={2}
              />
              <div className="flex items-center gap-2">
                <select
                  value={channel}
                  onChange={(e) =>
                    setChannel(
                      e.target.value as "telegram" | "discord" | "webchat"
                    )
                  }
                  className="h-7 rounded-md border border-white/[0.06] bg-white/[0.04] px-2 text-[10px] text-[var(--color-foreground)]"
                >
                  <option value="webchat">Webchat</option>
                  <option value="telegram">Telegram</option>
                  <option value="discord">Discord</option>
                </select>
                <VoiceInput onTranscript={handleVoiceTranscript} />
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!inputValue.trim() || sending}
              className="h-9 shrink-0"
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
