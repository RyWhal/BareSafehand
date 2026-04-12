import { describe, expect, it } from "vitest";
import { getAvailableAncestries, getAvailableHeroicPaths, getSelectableExpertises } from "../../src/content/registry";
import { loadContent, validateContentReferences } from "../../src/content/loadContent";

describe("loadContent", () => {
  it("loads the verified ancestry list", () => {
    const content = loadContent();
    expect(getAvailableAncestries(content).map((item) => item.id)).toEqual(["human", "singer"]);
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
    expect(getSelectableExpertises(content, { includePartial: true }).map((item) => item.id)).toContain("high_society");
    expect(getSelectableExpertises(content, { includePartial: true }).map((item) => item.id)).toContain("religion");
  });

  it("keeps incomplete kit fields null instead of fabricating values", () => {
    const content = loadContent();
    const kit = content.startingKits.find((item) => item.id === "academic_kit");

    expect(kit).toBeDefined();
    expect(kit?.contents?.unknown).toBeNull();
  });

  it("throws when the loader encounters missing cross-file references", async () => {
    const content = loadContent();
    const brokenContent = {
      ...content,
      heroicPaths: [
        {
          ...content.heroicPaths[0],
          starting_skill_id: "missing_skill",
          key_talent_id: "missing_talent"
        }
      ]
    };

    expect(() => validateContentReferences(brokenContent)).toThrowError(
      /heroic path agent starting_skill_id references missing skill missing_skill/
    );
    expect(() => validateContentReferences(brokenContent)).toThrowError(
      /heroic path agent key_talent_id references missing talent missing_talent/
    );
  });
});
