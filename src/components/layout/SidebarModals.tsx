"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/providers/ToastProvider";

export function useSidebarModals() {
  const { showToast } = useToast();
  const [configOpen, setConfigOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const modals = (
    <>
      <Modal
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        title="Configuración"
        footer={
          <button
            type="button"
            onClick={() => {
              setConfigOpen(false);
              showToast("Preferencias guardadas", "success");
            }}
            className="btn-primary px-4 py-2 text-xs font-bold uppercase industrial-border min-h-[44px]"
          >
            Guardar
          </button>
        }
      >
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
            <input type="checkbox" className="w-4 h-4" />
            <span className="text-sm font-bold">Notificaciones push activas</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
            <input type="checkbox" className="w-4 h-4" />
            <span className="text-sm font-bold">Alertas de inventario bajo</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
            <input type="checkbox" className="w-4 h-4" />
            <span className="text-sm font-bold">Modo oscuro</span>
          </label>
        </div>
      </Modal>

      <Modal open={supportOpen} onClose={() => setSupportOpen(false)} title="Soporte">
        <div className="space-y-4 text-sm">
          <p className="font-medium">
            Contacta al administrador del sistema para asistencia técnica.
          </p>
          <button
            type="button"
            onClick={() => {
              setSupportOpen(false);
              showToast("Solicitud de soporte registrada", "success");
            }}
            className="w-full btn-secondary py-3 text-xs font-bold uppercase min-h-[44px]"
          >
            Abrir Ticket
          </button>
        </div>
      </Modal>
    </>
  );

  return {
    modals,
    openConfig: () => setConfigOpen(true),
    openSupport: () => setSupportOpen(true),
  };
}
