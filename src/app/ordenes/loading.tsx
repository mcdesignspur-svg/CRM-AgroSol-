import {
  PageLoadingShell,
  SkeletonBlock,
} from "@/components/ui/PageLoadingShell";

export default function OrdenesLoading() {
  return (
    <PageLoadingShell>
      <SkeletonBlock className="h-10 w-64" />
      <SkeletonBlock className="h-5 w-80 max-w-full" />
      <SkeletonBlock className="h-14 w-full industrial-border" />
      <SkeletonBlock className="h-80 industrial-border" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-16 border border-outline" />
        ))}
      </div>
    </PageLoadingShell>
  );
}
