import { describe, expect, it } from "vitest";
import { loadContent } from "../../src/content/loadContent";
import {
  getAvailableAncestries,
  getAvailableAncestryTalents,
  getAvailableExpertises,
  getAvailableHeroicPaths,
  getAvailableStartingKits,
  getAvailableTalents
} from "../../src/domain/rules/choices";

describe("creation choice providers", () => {
  it("hides partial ancestries by default and includes them only when asked", () => {
    const registry = loadContent();
    const partialRegistry = {
      ...registry,
      ancestries: [
        ...registry.ancestries,
        {
          id: "parshman",
          name: "Parshman",
          source_book: null,
          source_page: null,
          verification_status: "partial" as const,
          notes: "Partial ancestry example."
        }
      ]
    };

    expect(getAvailableAncestries(partialRegistry).map((item) => item.id)).not.toContain("parshman");
    expect(getAvailableAncestries(partialRegistry, { includePartial: true }).map((item) => item.id)).toContain(
      "parshman"
    );
  });

  it("only exposes verified heroic paths by default", () => {
    const registry = loadContent();
    const partialRegistry = {
      ...registry,
      heroicPaths: [
        ...registry.heroicPaths,
        {
          id: "spy",
          name: "Spy",
          source_book: null,
          source_page: null,
          verification_status: "partial" as const,
          notes: "Partial heroic path example.",
          starting_skill_id: "stealth",
          key_talent_id: "opportunist"
        }
      ]
    };

    expect(getAvailableHeroicPaths(partialRegistry).map((item) => item.id)).not.toContain("spy");
    expect(getAvailableHeroicPaths(partialRegistry, { includePartial: true }).map((item) => item.id)).toContain(
      "spy"
    );
  });

  it("hides partial expertises by default and includes them only when asked", () => {
    const registry = loadContent();

    expect(getAvailableExpertises(registry)).toEqual([]);
    expect(getAvailableExpertises(registry, { includePartial: true }).map((item) => item.id)).toEqual(
      expect.arrayContaining(["alethi", "botany", "knives"])
    );
  });

  it("returns verified path talents for the selected heroic path", () => {
    const registry = loadContent();
    const result = getAvailableTalents(registry, { heroicPathId: "agent" });

    expect(result.map((item) => item.id)).toEqual(["opportunist"]);
  });

  it("does not expose path talents for an unselectable heroic path", () => {
    const registry = loadContent();
    const partialRegistry = {
      ...registry,
      heroicPaths: [
        ...registry.heroicPaths,
        {
          id: "spy",
          name: "Spy",
          source_book: null,
          source_page: null,
          verification_status: "partial" as const,
          notes: "Partial heroic path example.",
          starting_skill_id: "stealth",
          key_talent_id: "shadow_step"
        }
      ],
      talents: [
        ...registry.talents,
        {
          id: "shadow_step",
          name: "Shadow Step",
          source_book: null,
          source_page: null,
          verification_status: "verified" as const,
          notes: "Partial path key talent.",
          path_id: "spy"
        }
      ]
    };

    expect(getAvailableTalents(partialRegistry, { heroicPathId: "spy" })).toEqual([]);
    expect(getAvailableTalents(partialRegistry, { heroicPathId: "spy", includePartial: true })).toEqual([
      expect.objectContaining({ id: "shadow_step" })
    ]);
  });

  it("queues an extra human heroic-path talent choice and flags GM confirmation when path prerequisites cannot be proven", () => {
    const registry = loadContent();
    const result = getAvailableAncestryTalents(registry, {
      ancestryId: "human",
      heroicPathId: "agent"
    });

    expect(result.grantedTalents).toEqual([]);
    expect(result.choiceGroups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "human_bonus_talent",
          type: "heroic_path_talent",
          count: 1,
          options: expect.arrayContaining([
            expect.objectContaining({ id: "rousing_presence" }),
            expect.objectContaining({ id: "seek_quarry" })
          ]),
          issues: expect.arrayContaining([
            expect.objectContaining({
              code: "GM_CONFIRMATION_REQUIRED"
            })
          ])
        })
      ])
    );
  });

  it("queues singer change form and one verified singer-form package", () => {
    const registry = loadContent();
    const result = getAvailableAncestryTalents(registry, {
      ancestryId: "singer",
      heroicPathId: "agent"
    });

    expect(result.grantedTalents.map((item) => item.id)).toEqual(["change_form"]);
    expect(result.choiceGroups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "singer_starting_form_package",
          type: "talent_package",
          count: 1,
          options: expect.arrayContaining([
            expect.objectContaining({
              name: "Forms of Finesse",
              talentIds: ["artform", "nimbleform"]
            }),
            expect.objectContaining({
              name: "Forms of Wisdom",
              talentIds: ["mediationform", "scholarform"]
            }),
            expect.objectContaining({
              name: "Forms of Resolve",
              talentIds: ["warform", "workform"]
            })
          ])
        })
      ])
    );
  });

  it("filters out singer packages with unselectable talents", () => {
    const registry = loadContent();
    const partialRegistry = {
      ...registry,
      talents: registry.talents.map((talent) =>
        talent.id === "nimbleform"
          ? {
              ...talent,
              verification_status: "unavailable" as const
            }
          : talent
      )
    };
    const result = getAvailableAncestryTalents(partialRegistry, {
      ancestryId: "singer",
      heroicPathId: "agent"
    });

    expect(result.choiceGroups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "singer_starting_form_package",
          options: expect.not.arrayContaining([
            expect.objectContaining({
              name: "Forms of Finesse"
            })
          ])
        })
      ])
    );
  });

  it("surfaces invalid ancestry ids distinctly from an unset ancestry", () => {
    const registry = loadContent();
    const result = getAvailableAncestryTalents(registry, {
      ancestryId: "parshman",
      heroicPathId: "agent"
    });

    expect(result.ancestry).toBeNull();
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "VALIDATION_FAILED",
          path: ["identity", "ancestryId"]
        })
      ])
    );
  });

  it("returns verified starting kits", () => {
    const registry = loadContent();

    expect(getAvailableStartingKits(registry).map((item) => item.id)).toEqual([
      "academic_kit",
      "artisan_kit",
      "military_kit",
      "courtier_kit",
      "prisoner_kit",
      "underworld_kit"
    ]);
  });
});
