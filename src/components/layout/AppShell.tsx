import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
  topBar?: React.ReactNode;
  fullWidth?: boolean;
}

export function AppShell({
  children,
  rightPanel,
  topBar,
  fullWidth = false,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {topBar}
        <div className="flex flex-1 min-h-0">
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 md:pb-0">
            {fullWidth ? (
              children
            ) : (
              <div className="w-full max-w-[1600px] mx-auto flex-1 flex flex-col min-h-0">
                {children}
              </div>
            )}
          </main>
          {rightPanel}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
