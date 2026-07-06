"use client";

import { useMemo } from "react";
import { getOrderTimerClass } from "@/lib/order-timer-styles";
import { resolveDisplayStatus } from "@/lib/order-status";
import { formatElapsedTime } from "@/lib/time/format-elapsed";
import type { OrderStatus } from "@/lib/types";
import { useNow } from "./useNow";

export interface UseOrderTimerInput {
  createdAt: string;
  status: OrderStatus;
  fulfillment?: string;
}

export function useOrderTimer({
  createdAt,
  status,
  fulfillment = "pickup",
}: UseOrderTimerInput) {
  const now = useNow();
  const isFrozen = status === "completado";
  const frozenAt = useMemo(
    () => (isFrozen ? now : null),
    // Capture `now` only when freeze state changes, not on every tick.
    [isFrozen],
  );

  const effectiveNow = frozenAt ?? now;

  return useMemo(() => {
    const created = new Date(createdAt);
    const displayStatus = resolveDisplayStatus({
      status,
      fulfillment,
      createdAt: created,
      now: effectiveNow,
    });

    return {
      elapsedTime: formatElapsedTime(createdAt, effectiveNow),
      displayStatus,
      timerClass: getOrderTimerClass(displayStatus),
    };
  }, [createdAt, status, fulfillment, effectiveNow]);
}
