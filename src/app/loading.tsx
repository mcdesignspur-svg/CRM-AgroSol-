import {
  PageLoadingShell,
  SkeletonBlock,
} from "@/components/ui/PageLoadingShell";

export default function DashboardLoading() {
  return (
    <PageLoadingShell>
      <SkeletonBlock className="h-10 w-72" />
      <SkeletonBlock className="h-5 w-96 max-w-full" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28 industrial-border" />
        ))}
      </div>
      <SkeletonBlock className="h-96 industrial-border" />
    </PageLoadingShell>
  );
}
