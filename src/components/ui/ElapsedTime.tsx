"use client";

import { useEffect, useState } from "react";
import { formatElapsedTime } from "@/lib/time";

interface ElapsedTimeProps {
  createdAt: string;
  className?: string;
  prefix?: string;
}

export function ElapsedTime({
  createdAt,
  className,
  prefix,
}: ElapsedTimeProps) {
  const [elapsed, setElapsed] = useState(() => formatElapsedTime(createdAt));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsed(formatElapsedTime(createdAt));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [createdAt]);

  if (prefix) {
    return (
      <span className={className}>
        {prefix}
        {elapsed}
      </span>
    );
  }

  return <span className={className}>{elapsed}</span>;
}
