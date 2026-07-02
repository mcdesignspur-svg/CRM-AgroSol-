import {
  PageLoadingShell,
  SkeletonBlock,
} from "@/components/ui/PageLoadingShell";

export default function SucursalesLoading() {
  return (
    <PageLoadingShell>
      <SkeletonBlock className="h-10 w-64" />
      <SkeletonBlock className="h-5 w-96 max-w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-56 industrial-border" />
        ))}
      </div>
      <SkeletonBlock className="h-40 industrial-border" />
    </PageLoadingShell>
  );
}
