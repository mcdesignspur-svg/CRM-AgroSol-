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
  fullWidth,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className={`flex-1 flex flex-col min-w-0 ${fullWidth ? "" : ""}`}>
        {topBar}
        <div className="flex flex-1 min-h-0">
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {children}
          </main>
          {rightPanel}
        </div>
      </div>
    </div>
  );
}
