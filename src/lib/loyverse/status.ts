import { isLoyverseConfigured } from "./config";
import { LoyverseApiError, loyverseRequest } from "./client";
import type { LoyverseMerchant, LoyverseStatus } from "./types";

export async function getLoyverseStatus(): Promise<LoyverseStatus> {
  if (!isLoyverseConfigured()) {
    return {
      configured: false,
      connected: false,
      message: "Agrega LOYVERSE_ACCESS_TOKEN en las variables de entorno",
    };
  }

  try {
    const merchant = await loyverseRequest<LoyverseMerchant>("/merchant");
    const merchantName =
      merchant.business_name?.trim() ||
      merchant.name?.trim() ||
      "Loyverse";

    return {
      configured: true,
      connected: true,
      merchantName,
      message: `Conectado a ${merchantName}`,
    };
  } catch (error) {
    if (error instanceof LoyverseApiError) {
      return {
        configured: true,
        connected: false,
        message:
          error.status === 401
            ? "Token inválido o expirado"
            : error.message,
      };
    }

    return {
      configured: true,
      connected: false,
      message: "No se pudo conectar con Loyverse",
    };
  }
}
