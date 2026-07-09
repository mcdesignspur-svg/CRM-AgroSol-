import { getPickupByToken } from "@/lib/db/pickup";
import { getDeliveryByToken } from "@/lib/db/delivery";
import { getEntregasLiveSnapshot } from "@/lib/db/deliveries";
import { buildDashboardUpdates } from "@/lib/realtime/build-dashboard-updates";
import {
  dashboardChannel,
  deliveryChannel,
  entregasChannel,
  pickupChannel,
} from "@/lib/realtime/messages";
import { getRealtimeHub } from "@/lib/realtime/hub";

export async function emitDashboardRefresh() {
  const hub = getRealtimeHub();
  if (!hub) {
    return;
  }

  const data = await buildDashboardUpdates({ skipSlaCheck: true });
  hub.broadcast(dashboardChannel(), { type: "dashboard:update", data });
}

export async function emitEntregasRefresh() {
  const hub = getRealtimeHub();
  if (!hub) {
    return;
  }

  const data = await getEntregasLiveSnapshot();
  hub.broadcast(entregasChannel(), { type: "entregas:update", data });
}

export async function emitPickupRefresh(token: string) {
  const hub = getRealtimeHub();
  if (!hub || !token.trim()) {
    return;
  }

  const pickup = await getPickupByToken(token.trim());
  if (!pickup) {
    return;
  }

  hub.broadcast(pickupChannel(token.trim()), {
    type: "pickup:update",
    data: pickup,
  });
}

export async function emitDeliveryRefresh(token: string) {
  const hub = getRealtimeHub();
  if (!hub || !token.trim()) {
    return;
  }

  const delivery = await getDeliveryByToken(token.trim());
  if (!delivery) {
    return;
  }

  hub.broadcast(deliveryChannel(token.trim()), {
    type: "delivery:update",
    data: delivery,
  });
}

export async function emitOrderRealtimeUpdates(input?: {
  pickupToken?: string | null;
  deliveryToken?: string | null;
}) {
  await emitDashboardRefresh();
  await emitEntregasRefresh();
  if (input?.pickupToken) {
    await emitPickupRefresh(input.pickupToken);
  }
  if (input?.deliveryToken) {
    await emitDeliveryRefresh(input.deliveryToken);
  }
}
