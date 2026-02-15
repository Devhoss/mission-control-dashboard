import { Suspense } from "react";
import { DashboardOverview } from "@/components/dashboard-overview";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center p-6">
          <div className="glass-card w-full max-w-2xl p-8 animate-pulse">
            <div className="h-5 w-32 bg-white/10 rounded" />
            <div className="mt-3 h-3 w-full bg-white/10 rounded" />
            <div className="mt-2 h-3 w-3/4 bg-white/10 rounded" />
          </div>
        </div>
      }
    >
      <DashboardOverview />
    </Suspense>
  );
}
