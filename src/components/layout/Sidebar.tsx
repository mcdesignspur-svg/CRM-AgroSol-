"use client";

import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { SidebarNav } from "./SidebarNav";
import { useSidebarModals } from "./SidebarModals";

export function Sidebar() {
  const { modals, openConfig, openSupport } = useSidebarModals();

  return (
    <>
      <aside className="hidden md:flex flex-col w-60 border-r border-outline bg-white py-8 h-full shrink-0">
        <div className="px-5 mb-8">
          <h1 className="font-display text-xl font-semibold text-primary tracking-tight">
            {APP_NAME}
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
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
