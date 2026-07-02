"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { useToast } from "@/components/providers/ToastProvider";
import { AddProductModal } from "@/components/productos/AddProductModal";
import { ProductPickerModal } from "@/components/productos/ProductPickerModal";
import {
  BRANCH_LABELS,
  DEFAULT_BRANCH,
  DELIVERY_FEE,
  TAX_RATE,
} from "@/lib/constants";
import type { BranchId, OrderLineItem, Product } from "@/lib/types";

type FulfillmentMethod = "pickup" | "delivery";

const DRAFT_STORAGE_KEY = "agrosol-order-draft";

interface OrderDraft {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  method: FulfillmentMethod;
  branchId: BranchId;
  lineItems: { productId: string; quantity: number }[];
  smsNotify: boolean;
}

interface NuevaOrdenClientProps {
  catalogProducts: Product[];
}

export default function NuevaOrdenClient({
  catalogProducts: initialCatalogProducts,
}: NuevaOrdenClientProps) {
  const [catalogProducts, setCatalogProducts] = useState(initialCatalogProducts);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [method, setMethod] = useState<FulfillmentMethod>("pickup");
  const [branchId, setBranchId] = useState<BranchId>(DEFAULT_BRANCH);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [lineItems, setLineItems] = useState<OrderLineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();
  const [smsNotify, setSmsNotify] = useState(false);
  const [deliveryAddressError, setDeliveryAddressError] = useState(false);

  // La restauración del borrador debe correr tras la hidratación (localStorage
  // no existe en SSR), por eso se sincroniza en un efecto y no en el
  // inicializador de estado.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as OrderDraft;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomerName(draft.customerName ?? "");
      setCustomerPhone(draft.customerPhone ?? "");
      setDeliveryAddress(draft.deliveryAddress ?? "");
      setMethod(draft.method ?? "pickup");
      setBranchId(draft.branchId ?? DEFAULT_BRANCH);
      setSmsNotify(draft.smsNotify ?? false);
      const restored = (draft.lineItems ?? [])
        .map((item) => {
          const product = initialCatalogProducts.find(
            (p) => p.id === item.productId,
          );
          return product ? { ...product, quantity: item.quantity } : null;
        })
        .filter((item): item is OrderLineItem => item !== null);
      if (restored.length > 0) {
        setLineItems(restored);
        showToast("Borrador restaurado", "info");
      }
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
    // Restaurar borrador solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addLineItem() {
    setPickerOpen(true);
  }

  function selectProduct(product: Product) {
    setLineItems((items) => [...items, { ...product, quantity: 1 }]);
    showToast(`${product.name} agregado`, "success");
  }

  function handleProductCreated(product: Product) {
    setCatalogProducts((prev) =>
      [...prev, product].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setLineItems((items) => [...items, { ...product, quantity: 1 }]);
    showToast(`${product.name} creado y agregado a la orden`, "success");
  }

  function removeLineItem(id: string) {
    setLineItems((items) => items.filter((item) => item.id !== id));
  }

  function handleSaveDraft() {
    const draft: OrderDraft = {
      customerName,
      customerPhone,
      deliveryAddress,
      method,
      branchId,
      smsNotify,
      lineItems: lineItems.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    setDraftSaved(true);
    showToast("Borrador guardado localmente", "success");
    setTimeout(() => setDraftSaved(false), 2000);
  }

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
    if (!customerName.trim()) {
      showToast("Ingresa el nombre del cliente", "warning");
      return;
    }
    if (method === "delivery" && !deliveryAddress.trim()) {
      setDeliveryAddressError(true);
      showToast("Ingresa la dirección de entrega", "warning");
      return;
    }
    setDeliveryAddressError(false);
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim() || undefined,
          deliveryAddress:
            method === "delivery" ? deliveryAddress.trim() : undefined,
          branchId,
          fulfillment: method,
          smsNotify,
          lineItems: lineItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al crear orden");
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setSubmitted(true);
      showToast("Orden confirmada y ping enviado a sucursal", "success");
      router.push(`/ordenes/${encodeURIComponent(data.id)}`);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Error al guardar la orden",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      topBar={
        <TopBar
          title="Registro de Nueva Orden"
          showSearch={false}
          showBranchSelector={false}
        >
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 border border-outline bg-white">
            <span className="text-xs font-medium text-on-surface-variant">Activo:</span>
            <span className="text-xs font-medium text-on-surface-variant text-primary">
              {BRANCH_LABELS[branchId]}
            </span>
          </div>
        </TopBar>
      }
    >
      <div className="flex-1 overflow-y-auto pt-4 sm:pt-8 pb-36 lg:pb-16 px-4 sm:px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <section className="bg-white rounded-xl border border-outline p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b border-outline pb-3">
                  <span className="material-symbols-outlined text-primary font-bold">
                    person
                  </span>
                  <h2 className="text-base font-semibold text-on-surface">
                    Información del Cliente
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-on-surface-variant">
                      Nombre Completo
                    </label>
                    <input
                      className="w-full bg-white border border-outline px-4 py-2 font-medium"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-on-surface-variant">
                      Número de Teléfono
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-black text-sm">
                        phone
                      </span>
                      <input
                        className="w-full bg-white border border-outline pl-12 pr-4 py-2 font-medium"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex items-start gap-4 lg:hidden">
                  <input
                    className="mt-1 w-4 h-4 border border-outline"
                    type="checkbox"
                    id="sms-notify-mobile"
                    checked={smsNotify}
                    onChange={(e) => setSmsNotify(e.target.checked)}
                  />
                  <label
                    htmlFor="sms-notify-mobile"
                    className="text-xs font-medium leading-tight"
                  >
                    Confirmación por SMS al cliente al despachar desde almacén.
                  </label>
                </div>
              </section>

              <section className="bg-white rounded-xl border border-outline p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 border-b border-outline pb-3">
                  <span className="material-symbols-outlined text-primary font-bold">
                    store
                  </span>
                  <h2 className="text-base font-semibold text-on-surface">
                    Logística y Sucursal
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-on-surface-variant">
                      Sucursal de Pickup/Entrega
                    </label>
                    <select
                      className="w-full bg-white border border-outline px-4 py-2 font-bold uppercase text-xs cursor-pointer"
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
                    <label className="text-xs font-medium text-on-surface-variant">
                      Método de Entrega
                    </label>
                    <div className="flex border border-outline p-1 h-[50px] gap-1 bg-gray-100">
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
                        PICKUP
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
                  <div className="mt-6 p-4 bg-gray-50 border border-outline border-dashed">
                    <div className="space-y-1">
                      <label className="font-bold uppercase text-primary text-[10px]">
                        Dirección Detallada de Entrega
                      </label>
                      <textarea
                        className={`w-full bg-white border-2 px-4 py-2 font-medium ${
                          deliveryAddressError
                            ? "border-primary"
                            : "border-black"
                        }`}
                        rows={3}
                        value={deliveryAddress}
                        onChange={(e) => {
                          setDeliveryAddress(e.target.value);
                          if (deliveryAddressError) setDeliveryAddressError(false);
                        }}
                      />
                      {deliveryAddressError && (
                        <p className="text-xs font-medium text-primary mt-1">
                          La dirección es obligatoria para entregas
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </section>

              <section className="bg-white rounded-xl border border-outline p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6 border-b border-outline pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary font-bold">
                      shopping_bag
                    </span>
                    <h2 className="text-base font-semibold text-on-surface">
                      Lista de Productos
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/productos"
                      className="text-xs font-medium px-3 py-2 border border-outline hover:bg-surface-container transition-all hidden sm:inline-flex"
                    >
                      Productos
                    </Link>
                    <button
                      type="button"
                      onClick={addLineItem}
                      className="text-xs font-medium px-4 py-2 border border-outline hover:bg-surface-container transition-all"
                    >
                      + AGREGAR ARTÍCULO
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto hidden sm:block">
                  {lineItems.length === 0 ? (
                    <p className="py-12 text-center text-sm font-medium opacity-50">
                      Sin productos — usa &quot;Agregar artículo&quot; o{" "}
                      <button
                        type="button"
                        onClick={() => setAddProductOpen(true)}
                        className="underline hover:text-primary"
                      >
                        crea uno nuevo
                      </button>
                    </p>
                  ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="table-header">
                      <tr>
                        <th className="py-3 px-4 text-xs font-medium text-on-surface-variant">
                          Producto
                        </th>
                        <th className="py-3 px-4 text-xs font-medium text-on-surface-variant w-24">
                          Cant.
                        </th>
                        <th className="py-3 px-4 text-xs font-medium text-on-surface-variant w-32">
                          Precio Unit.
                        </th>
                        <th className="py-3 px-4 text-xs font-medium text-on-surface-variant w-32 text-right">
                          Total
                        </th>
                        <th className="py-3 px-4 text-xs font-medium text-on-surface-variant w-16" />
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
                              className="w-16 bg-white border border-outline px-2 py-1 font-bold text-center"
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
                          <td className="py-4 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => removeLineItem(item.id)}
                              className="p-1 hover:text-primary transition-colors min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                              aria-label={`Quitar ${item.name}`}
                            >
                              <span className="material-symbols-outlined text-lg">
                                delete
                              </span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  )}
                </div>

                {/* Productos — vista móvil */}
                <div className="sm:hidden space-y-3">
                  {lineItems.length === 0 ? (
                    <p className="py-12 text-center text-sm font-medium opacity-50">
                      Sin productos en la orden
                    </p>
                  ) : (
                  lineItems.map((item) => (
                    <div
                      key={item.id}
                      className="border border-outline p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="font-bold text-black uppercase text-sm">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono mt-1">
                            SKU: {item.sku}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          className="p-2 hover:text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0"
                          aria-label={`Quitar ${item.name}`}
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">Cant.</span>
                          <input
                            className="w-16 bg-white border border-outline px-2 py-2 font-bold text-center min-h-[44px]"
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
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold">
                            ${item.unitPrice.toFixed(2)} c/u
                          </div>
                          <div className="font-extrabold text-primary">
                            ${(item.unitPrice * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </section>
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-6 space-y-6">
                <div className="bg-white rounded-xl border border-outline shadow-sm flex flex-col">
                  <div className="px-4 py-3 border-b border-outline bg-surface">
                    <h3 className="text-sm font-semibold text-on-surface">
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
                          ? "GRATIS (PICKUP)"
                          : `$${DELIVERY_FEE.toFixed(2)} (FIJO)`}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-outline flex justify-between items-end">
                      <span className="font-semibold text-lg">
                        Total
                      </span>
                      <span className="font-extrabold text-2xl text-primary">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 border-t border-outline space-y-4 hidden lg:block">
                    <div className="flex items-start gap-4">
                      <input
                        className="mt-1 w-4 h-4 border border-outline"
                        type="checkbox"
                        checked={smsNotify}
                        onChange={(e) => setSmsNotify(e.target.checked)}
                      />
                      <label className="text-xs font-medium leading-tight">
                        Confirmación por SMS al cliente al despachar desde
                        almacén.
                      </label>
                    </div>
                    <button
                      type="button"
                      disabled={submitting || submitted || lineItems.length === 0}
                      onClick={handleSubmit}
                      className={`w-full py-4 text-white font-extrabold text-lg industrial-border industrial-shadow  transition-all flex items-center justify-center gap-3 disabled:opacity-80 ${
                        submitted ? "bg-green-600" : "bg-primary hover:bg-primary/90"
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
                      onClick={handleSaveDraft}
                      disabled={draftSaved}
                      className="w-full py-2 border border-outline bg-white font-bold uppercase text-xs hover:bg-gray-100 transition-all disabled:opacity-60"
                    >
                      {draftSaved ? "BORRADOR GUARDADO" : "GUARDAR COMO BORRADOR"}
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-outline p-4 flex items-center gap-4">
                  <div className="w-4 h-4 border border-outline bg-surface-container shrink-0" />
                  <div className="text-[10px]">
                    <div className="font-bold uppercase">Conexión ERP</div>
                    <div className="font-mono opacity-60">No conectado</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer fijo móvil */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-40 bg-white border-t border-outline px-4 py-3 flex items-center gap-3 safe-area-bottom">
        <div className="shrink-0">
          <p className="text-[9px] font-bold uppercase text-gray-500">Total</p>
          <p className="text-lg font-extrabold text-primary leading-tight">
            ${total.toFixed(2)}
          </p>
        </div>
        <button
          type="button"
          disabled={submitting || submitted || lineItems.length === 0}
          onClick={handleSubmit}
          className={`flex-1 py-3 text-white font-extrabold text-sm industrial-border industrial-shadow  transition-all flex items-center justify-center gap-2 disabled:opacity-80 min-h-[44px] ${
            submitted ? "bg-green-600" : "bg-primary"
          }`}
        >
          {submitting ? (
            <>
              <span className="material-symbols-outlined animate-spin text-lg">sync</span>
              Procesando...
            </>
          ) : submitted ? (
            <>
              <span className="material-symbols-outlined text-lg">check_circle</span>
              Realizada
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">send</span>
              Confirmar Orden
            </>
          )}
        </button>
      </div>

      <div className="hidden md:block fixed bottom-0 left-0 w-full h-2 bg-primary z-50 md:left-64" />

      <ProductPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        products={catalogProducts}
        selectedIds={lineItems.map((item) => item.id)}
        onSelect={selectProduct}
        onCreateNew={() => {
          setPickerOpen(false);
          setAddProductOpen(true);
        }}
      />

      <AddProductModal
        open={addProductOpen}
        onClose={() => setAddProductOpen(false)}
        onCreated={handleProductCreated}
      />
    </AppShell>
  );
}
