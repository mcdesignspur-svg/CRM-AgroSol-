import { prisma } from "@/lib/prisma";
import {
  getLoyverseBranchLabel,
  isLoyverseBranchEnabled,
  isLoyverseConfigured,
} from "./config";
import { LoyverseApiError, loyverseRequest } from "./client";
import type { BranchId } from "@/lib/types";
import type { LoyverseMerchant, LoyverseStatus } from "./types";

export async function getLoyverseStatus(
  branchId: BranchId = "gurabo",
): Promise<LoyverseStatus> {
  const branchLabel = getLoyverseBranchLabel(branchId);
  const integration = await prisma.loyverseIntegration.findUnique({
    where: { branchId },
  });
  const cachedProductCount = await prisma.product.count({
    where: { branchId, active: true },
  });
  const lastSyncAt =
    integration?.lastIncrementalSyncAt?.toISOString() ??
    integration?.lastFullSyncAt?.toISOString() ??
    null;

  if (!isLoyverseBranchEnabled(branchId)) {
    return {
      branchId,
      configured: false,
      connected: false,
      cachedProductCount,
      lastSyncAt,
      message: `Loyverse aún no está habilitado para ${branchLabel}`,
    };
  }

  if (!isLoyverseConfigured(branchId)) {
    return {
      branchId,
      configured: false,
      connected: false,
      cachedProductCount,
      lastSyncAt,
      message: `Agrega el token Loyverse de ${branchLabel}`,
    };
  }

  try {
    const merchant = await loyverseRequest<LoyverseMerchant>(
      "/merchant",
      branchId,
    );
    const merchantName =
      merchant.business_name?.trim() ||
      merchant.name?.trim() ||
      branchLabel;

    const cacheLabel =
      cachedProductCount > 0
        ? `${cachedProductCount.toLocaleString("es-PR")} productos en cache`
        : "Sin productos en cache — importa el catálogo";

    return {
      branchId,
      configured: true,
      connected: true,
      merchantName,
      cachedProductCount,
      lastSyncAt,
      message: `Conectado a ${merchantName} · ${cacheLabel}`,
    };
  } catch (error) {
    if (error instanceof LoyverseApiError) {
      return {
        branchId,
        configured: true,
        connected: false,
        cachedProductCount,
        lastSyncAt,
        message:
          error.status === 401
            ? `Token inválido para ${branchLabel}`
            : error.message,
      };
    }

    return {
      branchId,
      configured: true,
      connected: false,
      cachedProductCount,
      lastSyncAt,
      message: `No se pudo conectar con Loyverse (${branchLabel})`,
    };
  }
}
