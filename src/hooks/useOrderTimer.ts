"use client";

import { useMemo, useRef } from "react";
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
  const isFrozen = status === "completado";
  const frozenAtRef = useRef<number | null>(null);
  if (isFrozen && frozenAtRef.current === null) {
    frozenAtRef.current = Date.now();
  }

  const now = useNow();
  const effectiveNow = isFrozen ? (frozenAtRef.current ?? now) : now;

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
