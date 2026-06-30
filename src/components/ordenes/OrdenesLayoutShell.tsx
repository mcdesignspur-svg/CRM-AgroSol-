"use client";

import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { OrdenesSubNav } from "@/components/ordenes/OrdenesSubNav";

interface OrdenesLayoutShellProps {
  children: React.ReactNode;
}

export function OrdenesLayoutShell({ children }: OrdenesLayoutShellProps) {
  return (
    <AppShell topBar={<TopBar title="Órdenes" showSearch={false} />}>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-10">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
              Gestión de Órdenes
            </h2>
            <p className="text-lg text-on-surface-variant mt-2">
              Administra el listado o registra una nueva orden.
            </p>
          </div>
          <OrdenesSubNav />
        </div>
        {children}
      </div>
    </AppShell>
  );
}
