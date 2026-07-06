"use client";

import { StatusBadge } from "@/components/ui/badges";
import { useOrderTimer } from "@/hooks/useOrderTimer";
import type { OrderStatus } from "@/lib/types";

interface OrderElapsedTimerProps {
  createdAt: string;
  status: OrderStatus;
  fulfillment?: string;
  dispatchedAt?: string;
  className?: string;
}

export function OrderElapsedTimer({
  createdAt,
  status,
  fulfillment,
  dispatchedAt,
  className = "",
}: OrderElapsedTimerProps) {
  const { elapsedTime, timerClass } = useOrderTimer({
    createdAt,
    status,
    fulfillment,
    dispatchedAt,
  });

  return (
    <span className={`font-mono ${timerClass} ${className}`.trim()}>
      {elapsedTime}
    </span>
  );
}

interface OrderLiveStatusBadgeProps {
  createdAt: string;
  status: OrderStatus;
  fulfillment?: string;
  dispatchedAt?: string;
}

export function OrderLiveStatusBadge({
  createdAt,
  status,
  fulfillment,
  dispatchedAt,
}: OrderLiveStatusBadgeProps) {
  const { displayStatus } = useOrderTimer({
    createdAt,
    status,
    fulfillment,
    dispatchedAt,
  });
  return <StatusBadge status={displayStatus} />;
}
