"use client";

import { BranchProvider } from "./BranchProvider";
import { ToastProvider } from "./ToastProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <BranchProvider>{children}</BranchProvider>
    </ToastProvider>
  );
}
