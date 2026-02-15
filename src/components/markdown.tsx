"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MarkdownProps = {
  content: string;
  className?: string;
};

export function Markdown({ content, className }: MarkdownProps) {
  if (!content.trim()) return null;

  const lines = content.split(/\n/);
  const nodes: ReactNode[] = [];
  let i = 0;
  let inCodeBlock = false;
  let codeBlockLang = "";
  let codeLines: string[] = [];

  function flushCodeBlock() {
    if (codeLines.length > 0) {
      nodes.push(
        <pre
          key={`code-${i}`}
          className="my-2 overflow-x-auto rounded-lg border border-white/[0.06] bg-white/[0.04] p-3 text-[10px] font-mono text-[var(--color-foreground)]"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      codeLines = [];
    }
    inCodeBlock = false;
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      i++;
      continue;
    }

    if (trimmed.startsWith("> ")) {
      nodes.push(
        <blockquote
          key={i}
          className="border-l-2 border-primary/50 pl-3 my-1.5 text-[10px] text-[var(--color-foreground-muted)]"
        >
          {parseInline(trimmed.slice(2))}
        </blockquote>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      nodes.push(
        <h3 key={i} className="text-xs font-semibold mt-3 mb-1 text-[var(--color-foreground)]">
          {parseInline(trimmed.slice(4))}
        </h3>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      nodes.push(
        <h2 key={i} className="text-xs font-semibold mt-3 mb-1 text-[var(--color-foreground)]">
          {parseInline(trimmed.slice(3))}
        </h2>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      nodes.push(
        <h1 key={i} className="text-xs font-semibold mt-2 mb-1 text-[var(--color-foreground)]">
          {parseInline(trimmed.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      nodes.push(
        <li key={i} className="ml-4 list-disc text-[10px] text-[var(--color-foreground-muted)] my-0.5">
          {parseInline(trimmed.slice(2))}
        </li>
      );
      i++;
      continue;
    }

    if (trimmed === "") {
      nodes.push(<br key={i} />);
      i++;
      continue;
    }

    nodes.push(
      <p key={i} className="text-[10px] text-[var(--color-foreground-muted)] my-1 leading-relaxed">
        {parseInline(trimmed)}
      </p>
    );
    i++;
  }

  flushCodeBlock();

  return (
    <div
      className={cn(
        "markdown-content text-[var(--color-foreground)]",
        className
      )}
    >
      {nodes}
    </div>
  );
}

function parseInline(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const codeMatch = remaining.match(/^`([^`]+)`/);
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    const boldUnderscore = remaining.match(/^__([^_]+)__/);
    const italicUnderscore = remaining.match(/^_([^_]+)_/);

    if (codeMatch) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-white/[0.08] px-1 font-mono text-[10px]"
        >
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }
    if (boldMatch) {
      parts.push(
        <strong key={key++} className="font-semibold">
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }
    if (italicMatch) {
      parts.push(
        <em key={key++} className="italic">
          {italicMatch[1]}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }
    if (boldUnderscore) {
      parts.push(
        <strong key={key++} className="font-semibold">
          {boldUnderscore[1]}
        </strong>
      );
      remaining = remaining.slice(boldUnderscore[0].length);
      continue;
    }
    if (italicUnderscore) {
      parts.push(
        <em key={key++} className="italic">
          {italicUnderscore[1]}
        </em>
      );
      remaining = remaining.slice(italicUnderscore[0].length);
      continue;
    }

    const nextSpecial = remaining.search(/[`*_]/);
    if (nextSpecial === -1) {
      parts.push(remaining);
      break;
    }
    parts.push(remaining.slice(0, nextSpecial));
    remaining = remaining.slice(nextSpecial);
  }

  return <>{parts}</>;
}
