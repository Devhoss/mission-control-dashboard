import { getDefaultWorkspace } from "@/lib/workspace-path";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ ws?: string }>;
};

export default async function EcosystemSlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await (searchParams ?? Promise.resolve({} as { ws?: string }));
  const workspace = sp.ws?.trim() ? sp.ws : getDefaultWorkspace();

  return (
    <div className="p-6">
      <h1 className="text-sm font-medium text-[var(--color-foreground)]">
        Ecosystem / {slug}
      </h1>
      <p className="mt-1 text-[var(--color-foreground-muted)]" style={{ fontSize: "clamp(0.625rem, 0.75vw, 0.875rem)" }}>
        Workspace: <span className="font-mono text-[var(--color-foreground)]">{workspace}</span>
      </p>
    </div>
  );
}
