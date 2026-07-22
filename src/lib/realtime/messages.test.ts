import { describe, expect, it } from "vitest";
import {
  dashboardChannel,
  parseClientMessage,
  pickupChannel,
} from "./messages";

describe("realtime messages", () => {
  it("builds channel keys", () => {
    expect(dashboardChannel()).toBe("dashboard");
    expect(pickupChannel("abc123")).toBe("pickup:abc123");
  });

  it("parses dashboard subscribe", () => {
    expect(
      parseClientMessage(JSON.stringify({ action: "subscribe", channel: "dashboard" })),
    ).toEqual({ action: "subscribe", channel: "dashboard" });
  });

  it("parses pickup subscribe", () => {
    expect(
      parseClientMessage(
        JSON.stringify({ action: "subscribe", channel: "pickup", token: " tok " }),
      ),
    ).toEqual({ action: "subscribe", channel: "pickup", token: "tok" });
  });

  it("parses delivery subscribe", () => {
    expect(
      parseClientMessage(
        JSON.stringify({ action: "subscribe", channel: "delivery", token: "abc" }),
      ),
    ).toEqual({ action: "subscribe", channel: "delivery", token: "abc" });
  });

  it("rejects invalid subscribe payloads", () => {
    expect(parseClientMessage("{")).toBeNull();
    expect(
      parseClientMessage(JSON.stringify({ action: "subscribe", channel: "pickup" })),
    ).toBeNull();
  });
});
