"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NotificationLog } from "@/lib/types";

export function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasNotifications = logs.length > 0;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setLogs(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleToggle() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      await fetchLogs();
    }
  }

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
        onClick={handleToggle}
        className="material-symbols-outlined p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors relative"
        aria-label="Notificaciones"
        aria-expanded={open}
      >
        notifications
        {hasNotifications && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] bg-white border border-outline rounded-xl shadow-lg z-50 animate-[slideIn_0.15s_ease-out] overflow-hidden">
          <div className="px-4 py-3 border-b border-outline flex justify-between items-center">
            <span className="font-medium text-sm text-on-surface">
              Notificaciones
            </span>
            {hasNotifications && (
              <span className="text-xs font-medium bg-primary-container text-primary px-2 py-0.5 rounded-full">
                {logs.length}
              </span>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {loading ? (
              <p className="p-6 text-center text-xs text-on-surface-variant">
                Cargando...
              </p>
            ) : hasNotifications ? (
              logs.map((log) => (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full text-left px-4 py-3 border-b border-outline last:border-0 hover:bg-surface transition-colors"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono text-on-surface-variant">
                      {log.time}
                    </span>
                    <span className="text-xs font-medium bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant">
                      {log.source}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface">{log.message}</p>
                </button>
              ))
            ) : (
              <p className="p-6 text-center text-xs text-on-surface-variant">
                Sin notificaciones
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
