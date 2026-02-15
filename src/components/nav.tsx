"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Settings,
  Bot,
  MessageSquare,
  FileText,
  Radio,
  BookOpen,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/hooks/use-workspace";
import { WorkspaceSwitcher } from "./workspace-switcher";

const navItems = [
  { href: "/", label: "HOME", icon: Home },
  { href: "/ops", label: "OPS", icon: Settings },
  { href: "/agents", label: "AGENTS", icon: Bot },
  { href: "/chat", label: "CHAT", icon: MessageSquare },
  { href: "/content", label: "CONTENT", icon: FileText },
  { href: "/comms", label: "COMMS", icon: Radio },
  { href: "/knowledge", label: "KNOWLEDGE", icon: BookOpen },
  { href: "/code", label: "CODE", icon: Code2 },
] as const;

function hrefWithWorkspace(href: string, ws: string | null | undefined): string {
  if (ws == null || ws === "") return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}ws=${encodeURIComponent(ws)}`;
}

export function Nav() {
  const pathname = usePathname();
  const { workspaceParam } = useWorkspace();

  return (
    <nav
      className="sticky top-0 z-50 flex h-12 items-center gap-1 border-b border-white/[0.06] bg-white/[0.03] px-3 backdrop-blur-xl"
      style={{ fontSize: "clamp(0.45rem, 0.75vw, 0.6875rem)" }}
    >
      <div className="mr-4 shrink-0">
        <WorkspaceSwitcher />
      </div>

      <div className="flex flex-1 items-center gap-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
          const hrefWithWs = hrefWithWorkspace(href, workspaceParam);
          return (
            <Link
              key={href}
              href={hrefWithWs}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium uppercase tracking-wide transition-colors",
                isActive
                  ? "bg-primary/[0.06] text-primary"
                  : "text-[var(--color-foreground-muted)] hover:bg-white/[0.04] hover:text-[var(--color-foreground)]"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
