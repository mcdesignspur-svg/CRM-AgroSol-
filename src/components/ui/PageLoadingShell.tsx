function SkeletonBar({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`bg-surface-container animate-pulse rounded-lg ${className}`}
    />
  );
}

export function PageLoadingShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden md:block w-60 shrink-0 border-r border-outline bg-white">
        <div className="p-6 space-y-4">
          <SkeletonBar className="h-8 w-32" />
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBar key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 border-b border-outline bg-white px-4 flex items-center gap-4">
          <SkeletonBar className="h-6 w-40" />
          <SkeletonBar className="h-8 w-48 ml-auto hidden sm:block" />
        </div>
        <div className="flex-1 overflow-hidden p-4 md:p-8 space-y-6 pb-20 md:pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}

export function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return <SkeletonBar className={className} />;
}
