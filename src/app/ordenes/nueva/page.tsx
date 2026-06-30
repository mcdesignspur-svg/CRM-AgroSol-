"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { catalogProducts } from "@/lib/data";
import {
  BRANCH_LABELS,
  DEFAULT_BRANCH,
  DELIVERY_FEE,
  TAX_RATE,
} from "@/lib/constants";
import type { BranchId, OrderLineItem } from "@/lib/types";

type FulfillmentMethod = "pickup" | "delivery";

export default function NuevaOrdenPage() {
  const [method, setMethod] = useState<FulfillmentMethod>("pickup");
  const [branchId, setBranchId] = useState<BranchId>(DEFAULT_BRANCH);
  const [lineItems, setLineItems] = useState<OrderLineItem[]>(
    catalogProducts.map((p) => ({ ...p, quantity: p.id === "prod-1" ? 10 : 2 })),
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [smsNotify, setSmsNotify] = useState(false);

  const subtotal = useMemo(
    () =>
      lineItems.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      ),
    [lineItems],
  );

  const taxes = subtotal * TAX_RATE;
  const deliveryCost = method === "delivery" ? DELIVERY_FEE : 0;
  const total = subtotal + taxes + deliveryCost;
  const itemCount = lineItems.reduce((sum, item) => sum + item.quantity, 0);

  function updateQuantity(id: string, quantity: number) {
    setLineItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item,
      ),
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSubmitting(false);
    setSubmitted(true);
  }

  return (
    <AppShell
      topBar={
        <TopBar
          title="Registro de Nueva Orden"
          showSearch={false}
          showBranchSelector={false}
        >
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 border-2 border-black bg-white">
            <span className="font-bold uppercase text-[10px]">Activo:</span>
            <span className="font-bold uppercase text-[10px] text-primary">
              {BRANCH_LABELS[DEFAULT_BRANCH]}
            </span>
          </div>
        </TopBar>
      }
    >
      <div className="flex-1 overflow-y-auto pt-8 pb-16 px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <section className="bg-white border-2 border-black p-6 industrial-shadow">
                <div className="flex items-center gap-2 mb-6 border-b-2 border-black pb-3">
                  <span className="material-symbols-outlined text-primary font-bold">
                    person
                  </span>
                  <h2 className="font-bold uppercase text-lg">
                    Información del Cliente
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px]">
                      Nombre Completo
                    </label>
                    <input
                      className="w-full bg-white border-2 border-black px-4 py-2 font-medium"
                      placeholder="ej. Juan Carlos Perez"
                      type="text"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px]">
                      Número de Teléfono
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-black text-sm">
                        phone
                      </span>
                      <input
                        className="w-full bg-white border-2 border-black pl-12 pr-4 py-2 font-medium"
                        placeholder="+1 787 ..."
                        type="tel"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-white border-2 border-black p-6 industrial-shadow">
                <div className="flex items-center gap-2 mb-6 border-b-2 border-black pb-3">
                  <span className="material-symbols-outlined text-primary font-bold">
                    store
                  </span>
                  <h2 className="font-bold uppercase text-lg">
                    Logística y Sucursal
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px]">
                      Sucursal de Retiro/Entrega
                    </label>
                    <select
                      className="w-full bg-white border-2 border-black px-4 py-2 font-bold uppercase text-xs cursor-pointer"
                      value={branchId}
                      onChange={(e) =>
                        setBranchId(e.target.value as BranchId)
                      }
                    >
                      {Object.entries(BRANCH_LABELS).map(([id, label]) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold uppercase text-[10px]">
                      Método de Entrega
                    </label>
                    <div className="flex border-2 border-black p-1 h-[50px] gap-1 bg-gray-100">
                      <button
                        type="button"
                        className={`flex-1 font-bold uppercase text-xs flex items-center justify-center gap-1 transition-all ${
                          method === "pickup"
                            ? "bg-primary text-white"
                            : "text-black hover:bg-white"
                        }`}
                        onClick={() => setMethod("pickup")}
                      >
                        <span className="material-symbols-outlined text-sm">
                          inventory_2
                        </span>
                        RETIRO
                      </button>
                      <button
                        type="button"
                        className={`flex-1 font-bold uppercase text-xs flex items-center justify-center gap-1 transition-all ${
                          method === "delivery"
                            ? "bg-primary text-white"
                            : "text-black hover:bg-white"
                        }`}
                        onClick={() => setMethod("delivery")}
                      >
                        <span className="material-symbols-outlined text-sm">
                          local_shipping
                        </span>
                        ENTREGA
                      </button>
                    </div>
                  </div>
                </div>

                {method === "delivery" && (
                  <div className="mt-6 p-4 bg-gray-50 border-2 border-black border-dashed">
                    <div className="space-y-1">
                      <label className="font-bold uppercase text-primary text-[10px]">
                        Dirección Detallada de Entrega
                      </label>
                      <textarea
                        className="w-full bg-white border-2 border-black px-4 py-2 font-medium"
                        placeholder="Ingrese la dirección completa, calle, número e instrucciones adicionales..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </section>

              <section className="bg-white border-2 border-black p-6 industrial-shadow">
                <div className="flex items-center justify-between mb-6 border-b-2 border-black pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary font-bold">
                      shopping_bag
                    </span>
                    <h2 className="font-bold uppercase text-lg">
                      Lista de Productos
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-bold uppercase px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-all"
                  >
                    + AGREGAR ARTÍCULO
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-black text-white">
                      <tr>
                        <th className="py-3 px-4 font-bold uppercase text-[10px]">
                          Producto
                        </th>
                        <th className="py-3 px-4 font-bold uppercase text-[10px] w-24">
                          Cant.
                        </th>
                        <th className="py-3 px-4 font-bold uppercase text-[10px] w-32">
                          Precio Unit.
                        </th>
                        <th className="py-3 px-4 font-bold uppercase text-[10px] w-32 text-right">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="font-medium text-sm">
                      {lineItems.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b-2 border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-4 px-4">
                            <div className="font-bold text-black uppercase">
                              {item.name}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">
                              SKU: {item.sku}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <input
                              className="w-16 bg-white border-2 border-black px-2 py-1 font-bold text-center"
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(
                                  item.id,
                                  parseInt(e.target.value, 10) || 1,
                                )
                              }
                            />
                          </td>
                          <td className="py-4 px-4 font-bold">
                            ${item.unitPrice.toFixed(2)}
                          </td>
                          <td className="py-4 px-4 font-extrabold text-right">
                            ${(item.unitPrice * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-6 space-y-6">
                <div className="bg-white border-2 border-black industrial-shadow flex flex-col">
                  <div className="p-4 bg-black text-white">
                    <h3 className="font-bold uppercase text-base">
                      Resumen de la Orden
                    </h3>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between font-medium">
                      <span className="uppercase text-xs text-gray-600 font-bold">
                        Subtotal ({itemCount} Artículos)
                      </span>
                      <span className="font-bold">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="uppercase text-xs text-gray-600 font-bold">
                        Impuestos (IVA 21%)
                      </span>
                      <span className="font-bold">${taxes.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium items-center">
                      <span className="uppercase text-xs text-gray-600 font-bold">
                        Cargo por Entrega
                      </span>
                      <span
                        className={`font-bold text-xs ${
                          method === "delivery" ? "text-primary" : "text-black"
                        }`}
                      >
                        {method === "pickup"
                          ? "GRATIS (RETIRO)"
                          : `$${DELIVERY_FEE.toFixed(2)} (FIJO)`}
                      </span>
                    </div>
                    <div className="pt-2 border-t-2 border-black flex justify-between items-end">
                      <span className="font-extrabold uppercase text-lg">
                        Total
                      </span>
                      <span className="font-extrabold text-2xl text-primary">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 border-t-2 border-black space-y-4">
                    <div className="flex items-start gap-4">
                      <input
                        className="mt-1 w-4 h-4 border-2 border-black"
                        type="checkbox"
                        checked={smsNotify}
                        onChange={(e) => setSmsNotify(e.target.checked)}
                      />
                      <label className="text-[10px] font-bold uppercase leading-tight">
                        Confirmación por SMS al cliente al despachar desde
                        almacén.
                      </label>
                    </div>
                    <button
                      type="button"
                      disabled={submitting || submitted}
                      onClick={handleSubmit}
                      className={`w-full py-4 text-white font-extrabold text-lg industrial-border industrial-shadow active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 disabled:opacity-80 ${
                        submitted ? "bg-green-600" : "bg-primary hover:bg-black"
                      }`}
                    >
                      {submitting ? (
                        <>
                          <span className="material-symbols-outlined animate-spin">
                            sync
                          </span>
                          PROCESANDO...
                        </>
                      ) : submitted ? (
                        <>
                          <span
                            className="material-symbols-outlined"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            check_circle
                          </span>
                          ORDEN REALIZADA
                        </>
                      ) : (
                        <>
                          <span
                            className="material-symbols-outlined"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            send
                          </span>
                          CONFIRMAR Y ENVIAR PING
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="w-full py-2 border-2 border-black bg-white font-bold uppercase text-xs hover:bg-gray-100 transition-all"
                    >
                      GUARDAR COMO BORRADOR
                    </button>
                  </div>
                </div>

                <div className="bg-white border-2 border-black p-4 flex items-center gap-4">
                  <div className="relative w-4 h-4">
                    <div className="absolute inset-0 bg-green-500 animate-ping opacity-50" />
                    <div className="absolute inset-0 bg-green-500" />
                  </div>
                  <div className="text-[10px]">
                    <div className="font-bold uppercase">Conexión ERP Activa</div>
                    <div className="font-mono opacity-60">LATENCIA: 12ms</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 w-full h-2 bg-primary z-50 md:left-64" />
    </AppShell>
  );
}
