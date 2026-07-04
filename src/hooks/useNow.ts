"use client";

import { useSyncExternalStore } from "react";

const subscribers = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function subscribe(callback: () => void) {
  subscribers.add(callback);
  if (!intervalId) {
    intervalId = setInterval(() => {
      for (const cb of subscribers) {
        cb();
      }
    }, 1000);
  }
  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0 && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

function getSnapshot() {
  return Date.now();
}

export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
