import Link from "next/link";
import type { Ping } from "@/lib/types";

const priorityStyles: Record<
  Ping["priority"],
  { badge: string; border: string }
> = {
  urgente: {
    badge: "bg-primary text-white",
    border: "industrial-border bg-white industrial-shadow",
  },
  sistema: {
    badge: "text-primary",
    border: "border-l-4 border-primary bg-surface-container",
  },
  advertencia: {
    badge: "text-secondary",
    border: "border-l-4 border-secondary bg-surface-container",
  },
};

export function LivePingsPanel({ pings }: { pings: Ping[] }) {
  return (
    <aside className="hidden lg:flex flex-col w-80 border-l-2 border-on-background bg-surface-container-lowest h-full shrink-0">
      <div className="p-6 border-b-2 border-on-background flex items-center gap-3">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
        </div>
        <h3 className="font-display text-sm font-extrabold uppercase">
          Pings en Vivo
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {pings.map((ping) => {
          const styles = priorityStyles[ping.priority];
          return (
            <div key={ping.id} className={`p-4 ${styles.border}`}>
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 ${styles.badge}`}
                >
                  {ping.priority === "urgente"
                    ? "Urgente"
                    : ping.priority === "sistema"
                      ? "Sistema"
                      : "Advertencia"}
                </span>
                <span className="text-[10px] font-mono opacity-60">
                  {ping.timeAgo}
                </span>
              </div>
              <p className="text-sm font-bold">{ping.title}</p>
              <p className="text-xs text-on-surface-variant mt-1">
                {ping.description}
              </p>
              {ping.priority === "urgente" && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="text-[10px] font-bold uppercase border border-black px-2 py-1"
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    className="text-[10px] font-bold uppercase bg-black text-white px-2 py-1"
                  >
                    Llamar
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <div className="pt-8 opacity-20 text-center">
          <span className="material-symbols-outlined text-6xl">history</span>
          <p className="text-xs font-bold uppercase mt-2">
            Fin del historial reciente
          </p>
        </div>
      </div>

      <div className="p-6 border-t-2 border-on-background bg-gray-50">
        <div className="industrial-border p-3 bg-white text-center">
          <p className="text-[10px] font-bold uppercase mb-2">
            Estado de la Red
          </p>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1 text-[10px] font-bold">
              <span className="w-2 h-2 rounded-full bg-green-500" /> GUR
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold">
              <span className="w-2 h-2 rounded-full bg-green-500" /> SLZ
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500" /> NAV
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function DashboardHeader() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
      <div>
        <h2 className="font-display text-3xl md:text-4xl font-extrabold uppercase tracking-tight">
          Panel de Logística
        </h2>
        <p className="text-lg text-on-surface-variant">
          Supervisión en tiempo real de la red Agrocentro Solá.
        </p>
      </div>
      <div className="flex gap-4">
        <button
          type="button"
          className="btn-secondary px-6 py-3 text-sm font-bold uppercase"
        >
          Exportar Datos
        </button>
        <Link
          href="/ordenes/nueva"
          className="btn-primary px-6 py-3 text-sm font-bold uppercase industrial-border inline-flex items-center"
        >
          Crear Nueva Orden
        </Link>
      </div>
    </div>
  );
}
