import { Suspense } from "react";
import { ContentPageClient } from "@/components/content-page-client";

export default function ContentPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
          <div className="h-64 animate-pulse rounded-xl bg-white/5" />
        </div>
      }
    >
      <ContentPageClient />
    </Suspense>
  );
}
