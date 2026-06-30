import { ensureBranches } from "@/lib/db/branches";
import { prisma } from "@/lib/prisma";
import { loyverseFetch } from "./client";
import { LOYVERSE_RECEIPT_SOURCE } from "./config";
import {
  ensureLoyverseCustomer,
  findOrCreateLocalCustomer,
  upsertCustomerFromLoyverse,
} from "./sync-customers";
import { getBranchIdForLoyverseStore } from "./sync-stores";
import type { LoyversePaymentType, LoyverseReceipt } from "./types";

async function getDefaultPaymentTypeId(): Promise<string | null> {
  const response = await loyverseFetch<{ payment_types: LoyversePaymentType[] }>(
    "/payment_types",
  );
  const cash = response.payment_types.find((type) => type.type === "CASH");
  return (cash ?? response.payment_types[0])?.id ?? null;
}

export async function pushReceiptToLoyverse(displayId: string) {
  const order = await prisma.order.findUnique({
    where: { displayId },
    include: {
      lineItems: true,
      branch: true,
      customer: true,
    },
  });

  if (!order) {
    throw new Error(`Orden ${displayId} no encontrada`);
  }

  if (order.loyverseReceiptNumber) {
    return order.loyverseReceiptNumber;
  }

  const storeId = order.branch.loyverseStoreId;
  if (!storeId) {
    throw new Error(
      `La sucursal ${order.branchId} no tiene store_id de Loyverse mapeado`,
    );
  }

  const lineItems = [];
  for (const item of order.lineItems) {
    let variantId: string | null = null;

    if (item.productId) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { loyverseVariantId: true },
      });
      variantId = product?.loyverseVariantId ?? null;
    }

    if (!variantId) {
      const bySku = await prisma.product.findUnique({
        where: { sku: item.sku },
        select: { loyverseVariantId: true },
      });
      variantId = bySku?.loyverseVariantId ?? null;
    }

    if (!variantId) {
      throw new Error(
        `El producto ${item.sku} no tiene variant_id de Loyverse`,
      );
    }

    lineItems.push({
      variant_id: variantId,
      quantity: item.quantity,
      price: Number(item.unitPrice),
      line_note: item.name,
    });
  }

  let customerId: string | undefined;
  if (order.customerId) {
    const loyverseCustomerId = await ensureLoyverseCustomer(order.customerId);
    customerId = loyverseCustomerId ?? undefined;
  }

  const paymentTypeId = await getDefaultPaymentTypeId();
  const noteParts = [
    `Orden CRM ${order.displayId}`,
    order.fulfillment === "delivery"
      ? `Entrega: ${order.deliveryAddress ?? "sin dirección"}`
      : "Retiro en sucursal",
  ];

  const payload: Record<string, unknown> = {
    store_id: storeId,
    order: order.displayId,
    source: LOYVERSE_RECEIPT_SOURCE,
    customer_id: customerId,
    note: noteParts.join(" · "),
    line_items: lineItems,
  };

  if (paymentTypeId) {
    payload.payments = [
      {
        payment_type_id: paymentTypeId,
        money_amount: Number(order.total),
        paid_at: new Date().toISOString(),
      },
    ];
  }

  const receipt = await loyverseFetch<LoyverseReceipt>("/receipts", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      loyverseReceiptNumber: receipt.receipt_number,
      loyverseSource: LOYVERSE_RECEIPT_SOURCE,
      loyverseSyncedAt: new Date(),
    },
  });

  return receipt.receipt_number;
}

export async function importReceiptFromLoyverse(
  receipt: LoyverseReceipt,
): Promise<string | null> {
  if (receipt.receipt_type !== "SALE" || receipt.cancelled_at) {
    return null;
  }

  if (receipt.source === LOYVERSE_RECEIPT_SOURCE) {
    return null;
  }

  const existing = await prisma.order.findFirst({
    where: {
      OR: [
        { loyverseReceiptNumber: receipt.receipt_number },
        ...(receipt.order ? [{ displayId: receipt.order }] : []),
      ],
    },
    select: { displayId: true },
  });

  if (existing) {
    return existing.displayId;
  }

  await ensureBranches();

  const branchId =
    (await getBranchIdForLoyverseStore(receipt.store_id)) ?? "gurabo";

  let customerId: string | null = null;
  let customerName = "Cliente POS";
  let customerPhone: string | null = null;

  if (receipt.customer_id) {
    try {
      const loyverseCustomer = await loyverseFetch<{
        id: string;
        name: string;
        phone_number?: string;
        email?: string;
        address?: string;
      }>(`/customers/${receipt.customer_id}`);

      const localCustomer = await upsertCustomerFromLoyverse(loyverseCustomer);
      customerId = localCustomer.id;
      customerName = localCustomer.name;
      customerPhone = localCustomer.phone;
    } catch {
      customerName = "Cliente Loyverse";
    }
  } else if (receipt.order) {
    const localCustomer = await findOrCreateLocalCustomer({
      name: `Cliente ${receipt.order}`,
    });
    customerId = localCustomer.id;
    customerName = localCustomer.name;
  }

  const subtotal = receipt.line_items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const order = await prisma.$transaction(async (tx) => {
    const latest = await tx.order.findFirst({
      orderBy: { displayId: "desc" },
      select: { displayId: true },
    });
    const latestNumber = latest
      ? Number.parseInt(latest.displayId.replace(/^ORD-/, ""), 10)
      : 99000;
    const displayId = receipt.order?.trim() || `ORD-${latestNumber + 1}`;

    const created = await tx.order.create({
      data: {
        displayId,
        customerId,
        customerName,
        customerPhone,
        deliveryAddress: receipt.note?.includes("Entrega")
          ? receipt.note
          : null,
        type: receipt.note?.toLowerCase().includes("entrega")
          ? "entrega"
          : "retiro",
        branchId,
        status: "pendiente",
        fulfillment: receipt.note?.toLowerCase().includes("entrega")
          ? "delivery"
          : "pickup",
        smsNotify: false,
        subtotal,
        taxes: receipt.total_tax,
        deliveryFee: 0,
        total: receipt.total_money,
        loyverseReceiptNumber: receipt.receipt_number,
        loyverseSource: receipt.source ?? "point of sale",
        loyverseSyncedAt: new Date(),
        lineItems: {
          create: await Promise.all(
            receipt.line_items.map(async (item) => {
              const product = item.sku
                ? await tx.product.findUnique({ where: { sku: item.sku } })
                : null;

              return {
                productId: product?.id ?? null,
                name: item.item_name,
                sku: item.sku ?? "SIN-SKU",
                unitPrice: item.price,
                quantity: Math.round(item.quantity),
              };
            }),
          ),
        },
      },
    });

    await tx.notificationLog.create({
      data: {
        source: "LOYVERSE",
        message: `Venta POS ${receipt.receipt_number} importada como ${displayId}.`,
        accent: "primary",
      },
    });

    await tx.ping.create({
      data: {
        priority: "sistema",
        title: `Venta POS: ${displayId}`,
        description: `Receipt ${receipt.receipt_number} sincronizado desde Loyverse.`,
      },
    });

    return created;
  });

  return order.displayId;
}
