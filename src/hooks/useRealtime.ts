"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeServerMessage } from "@/lib/realtime/messages";

const RECONNECT_BASE_MS = 1_500;
const RECONNECT_MAX_MS = 15_000;

interface UseRealtimeOptions {
  channel: "dashboard" | "entregas" | "pickup" | "delivery";
  token?: string;
  enabled?: boolean;
  onMessage: (message: RealtimeServerMessage) => void;
}

function buildWebSocketUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/ws`;
}

export function useRealtime({
  channel,
  token,
  enabled = true,
  onMessage,
}: UseRealtimeOptions) {
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  const reconnectAttempt = useRef(0);
  const reconnectTimer = useRef<number | null>(null);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if ((channel === "pickup" || channel === "delivery") && !token) {
      return;
    }

    let ws: WebSocket | null = null;
    let disposed = false;

    function clearReconnectTimer() {
      if (reconnectTimer.current !== null) {
        window.clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    }

    function scheduleReconnect() {
      if (disposed) {
        return;
      }

      const delay = Math.min(
        RECONNECT_MAX_MS,
        RECONNECT_BASE_MS * 2 ** reconnectAttempt.current,
      );
      reconnectAttempt.current += 1;
      clearReconnectTimer();
      reconnectTimer.current = window.setTimeout(() => {
        connect();
      }, delay);
    }

    function connect() {
      if (disposed) {
        return;
      }

      ws = new WebSocket(buildWebSocketUrl());

      ws.onopen = () => {
        reconnectAttempt.current = 0;
        setConnected(true);
        ws?.send(
          JSON.stringify(
            channel === "dashboard" || channel === "entregas"
              ? { action: "subscribe", channel }
              : { action: "subscribe", channel, token },
          ),
        );
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as RealtimeServerMessage;
          onMessageRef.current(message);
        } catch {
          // Ignore malformed payloads.
        }
      };

      ws.onclose = () => {
        setConnected(false);
        scheduleReconnect();
      };

      ws.onerror = () => {
        ws?.close();
      };
    }

    connect();

    return () => {
      disposed = true;
      clearReconnectTimer();
      ws?.close();
      setConnected(false);
    };
  }, [channel, token, enabled]);

  return { connected };
}
