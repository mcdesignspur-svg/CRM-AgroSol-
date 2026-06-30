"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/providers/ToastProvider";
import { BRANCH_LABELS } from "@/lib/constants";
import type { BranchId } from "@/lib/types";

export function useSidebarModals() {
  const { showToast } = useToast();
  const [pingOpen, setPingOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [pingBranch, setPingBranch] = useState<BranchId>("gurabo");
  const [pingMessage, setPingMessage] = useState("");
  const [sendingPing, setSendingPing] = useState(false);

  async function handleQuickPing() {
    setSendingPing(true);
    await new Promise((r) => setTimeout(r, 800));
    setSendingPing(false);
    setPingOpen(false);
    setPingMessage("");
    showToast(`Ping enviado a ${BRANCH_LABELS[pingBranch]}`, "success");
  }

  const modals = (
    <>
      <Modal
        open={pingOpen}
        onClose={() => setPingOpen(false)}
        title="Ping Rápido"
        footer={
          <>
            <button
              type="button"
              onClick={() => setPingOpen(false)}
              className="btn-secondary px-4 py-2 text-xs font-bold uppercase min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleQuickPing}
              disabled={sendingPing}
              className="btn-primary px-4 py-2 text-xs font-bold uppercase industrial-border disabled:opacity-60 min-h-[44px]"
            >
              {sendingPing ? "Enviando..." : "Enviar Ping"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="font-bold uppercase text-[10px]">Sucursal</label>
            <select
              className="w-full industrial-border px-3 py-2 text-sm font-bold min-h-[44px]"
              value={pingBranch}
              onChange={(e) => setPingBranch(e.target.value as BranchId)}
            >
              {Object.entries(BRANCH_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-bold uppercase text-[10px]">Mensaje</label>
            <textarea
              className="w-full industrial-border px-3 py-2 text-sm"
              rows={3}
              placeholder="Mensaje urgente para la sucursal..."
              value={pingMessage}
              onChange={(e) => setPingMessage(e.target.value)}
            />
          </div>
        </div>
      </Modal>

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
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span className="text-sm font-bold">Notificaciones push activas</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
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
            ¿Necesitas ayuda con el sistema de logística?
          </p>
          <div className="space-y-2">
            <a
              href="tel:+17875550100"
              className="flex items-center gap-2 font-bold hover:text-primary transition-colors min-h-[44px]"
            >
              <span className="material-symbols-outlined">call</span>
              +1 (787) 555-0100
            </a>
            <a
              href="mailto:soporte@agrosol.pr"
              className="flex items-center gap-2 font-bold hover:text-primary transition-colors min-h-[44px]"
            >
              <span className="material-symbols-outlined">mail</span>
              soporte@agrosol.pr
            </a>
          </div>
          <button
            type="button"
            onClick={() => {
              setSupportOpen(false);
              showToast("Ticket de soporte creado #SUP-4821", "success");
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
    openPing: () => setPingOpen(true),
    openConfig: () => setConfigOpen(true),
    openSupport: () => setSupportOpen(true),
  };
}
