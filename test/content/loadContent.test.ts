import { describe, expect, it } from "vitest";
import { getAvailableAncestries, getAvailableHeroicPaths, getSelectableExpertises } from "../../src/content/registry";
import { loadContent } from "../../src/content/loadContent";

describe("loadContent", () => {
  it("loads the verified ancestry list", () => {
    const content = loadContent();
    expect(content.ancestries.map((item) => item.id)).toEqual(["human", "singer"]);
  });

  it("exposes the six verified heroic paths", () => {
    const content = loadContent();
    expect(getAvailableHeroicPaths(content).map((item) => item.id)).toEqual([
      "agent",
      "envoy",
      "hunter",
      "leader",
      "scholar",
      "warrior"
    ]);
  });

  it("loads partial expertises without making them selectable by default", () => {
    const content = loadContent();

    expect(content.expertises.some((item) => item.id === "high_society")).toBe(true);
    expect(content.expertises.some((item) => item.id === "religion")).toBe(true);

    expect(getSelectableExpertises(content).map((item) => item.id)).not.toContain("high_society");
    expect(getSelectableExpertises(content).map((item) => item.id)).not.toContain("religion");
  });

  it("keeps incomplete kit fields null instead of fabricating values", () => {
    const content = loadContent();
    const kit = content.startingKits.find((item) => item.id === "academic_kit");

    expect(kit).toBeDefined();
    expect(kit?.contents?.unknown).toBeNull();
  });
});
