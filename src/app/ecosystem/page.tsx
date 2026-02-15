import { PageDebug } from "@/components/page-debug";

type Props = { searchParams?: Promise<{ ws?: string }> };

export default function EcosystemPage({ searchParams }: Props) {
  return <PageDebug title="Ecosystem" searchParams={searchParams} />;
}
