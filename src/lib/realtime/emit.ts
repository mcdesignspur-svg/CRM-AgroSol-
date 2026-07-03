import { getPickupByToken } from "@/lib/db/pickup";
import { buildDashboardUpdates } from "@/lib/realtime/build-dashboard-updates";
import { dashboardChannel, pickupChannel } from "@/lib/realtime/messages";
import { getRealtimeHub } from "@/lib/realtime/hub";

export async function emitDashboardRefresh() {
  const hub = getRealtimeHub();
  if (!hub) {
    return;
  }

  const data = await buildDashboardUpdates();
  hub.broadcast(dashboardChannel(), { type: "dashboard:update", data });
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

export async function emitOrderRealtimeUpdates(pickupToken?: string | null) {
  await emitDashboardRefresh();
  if (pickupToken) {
    await emitPickupRefresh(pickupToken);
  }
}
