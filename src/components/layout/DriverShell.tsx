import { APP_NAME } from "@/lib/constants";

interface DriverShellProps {
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

export function DriverShell({ children, headerRight }: DriverShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-container-low">
      <header className="sticky top-0 z-40 border-b border-outline bg-white industrial-shadow">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
              <span className="material-symbols-outlined text-xl">local_shipping</span>
            </div>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold tracking-tight truncate">
                {APP_NAME}
              </p>
              <p className="text-xs font-medium tracking-widest text-on-surface-variant">
                Panel del Conductor
              </p>
            </div>
          </div>
          {headerRight}
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
