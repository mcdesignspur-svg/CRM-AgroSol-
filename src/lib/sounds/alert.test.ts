import { describe, expect, it } from "vitest";
import { playAlertSound, unlockAlertSounds } from "./alert";

describe("alert sounds", () => {
  it("does not throw when audio is unavailable", () => {
    expect(() => playAlertSound("urgent")).not.toThrow();
    expect(() => unlockAlertSounds()).not.toThrow();
  });
});
