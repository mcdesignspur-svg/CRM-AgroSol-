"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/providers/ToastProvider";
import { APP_NAME, APP_TAGLINE, BRANCH_LABELS, NAV_ITEMS } from "@/lib/constants";
import type { BranchId } from "@/lib/types";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
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
    showToast(
      `Ping enviado a ${BRANCH_LABELS[pingBranch]}`,
      "success",
    );
  }

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 border-r-2 border-on-background bg-surface-container-lowest py-10 h-full shrink-0">
        <div className="px-6 mb-10">
          <h1 className="font-display text-2xl font-extrabold text-primary">
            {APP_NAME}
          </h1>
          <p className="text-xs font-bold opacity-70 uppercase tracking-wide">
            {APP_TAGLINE}
          </p>
        </div>

        <nav className="flex-1 space-y-2 px-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 font-bold transition-transform active:translate-x-1 ${
                  active
                    ? "bg-secondary-container text-on-secondary-container border-l-4 border-primary"
                    : "text-on-surface hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-4 mt-auto space-y-2">
          <button
            type="button"
            onClick={() => setPingOpen(true)}
            className="w-full btn-primary font-bold py-3 industrial-border industrial-shadow mb-4 flex items-center justify-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined">bolt</span>
            PING RÁPIDO
          </button>
          <button
            type="button"
            onClick={() => setConfigOpen(true)}
            className="flex items-center gap-3 px-4 py-2 text-on-surface hover:bg-surface-container text-sm font-bold w-full"
          >
            <span className="material-symbols-outlined">settings</span>
            Configuración
          </button>
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            className="flex items-center gap-3 px-4 py-2 text-on-surface hover:bg-surface-container text-sm font-bold w-full"
          >
            <span className="material-symbols-outlined">help</span>
            Soporte
          </button>
        </div>
      </aside>

      <Modal
        open={pingOpen}
        onClose={() => setPingOpen(false)}
        title="Ping Rápido"
        footer={
          <>
            <button
              type="button"
              onClick={() => setPingOpen(false)}
              className="btn-secondary px-4 py-2 text-xs font-bold uppercase"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleQuickPing}
              disabled={sendingPing}
              className="btn-primary px-4 py-2 text-xs font-bold uppercase industrial-border disabled:opacity-60"
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
              className="w-full industrial-border px-3 py-2 text-sm font-bold"
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
            className="btn-primary px-4 py-2 text-xs font-bold uppercase industrial-border"
          >
            Guardar
          </button>
        }
      >
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span className="text-sm font-bold">Notificaciones push activas</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span className="text-sm font-bold">Alertas de inventario bajo</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
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
              className="flex items-center gap-2 font-bold hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">call</span>
              +1 (787) 555-0100
            </a>
            <a
              href="mailto:soporte@agrosol.pr"
              className="flex items-center gap-2 font-bold hover:text-primary transition-colors"
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
            className="w-full btn-secondary py-2 text-xs font-bold uppercase"
          >
            Abrir Ticket
          </button>
        </div>
      </Modal>
    </>
  );
}
