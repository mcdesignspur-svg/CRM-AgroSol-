"use client";

import { StatusBadge } from "@/components/ui/badges";
import { useOrderTimer } from "@/hooks/useOrderTimer";
import type { OrderStatus } from "@/lib/types";

interface OrderElapsedTimerProps {
  createdAt: string;
  status: OrderStatus;
  fulfillment?: string;
  className?: string;
}

export function OrderElapsedTimer({
  createdAt,
  status,
  fulfillment,
  className = "",
}: OrderElapsedTimerProps) {
  const { elapsedTime, timerClass } = useOrderTimer({
    createdAt,
    status,
    fulfillment,
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
}

export function OrderLiveStatusBadge({
  createdAt,
  status,
  fulfillment,
}: OrderLiveStatusBadgeProps) {
  const { displayStatus } = useOrderTimer({ createdAt, status, fulfillment });
  return <StatusBadge status={displayStatus} />;
}
