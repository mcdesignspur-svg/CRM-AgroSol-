import {
  PageLoadingShell,
  SkeletonBlock,
} from "@/components/ui/PageLoadingShell";

export default function InventarioLoading() {
  return (
    <PageLoadingShell>
      <SkeletonBlock className="h-10 w-48" />
      <SkeletonBlock className="h-5 w-72 max-w-full" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-20 industrial-border" />
        ))}
      </div>
      <SkeletonBlock className="h-12 w-full industrial-border" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-32 industrial-border" />
        ))}
      </div>
    </PageLoadingShell>
  );
}
