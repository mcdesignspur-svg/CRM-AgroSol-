import { buildPickupUrl } from "@/lib/pickup-url";
import { formatPhoneDisplay } from "@/lib/sms/phone";

export interface PickupMessageContext {
  displayId: string;
  customerName: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
  pickupToken: string;
  total: number;
}

export function buildOrderConfirmationMessage(ctx: PickupMessageContext): string {
  const link = buildPickupUrl(ctx.pickupToken);
  return (
    `Hola ${ctx.customerName}, tu orden ${ctx.displayId} en Agrocentro Solá fue registrada.\n\n` +
    `Total: $${ctx.total.toFixed(2)}\n` +
    `Retiro en ${ctx.branchName}\n${ctx.branchAddress}\n\n` +
    `Te avisaremos cuando esté lista.\n` +
    `Seguimiento: ${link}`
  );
}

export function buildOrderReadyMessage(ctx: PickupMessageContext): string {
  const link = buildPickupUrl(ctx.pickupToken);
  const phone = formatPhoneDisplay(ctx.branchPhone);
  return (
    `¡${ctx.customerName}, tu orden ${ctx.displayId} está lista para retiro!\n\n` +
    `Sucursal: ${ctx.branchName}\n` +
    `Al llegar, llama al ${phone} o avísanos aquí:\n${link}`
  );
}

export function buildTelegramWelcomeMessage(displayId: string): string {
  return (
    `¡Listo! Vinculamos este chat con tu orden ${displayId}.\n` +
    `Recibirás aquí las actualizaciones de tu pickup.`
  );
}
