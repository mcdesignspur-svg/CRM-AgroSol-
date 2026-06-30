import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { branches } from "@/lib/data";

export const metadata = {
  title: "Sucursales",
};

const statusColors = {
  online: "bg-green-500",
  offline: "bg-red-500",
  warning: "bg-yellow-500",
};

export default function SucursalesPage() {
  return (
    <AppShell topBar={<TopBar title="Sucursales" showSearch={false} />}>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
        <div>
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight">
            Red de Sucursales
          </h2>
          <p className="text-lg text-on-surface-variant mt-2">
            Estado operativo y capacidad de cada ubicación Agrocentro Solá.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <article
              key={branch.id}
              className="industrial-border bg-white industrial-shadow p-6 flex flex-col gap-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-display text-xl font-bold uppercase">
                    {branch.name}
                  </h3>
                  <p className="text-sm text-on-surface-variant mt-1">
                    {branch.address}
                  </p>
                </div>
                <span
                  className={`w-3 h-3 rounded-full ${statusColors[branch.status]}`}
                  title={branch.status}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span>Capacidad</span>
                  <span>{branch.capacityPercent}%</span>
                </div>
                <div className="h-3 bg-gray-200 border border-black">
                  <div
                    className={`h-full ${
                      branch.capacityPercent >= 90
                        ? "bg-primary"
                        : branch.capacityPercent >= 70
                          ? "bg-secondary-container"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${branch.capacityPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-end pt-2 border-t border-gray-200">
                <div>
                  <p className="text-[10px] font-bold uppercase text-on-surface-variant">
                    Volumen Actual
                  </p>
                  <p className="text-2xl font-extrabold">
                    {branch.currentVolume}{" "}
                    <span className="text-sm font-medium">unidades</span>
                  </p>
                </div>
                <Link
                  href={`/entregas?branch=${branch.id}`}
                  className="btn-primary px-4 py-2 text-xs font-bold uppercase industrial-border"
                >
                  Ver Entregas
                </Link>
              </div>

              {branch.lastPingSent && (
                <p className="text-[10px] font-bold uppercase text-green-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">
                    check_circle
                  </span>
                  {branch.lastPingSent}
                </p>
              )}
            </article>
          ))}
        </div>

        <section className="industrial-border bg-white p-6">
          <h3 className="font-display text-lg font-bold uppercase mb-4">
            Resumen de Red
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-surface-container-low">
              <p className="text-3xl font-extrabold">{branches.length}</p>
              <p className="text-xs font-bold uppercase mt-1">Sucursales</p>
            </div>
            <div className="text-center p-4 bg-surface-container-low">
              <p className="text-3xl font-extrabold">
                {branches.reduce((s, b) => s + b.currentVolume, 0)}
              </p>
              <p className="text-xs font-bold uppercase mt-1">
                Unidades Totales
              </p>
            </div>
            <div className="text-center p-4 bg-surface-container-low">
              <p className="text-3xl font-extrabold">
                {Math.round(
                  branches.reduce((s, b) => s + b.capacityPercent, 0) /
                    branches.length,
                )}
                %
              </p>
              <p className="text-xs font-bold uppercase mt-1">
                Capacidad Promedio
              </p>
            </div>
            <div className="text-center p-4 bg-surface-container-low">
              <p className="text-3xl font-extrabold text-primary">
                {branches.filter((b) => b.status === "warning").length}
              </p>
              <p className="text-xs font-bold uppercase mt-1">Alertas</p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
