import { BRANCH_LABELS, DEFAULT_BRANCH } from "@/lib/constants";

interface TopBarProps {
  title?: string;
  showSearch?: boolean;
  showBranchSelector?: boolean;
  children?: React.ReactNode;
}

export function TopBar({
  title,
  showSearch = true,
  showBranchSelector = true,
  children,
}: TopBarProps) {
  return (
    <header className="flex justify-between items-center w-full px-4 md:px-8 py-4 bg-surface-container-lowest border-b-2 border-on-background shrink-0">
      <div className="flex items-center gap-4 min-w-0">
        {title ? (
          <h1 className="font-display text-xl md:text-2xl font-extrabold uppercase tracking-tight truncate">
            {title}
          </h1>
        ) : (
          <>
            <div className="md:hidden font-bold text-primary text-xl">AS</div>
            {showSearch && (
              <div className="relative hidden sm:block">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                  <span className="material-symbols-outlined text-xl">
                    search
                  </span>
                </span>
                <input
                  className="pl-10 industrial-border bg-surface-container-low text-sm font-bold focus:ring-2 focus:ring-primary w-48 md:w-96 py-2"
                  placeholder="Buscar órdenes..."
                  type="search"
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-3 md:gap-4 shrink-0">
        {children}
        {showBranchSelector && !title && (
          <button
            type="button"
            className="hidden md:flex items-center gap-2 btn-secondary px-4 py-2 text-sm font-bold"
          >
            <span className="material-symbols-outlined">location_on</span>
            {BRANCH_LABELS[DEFAULT_BRANCH]}
          </button>
        )}
        <button
          type="button"
          className="material-symbols-outlined p-2 text-on-surface hover:bg-surface-container-high transition-colors"
          aria-label="Notificaciones"
        >
          notifications
        </button>
        <div className="w-10 h-10 industrial-border bg-gray-200 overflow-hidden flex items-center justify-center">
          <span className="material-symbols-outlined text-gray-600">person</span>
        </div>
      </div>
    </header>
  );
}
