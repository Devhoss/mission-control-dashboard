import { getDefaultWorkspace } from "@/lib/workspace-path";

type SearchParams = Promise<{ ws?: string }>;

export async function PageDebug({
  title,
  searchParams,
}: {
  title: string;
  searchParams?: SearchParams;
}) {
  const params: { ws?: string } = searchParams ? await searchParams : {};
  const workspace = params.ws?.trim() ? params.ws : getDefaultWorkspace();

  return (
    <div className="p-6">
      <h1 className="text-sm font-medium text-[var(--color-foreground)]">
        {title}
      </h1>
      <p className="mt-1 text-[var(--color-foreground-muted)]" style={{ fontSize: "clamp(0.625rem, 0.75vw, 0.875rem)" }}>
        Workspace: <span className="font-mono text-[var(--color-foreground)]">{workspace}</span>
      </p>
    </div>
  );
}
