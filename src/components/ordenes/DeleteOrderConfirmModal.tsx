"use client";

import { Modal } from "@/components/ui/Modal";

interface DeleteOrderConfirmModalProps {
  open: boolean;
  orderId: string;
  customerName: string;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteOrderConfirmModal({
  open,
  orderId,
  customerName,
  deleting,
  onClose,
  onConfirm,
}: DeleteOrderConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={deleting ? () => {} : onClose}
      title="Eliminar orden"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="btn-secondary px-4 py-2 text-xs font-medium min-h-[44px] disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 text-xs font-medium min-h-[44px] rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? "Eliminando..." : "Eliminar orden"}
          </button>
        </>
      }
    >
      <p className="text-sm text-on-surface">
        ¿Seguro que quieres eliminar la orden{" "}
        <span className="font-mono font-semibold">{orderId}</span> de{" "}
        <span className="font-semibold">{customerName}</span>?
      </p>
      <p className="text-sm text-on-surface-variant mt-3">
        Esta acción no se puede deshacer. Se eliminarán los productos asociados y,
        si aplica, la entrega vinculada.
      </p>
    </Modal>
  );
}
