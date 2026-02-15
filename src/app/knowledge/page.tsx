import { PageDebug } from "@/components/page-debug";

type Props = { searchParams?: Promise<{ ws?: string }> };

export default function KnowledgePage({ searchParams }: Props) {
  return <PageDebug title="Knowledge" searchParams={searchParams} />;
}
