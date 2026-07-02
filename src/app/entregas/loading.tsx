import {
  PageLoadingShell,
  SkeletonBlock,
} from "@/components/ui/PageLoadingShell";

export default function EntregasLoading() {
  return (
    <PageLoadingShell>
      <SkeletonBlock className="h-10 w-72" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[60vh]">
        <SkeletonBlock className="lg:col-span-2 h-full min-h-64 industrial-border" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-24 industrial-border" />
          ))}
        </div>
      </div>
    </PageLoadingShell>
  );
}
