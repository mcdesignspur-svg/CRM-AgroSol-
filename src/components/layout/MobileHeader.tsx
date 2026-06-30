"use client";

import { HamburgerButton } from "./HamburgerButton";

interface MobileHeaderProps {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function MobileHeader({ title, subtitle, right }: MobileHeaderProps) {
  return (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <HamburgerButton />
      <div className="min-w-0 flex-1">
        {title ? (
          <>
            <h1 className="font-display text-base sm:text-lg font-extrabold uppercase tracking-tight truncate leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[10px] font-bold uppercase text-on-surface-variant truncate">
                {subtitle}
              </p>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-extrabold text-primary leading-none">
              AgroSol
            </span>
            <span className="text-[10px] font-bold uppercase text-on-surface-variant">
              CRM
            </span>
          </div>
        )}
      </div>
      {right}
    </div>
  );
}
