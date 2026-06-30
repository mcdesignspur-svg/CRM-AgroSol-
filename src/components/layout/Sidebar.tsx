"use client";

import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { SidebarNav } from "./SidebarNav";
import { useSidebarModals } from "./SidebarModals";

export function Sidebar() {
  const { modals, openConfig, openSupport } = useSidebarModals();

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 border-r-2 border-on-background bg-surface-container-lowest py-10 h-full shrink-0">
        <div className="px-6 mb-10">
          <h1 className="font-display text-2xl font-extrabold text-primary">
            {APP_NAME}
          </h1>
          <p className="text-xs font-bold opacity-70 uppercase tracking-wide">
            {APP_TAGLINE}
          </p>
        </div>

        <SidebarNav
          onConfigClick={openConfig}
          onSupportClick={openSupport}
        />
      </aside>

      {modals}
    </>
  );
}
