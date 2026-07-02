import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-container-low flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border-2 border-black p-8 industrial-shadow space-y-4 text-center">
        <span className="material-symbols-outlined text-5xl text-primary">
          search_off
        </span>
        <h1 className="font-display text-2xl font-extrabold uppercase">
          Página No Encontrada
        </h1>
        <p className="text-sm text-on-surface-variant">
          La ruta solicitada no existe en el CRM Agrocentro Solá.
        </p>
        <Link
          href="/"
          className="btn-primary inline-flex px-6 py-3 text-xs font-bold uppercase industrial-border min-h-[44px] items-center justify-center"
        >
          Volver al Panel
        </Link>
      </div>
    </div>
  );
}
