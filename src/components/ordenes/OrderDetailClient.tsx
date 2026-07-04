"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TopBar } from "@/components/layout/TopBar";
import { useToast } from "@/components/providers/ToastProvider";
import {
  BranchLabel,
  StatusBadge,
  TypeBadge,
  ArrivedBadge,
} from "@/components/ui/badges";
import { BRANCH_LABELS } from "@/lib/constants";
import {
  ORDER_STATUS_LABELS,
  STATUS_ACTION_LABELS,
} from "@/lib/order-status";
import type { OrderDetail, OrderStatus } from "@/lib/types";
import { PickupTelegramPanel } from "@/components/ordenes/PickupTelegramPanel";
import { DeleteOrderConfirmModal } from "@/components/ordenes/DeleteOrderConfirmModal";

interface OrderDetailClientProps {
  initialOrder: OrderDetail;
}

export function OrderDetailClient({ initialOrder }: OrderDetailClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [order, setOrder] = useState(initialOrder);
  const [updating, setUpdating] = useState<OrderStatus | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleStatusChange(nextStatus: OrderStatus) {
    setUpdating(nextStatus);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Error al actualizar la orden", "error");
        return;
      }
      setOrder(data);
      if (order.fulfillment === "pickup" && nextStatus === "listo") {
        showToast(
          data.readyNotifiedAt
            ? "Orden lista — aviso enviado por Telegram"
            : `Orden actualizada: ${ORDER_STATUS_LABELS[nextStatus]}`,
          data.readyNotifiedAt ? "success" : "success",
        );
      } else {
        showToast(
          `Orden actualizada: ${ORDER_STATUS_LABELS[nextStatus]}`,
          "success",
        );
      }
      router.refresh();
    } catch {
      showToast("Error al actualizar la orden", "error");
    } finally {
      setUpdating(null);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Error al eliminar la orden", "error");
        return;
      }
      showToast(`Orden ${order.id} eliminada`, "success");
      router.push("/ordenes");
      router.refresh();
    } catch {
      showToast("Error al eliminar la orden", "error");
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  }

  const itemCount = order.lineItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return (
    <AppShell
      topBar={
        <TopBar title={`Orden ${order.id}`} showSearch={false} showBranchSelector={false} />
      }
    >
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-10">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div>
            <Link
              href="/ordenes"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mb-3"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Volver a Órdenes
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight font-mono">
                {order.id}
              </h2>
              <StatusBadge status={order.status} />
              <TypeBadge type={order.type} />
              {order.arrivedAt && order.fulfillment === "pickup" && (
                <ArrivedBadge />
              )}
            </div>
            <p className="text-sm text-on-surface-variant mt-2">
              Creada hace {order.elapsedTime} · {BRANCH_LABELS[order.branchId]}
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full lg:w-auto">
            {order.allowedTransitions.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2">
                {order.allowedTransitions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={updating !== null}
                    onClick={() => handleStatusChange(status)}
                    className={`btn-primary px-4 py-3 text-xs font-medium industrial-border min-h-[44px] disabled:opacity-60 ${
                      status === "completado" ? "bg-green-600 hover:bg-green-700" : ""
                    }`}
                  >
                    {updating === status
                      ? "Actualizando..."
                      : STATUS_ACTION_LABELS[status] ?? ORDER_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            )}

            {order.fulfillment === "delivery" && order.status === "en-transito" && (
              <Link
                href={`/entregas?orden=${encodeURIComponent(order.id)}`}
                className="inline-flex items-center gap-2 btn-secondary px-4 py-3 text-xs font-medium min-h-[44px] justify-center"
              >
                <span className="material-symbols-outlined text-base">local_shipping</span>
                Ver en Entregas
              </Link>
            )}

            <button
              type="button"
              disabled={updating !== null || deleting}
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 btn-secondary px-4 py-3 text-xs font-medium min-h-[44px] justify-center text-red-600 hover:text-red-700 hover:border-red-200 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base">delete</span>
              Eliminar orden
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <section className="bg-white rounded-xl border border-outline p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b border-outline pb-3">
                <span className="material-symbols-outlined text-primary font-bold">
                  person
                </span>
                <h3 className="text-base font-semibold text-on-surface">Cliente</h3>
              </div>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs font-medium text-on-surface-variant text-gray-500">
                    Nombre
                  </dt>
                  <dd className="font-bold mt-1">{order.customerName}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-on-surface-variant text-gray-500">
                    Teléfono
                  </dt>
                  <dd className="font-medium mt-1">
                    {order.customerPhone ?? "—"}
                  </dd>
                </div>
                {order.fulfillment === "delivery" && (
                  <div className="md:col-span-2">
                    <dt className="text-xs font-medium text-on-surface-variant text-gray-500">
                      Dirección de Entrega
                    </dt>
                    <dd className="font-medium mt-1 whitespace-pre-wrap">
                      {order.deliveryAddress ?? "—"}
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            <section className="bg-white rounded-xl border border-outline p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b border-outline pb-3">
                <span className="material-symbols-outlined text-primary font-bold">
                  shopping_bag
                </span>
                <h3 className="text-base font-semibold text-on-surface">
                  Productos ({itemCount})
                </h3>
              </div>
              <div className="overflow-x-auto">
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
                    </tr>
                  </thead>
                  <tbody className="font-medium text-sm divide-y divide-gray-200">
                    {order.lineItems.map((item) => (
                      <tr key={item.id}>
                        <td className="py-4 px-4">
                          <div className="font-bold uppercase">{item.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            SKU: {item.sku}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-bold">{item.quantity}</td>
                        <td className="py-4 px-4 font-bold">
                          ${item.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 font-extrabold text-right">
                          ${item.lineTotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-6">
            {order.fulfillment === "pickup" && (
              <PickupTelegramPanel order={order} />
            )}
            <section className="bg-white rounded-xl border border-outline shadow-sm">
              <div className="px-4 py-3 border-b border-outline bg-surface">
                <h3 className="text-sm font-semibold text-on-surface">Resumen</h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between font-medium">
                  <span className="uppercase text-xs text-gray-600 font-bold">
                    Subtotal
                  </span>
                  <span className="font-bold">${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="uppercase text-xs text-gray-600 font-bold">
                    Impuestos
                  </span>
                  <span className="font-bold">${order.taxes.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="uppercase text-xs text-gray-600 font-bold">
                    Entrega
                  </span>
                  <span className="font-bold">
                    {order.deliveryFee > 0
                      ? `$${order.deliveryFee.toFixed(2)}`
                      : "GRATIS (PICKUP)"}
                  </span>
                </div>
                <div className="pt-2 border-t border-outline flex justify-between items-end">
                  <span className="font-semibold text-lg">Total</span>
                  <span className="font-extrabold text-2xl text-primary">
                    ${order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </section>

            <section className="bg-white border border-outline p-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-xs font-medium text-on-surface-variant text-gray-500">
                  Sucursal
                </span>
                <BranchLabel branchId={order.branchId} />
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-xs font-medium text-on-surface-variant text-gray-500">
                  Método
                </span>
                <span className="font-bold uppercase text-xs">
                  {order.fulfillment === "delivery" ? "Entrega" : "Pickup"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-xs font-medium text-on-surface-variant text-gray-500">
                  Confirmación Telegram
                </span>
                <span className="font-bold uppercase text-xs">
                  {order.confirmationNotifiedAt ? "Enviada" : "Pendiente"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-xs font-medium text-on-surface-variant text-gray-500">
                  Aviso orden lista
                </span>
                <span className="font-bold uppercase text-xs">
                  {order.readyNotifiedAt ? "Enviada" : "Pendiente"}
                </span>
              </div>
              {order.arrivedAt && (
                <div className="flex justify-between gap-4">
                  <span className="text-xs font-medium text-on-surface-variant text-gray-500">
                    Cliente en camino
                  </span>
                  <span className="font-bold uppercase text-xs text-orange-700">
                    Sí
                  </span>
                </div>
              )}
              {order.status === "completado" && (
                <div className="pt-2 border-t-2 border-dashed border-gray-300 text-center">
                  <span className="material-symbols-outlined text-green-600">
                    check_circle
                  </span>
                  <p className="font-bold uppercase text-xs mt-1 text-green-700">
                    Orden Finalizada
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <DeleteOrderConfirmModal
        open={deleteModalOpen}
        orderId={order.id}
        customerName={order.customerName}
        deleting={deleting}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
    </AppShell>
  );
}
