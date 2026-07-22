import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { getBranches } from "@/lib/db";

export const metadata = {
  title: "Sucursales",
};

export const dynamic = "force-dynamic";

const statusColors = {
  online: "bg-emerald-500",
  offline: "bg-red-500",
  warning: "bg-amber-400",
};

export default async function SucursalesPage() {
  const branches = await getBranches();

  return (
    <AppShell topBar={<TopBar title="Sucursales" showSearch={false} />}>
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-10">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-on-surface">
            Red de sucursales
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Estado operativo y capacidad de cada ubicación Agrocentro y
            Ferretería Solá.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <article
              key={branch.id}
              className="rounded-xl border border-outline bg-white shadow-sm p-5 flex flex-col gap-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-display text-lg font-semibold text-on-surface">
                    {branch.name}
                  </h3>
                  <p className="text-sm text-on-surface-variant mt-0.5">
                    {branch.address}
                  </p>
                </div>
                <span
                  className={`w-2.5 h-2.5 rounded-full mt-1.5 ${statusColors[branch.status]}`}
                  title={branch.status}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-on-surface-variant">
                  <span>Capacidad</span>
                  <span>{branch.capacityPercent}%</span>
                </div>
                <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      branch.capacityPercent >= 90
                        ? "bg-primary"
                        : branch.capacityPercent >= 70
                          ? "bg-amber-400"
                          : "bg-emerald-500"
                    }`}
                    style={{ width: `${branch.capacityPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-end pt-3 border-t border-outline">
                <div>
                  <p className="text-xs text-on-surface-variant">
                    Volumen actual
                  </p>
                  <p className="text-xl font-semibold text-on-surface">
                    {branch.currentVolume}{" "}
                    <span className="text-sm font-normal text-on-surface-variant">
                      unidades
                    </span>
                  </p>
                </div>
                <Link
                  href={`/entregas?branch=${branch.id}`}
                  className="btn-primary px-3 py-2 text-xs min-h-[36px]"
                >
                  Ver entregas
                </Link>
              </div>

              {branch.lastPingSent && (
                <p className="text-xs text-emerald-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">
                    check_circle
                  </span>
                  {branch.lastPingSent}
                </p>
              )}
            </article>
          ))}
        </div>

        <section className="rounded-xl border border-outline bg-white p-5 shadow-sm">
          <h3 className="font-display text-base font-semibold text-on-surface mb-4">
            Resumen de red
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-4 rounded-lg bg-surface">
              <p className="text-2xl font-semibold text-on-surface">
                {branches.length}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">Sucursales</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-surface">
              <p className="text-2xl font-semibold text-on-surface">
                {branches.reduce((s, b) => s + b.currentVolume, 0)}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                Unidades totales
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-surface">
              <p className="text-2xl font-semibold text-on-surface">
                {branches.length > 0
                  ? Math.round(
                      branches.reduce((s, b) => s + b.capacityPercent, 0) /
                        branches.length,
                    )
                  : 0}
                %
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                Capacidad promedio
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-surface">
              <p className="text-2xl font-semibold text-primary">
                {branches.filter((b) => b.status === "warning").length}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">Alertas</p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
