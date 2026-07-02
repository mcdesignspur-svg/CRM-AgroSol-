"use client";

import Link from "next/link";

export default function RootError({
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
            Error de la Aplicación
          </h1>
        </div>

        <p className="text-sm text-on-surface-variant">
          Ocurrió un error inesperado al cargar esta página. Puedes reintentar
          o volver al panel principal.
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
      </div>
    </div>
  );
}
