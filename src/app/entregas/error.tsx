"use client";

import Link from "next/link";

export default function EntregasError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border-2 border-black p-8 industrial-shadow space-y-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-3xl text-primary-container">
            error
          </span>
          <h1 className="font-display text-xl font-extrabold uppercase">
            Error al cargar Entregas
          </h1>
        </div>

        <p className="text-sm text-on-surface-variant">
          No se pudo conectar con los datos de entregas. Suele ocurrir cuando la
          base de datos no tiene aplicada la última migración (
          <code className="font-mono text-xs">delivery_order_link</code>
          ).
        </p>

        <div className="bg-surface-container-low border border-black p-3 text-xs font-mono break-all">
          {error.message || "Error interno del servidor"}
          {error.digest ? (
            <div className="mt-2 text-on-surface-variant">
              Referencia: {error.digest}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={reset}
            className="btn-primary px-4 py-3 text-xs font-bold uppercase min-h-[44px]"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="btn-secondary px-4 py-3 text-xs font-bold uppercase min-h-[44px] text-center"
          >
            Volver al Panel
          </Link>
        </div>

        <p className="text-[11px] text-on-surface-variant">
          Si administras el proyecto, ejecuta{" "}
          <code className="font-mono">npm run db:deploy</code> contra la base de
          producción y vuelve a desplegar.
        </p>
      </div>
    </div>
  );
}
