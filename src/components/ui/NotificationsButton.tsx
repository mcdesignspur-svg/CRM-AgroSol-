"use client";

import { useEffect, useRef, useState } from "react";
import { notificationLogs } from "@/lib/data";

export function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="material-symbols-outlined p-2 text-on-surface hover:bg-surface-container-high transition-colors relative"
        aria-label="Notificaciones"
        aria-expanded={open}
      >
        notifications
        <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] bg-white industrial-border industrial-shadow z-50 animate-[slideIn_0.15s_ease-out]">
          <div className="p-3 border-b-2 border-black flex justify-between items-center">
            <span className="font-bold uppercase text-xs">Notificaciones</span>
            <span className="text-[10px] font-mono bg-black text-white px-2 py-0.5">
              {notificationLogs.length} nuevas
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {notificationLogs.map((log) => (
              <button
                key={log.id}
                type="button"
                onClick={() => setOpen(false)}
                className="w-full text-left p-3 border-b border-gray-200 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono font-bold">
                    {log.time}
                  </span>
                  <span className="text-[9px] font-bold uppercase bg-surface-container-high px-1">
                    {log.source}
                  </span>
                </div>
                <p className="text-xs font-medium">{log.message}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
