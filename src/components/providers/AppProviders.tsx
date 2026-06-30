"use client";

import { BranchProvider } from "./BranchProvider";
import { MobileNavProvider } from "./MobileNavProvider";
import { ToastProvider } from "./ToastProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <BranchProvider>
        <MobileNavProvider>{children}</MobileNavProvider>
      </BranchProvider>
    </ToastProvider>
  );
}
