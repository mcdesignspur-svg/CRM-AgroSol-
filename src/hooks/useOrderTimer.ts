"use client";

import { useMemo, useState } from "react";
import { getOrderTimerClass } from "@/lib/order-timer-styles";
import { resolveDisplayStatus } from "@/lib/order-status";
import { formatElapsedTime } from "@/lib/time/format-elapsed";
import type { OrderStatus } from "@/lib/types";
import { useNow } from "./useNow";

export interface UseOrderTimerInput {
  createdAt: string;
  status: OrderStatus;
  fulfillment?: string;
  dispatchedAt?: string;
}

export function useOrderTimer({
  createdAt,
  status,
  fulfillment = "pickup",
  dispatchedAt,
}: UseOrderTimerInput) {
  const now = useNow();
  const isFrozen = status === "completado";
  const [frozenAt, setFrozenAt] = useState<number | null>(null);

  if (isFrozen) {
    if (frozenAt === null) {
      setFrozenAt(now);
    }
  } else if (frozenAt !== null) {
    setFrozenAt(null);
  }

  const effectiveNow = isFrozen ? (frozenAt ?? now) : now;

  return useMemo(() => {
    const created = new Date(createdAt);
    const displayStatus = resolveDisplayStatus({
      status,
      fulfillment,
      createdAt: created,
      dispatchedAt: dispatchedAt ? new Date(dispatchedAt) : undefined,
      now: effectiveNow,
    });

    return {
      elapsedTime: formatElapsedTime(createdAt, effectiveNow),
      displayStatus,
      timerClass: getOrderTimerClass(displayStatus),
    };
  }, [createdAt, status, fulfillment, dispatchedAt, effectiveNow]);
}
