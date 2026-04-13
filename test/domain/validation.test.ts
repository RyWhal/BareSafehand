import { describe, expect, it } from "vitest";
import { loadContent } from "../../src/content/loadContent";
import {
  validateCreationAttributes,
  validateCreationExpertiseCount,
  validateCreationSkillRanks,
  validateStartingKitSelection,
  validateTalentSelection
} from "../../src/domain/rules/validation";

describe("creation validation", () => {
  it("rejects attribute arrays that do not total 12", () => {
    const result = validateCreationAttributes({
      strength: 3,
      speed: 3,
      intellect: 3,
      willpower: 3,
      awareness: 3,
      presence: 0
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "VALIDATION_FAILED",
          path: ["attributes"],
          message: expect.stringContaining("12")
        })
      ])
    );
  });

  it("rejects attributes outside the 0 to 3 creation range", () => {
    const result = validateCreationAttributes({
      strength: 4,
      speed: 3,
      intellect: 2,
      willpower: 1,
      awareness: 1,
      presence: 1
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "VALIDATION_FAILED",
          path: ["attributes", "strength"]
        })
      ])
    );
  });

  it("rejects missing creation attributes instead of treating them as zero", () => {
    const result = validateCreationAttributes({
      strength: 3,
      speed: 3,
      intellect: 3,
      willpower: 3
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "VALIDATION_FAILED",
          path: ["attributes", "awareness"]
        }),
        expect.objectContaining({
          code: "VALIDATION_FAILED",
          path: ["attributes", "presence"]
        })
      ])
    );
  });

  it("requires the starting path skill's free rank", () => {
    const result = validateCreationSkillRanks({
      startingSkillId: "insight",
      skillRanks: {
        insight: 0,
        athletics: 2,
        leadership: 2
      }
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "VALIDATION_FAILED",
          path: ["skills", "insight"]
        })
      ])
    );
  });

  it("rejects creation skill allocations above rank 2", () => {
    const result = validateCreationSkillRanks({
      startingSkillId: "insight",
      skillRanks: {
        insight: 3,
        athletics: 2
      }
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "VALIDATION_FAILED",
          path: ["skills", "insight"],
          message: expect.stringContaining("2")
        })
      ])
    );
  });

  it("requires additional expertise count to equal Intellect", () => {
    const result = validateCreationExpertiseCount({
      intellect: 2,
      additionalExpertiseIds: ["botany"]
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "VALIDATION_FAILED",
          path: ["expertises", "additional"]
        })
      ])
    );
  });

  it("accepts verified talent and starting kit selections", () => {
    const registry = loadContent();

    const talentResult = validateTalentSelection({
      registry,
      heroicPathId: "agent",
      ancestryId: "singer",
      selectedTalentIds: ["opportunist", "change_form", "artform", "nimbleform"]
    });
    const kitResult = validateStartingKitSelection({
      registry,
      startingKitId: "academic_kit"
    });

    expect(talentResult.ok).toBe(true);
    expect(talentResult.errors).toEqual([]);
    expect(kitResult.ok).toBe(true);
    expect(kitResult.errors).toEqual([]);
  });

  it("rejects talents from an unverified singer package", () => {
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
    const result = validateTalentSelection({
      registry: partialRegistry,
      heroicPathId: "agent",
      ancestryId: "singer",
      selectedTalentIds: ["opportunist", "change_form", "artform", "nimbleform"]
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "VALIDATION_FAILED",
          path: ["talents", "singer_starting_form_package"]
        }),
        expect.objectContaining({
          code: "VALIDATION_FAILED",
          path: ["talents", "nimbleform"]
        })
      ])
    );
  });

  it("rejects invalid ancestry ids instead of treating them as unset", () => {
    const registry = loadContent();
    const result = validateTalentSelection({
      registry,
      heroicPathId: "agent",
      ancestryId: "parshman",
      selectedTalentIds: ["opportunist"]
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "VALIDATION_FAILED",
          path: ["identity", "ancestryId"]
        })
      ])
    );
  });

  it("rejects duplicate talent selections", () => {
    const registry = loadContent();
    const result = validateTalentSelection({
      registry,
      heroicPathId: "agent",
      ancestryId: "human",
      selectedTalentIds: ["opportunist", "rousing_presence", "rousing_presence"]
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "VALIDATION_FAILED",
          path: ["talents"],
          message: expect.stringContaining("duplicates")
        })
      ])
    );
  });
});
