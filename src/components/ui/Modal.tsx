"use client";

import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Cerrar modal"
      />
      <div
        className="relative bg-white industrial-border industrial-shadow w-full max-w-md animate-[slideIn_0.2s_ease-out]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex justify-between items-center p-4 border-b-2 border-black">
          <h2
            id="modal-title"
            className="font-display text-lg font-extrabold uppercase"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-surface-container transition-colors"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-4">{children}</div>
        {footer && (
          <div className="p-4 border-t-2 border-black bg-gray-50 flex gap-2 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
