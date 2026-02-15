import { PageDebug } from "@/components/page-debug";

type Props = { searchParams?: Promise<{ ws?: string }> };

export default function CodePage({ searchParams }: Props) {
  return <PageDebug title="Code" searchParams={searchParams} />;
}
