import { describe, expect, it } from "vitest";
import { buildGoogleMapsSearchUrl } from "./google-maps";

describe("buildGoogleMapsSearchUrl", () => {
  it("returns null for an empty address", () => {
    expect(buildGoogleMapsSearchUrl("   ")).toBeNull();
  });

  it("adds Puerto Rico context to a local address", () => {
    expect(buildGoogleMapsSearchUrl("Carr. 30, Gurabo")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Carr.+30%2C+Gurabo%2C+Puerto+Rico",
    );
  });

  it("does not duplicate an existing Puerto Rico context", () => {
    expect(buildGoogleMapsSearchUrl("Caguas, Puerto Rico")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Caguas%2C+Puerto+Rico",
    );
  });

  it("recognizes a Puerto Rico postal abbreviation", () => {
    expect(buildGoogleMapsSearchUrl("Gurabo, PR 00778")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Gurabo%2C+PR+00778",
    );
  });
});
