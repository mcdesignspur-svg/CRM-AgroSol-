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
  dispatchedAt?: string;
  completedAt?: string;
}

export function useOrderTimer({
  createdAt,
  status,
  fulfillment = "pickup",
  dispatchedAt,
  completedAt,
}: UseOrderTimerInput) {
  const isCompleted = status === "completado";
  const completedAtMs = useMemo(() => {
    if (!completedAt) {
      return null;
    }

    const parsed = new Date(completedAt).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }, [completedAt]);
  const now = useNow(!isCompleted || completedAtMs === null);
  const effectiveNow = isCompleted ? (completedAtMs ?? now) : now;

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
