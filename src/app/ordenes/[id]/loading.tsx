import {
  PageLoadingShell,
  SkeletonBlock,
} from "@/components/ui/PageLoadingShell";

export default function OrderDetailLoading() {
  return (
    <PageLoadingShell>
      <SkeletonBlock className="h-4 w-32" />
      <SkeletonBlock className="h-10 w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonBlock className="h-64 lg:col-span-2 industrial-border" />
        <SkeletonBlock className="h-64 industrial-border" />
      </div>
      <SkeletonBlock className="h-48 industrial-border" />
    </PageLoadingShell>
  );
}
