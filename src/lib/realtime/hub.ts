import type { Server } from "node:http";
import { parse } from "node:url";
import { WebSocket, WebSocketServer } from "ws";
import {
  dashboardChannel,
  parseClientMessage,
  pickupChannel,
  type RealtimeServerMessage,
} from "@/lib/realtime/messages";

interface RealtimeClient {
  ws: WebSocket;
  channels: Set<string>;
}

export class RealtimeHub {
  private clients = new Set<RealtimeClient>();

  addClient(ws: WebSocket) {
    const client: RealtimeClient = { ws, channels: new Set() };
    this.clients.add(client);

    ws.on("message", (raw) => {
      const message = parseClientMessage(raw.toString());
      if (!message) {
        return;
      }

      if (message.action === "subscribe" && message.channel === "dashboard") {
        client.channels.add(dashboardChannel());
        return;
      }

      if (message.action === "subscribe" && message.channel === "pickup") {
        client.channels.add(pickupChannel(message.token));
      }
    });

    ws.on("close", () => {
      this.clients.delete(client);
    });

    this.send(ws, { type: "connected" });
  }

  broadcast(channel: string, message: RealtimeServerMessage) {
    const payload = JSON.stringify(message);

    for (const client of this.clients) {
      if (
        client.channels.has(channel) &&
        client.ws.readyState === WebSocket.OPEN
      ) {
        client.ws.send(payload);
      }
    }
  }

  private send(ws: WebSocket, message: RealtimeServerMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}

declare global {
  var __realtimeHub: RealtimeHub | undefined;
}

let hubInstance: RealtimeHub | null = null;

export function getRealtimeHub(): RealtimeHub | null {
  return hubInstance ?? globalThis.__realtimeHub ?? null;
}

export function attachWebSocketServer(server: Server) {
  const hub = new RealtimeHub();
  hubInstance = hub;
  globalThis.__realtimeHub = hub;

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = parse(request.url ?? "", true);
    if (pathname !== "/api/ws") {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws) => {
    hub.addClient(ws);
  });

  return hub;
}
