"use client";

interface ProductSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  autoFocus?: boolean;
}

export function ProductSearchBar({
  value,
  onChange,
  placeholder = "Buscar por nombre o SKU...",
  helperText = "Mínimo 2 caracteres",
  autoFocus = false,
}: ProductSearchBarProps) {
  return (
    <div className="industrial-border bg-white industrial-shadow p-4 md:p-5 space-y-2">
      <label className="font-bold uppercase text-[10px] block">
        Buscar productos
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 pointer-events-none">
          <span className="material-symbols-outlined text-xl">search</span>
        </span>
        <input
          className="w-full industrial-border bg-surface-container-low pl-11 pr-11 py-3 text-sm font-medium min-h-[48px] focus:ring-2 focus:ring-primary"
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="off"
          autoFocus={autoFocus}
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute inset-y-0 right-2 flex items-center justify-center min-w-[44px] min-h-[44px] text-gray-500 hover:text-black"
            aria-label="Limpiar búsqueda"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}
      </div>
      {helperText && (
        <p className="text-[10px] font-bold uppercase opacity-60">{helperText}</p>
      )}
    </div>
  );
}
