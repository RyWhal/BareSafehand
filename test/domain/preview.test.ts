import { describe, expect, it } from "vitest";
import { CharacterSchema, createEmptyCharacter, normalizeCharacterInput } from "../../src/domain/models/character";
import { issueSchema } from "../../src/domain/models/issues";
import { buildCreationPreview } from "../../src/domain/rules/preview";

describe("canonical character normalization", () => {
  it("keeps the canonical payload aligned to the approved schema basis", () => {
    const character = createEmptyCharacter();

    expect(character.meta.version).toBe(1);
    expect(character.meta.sourceRulesVersion).toBe("stormlight-v1");
    expect(character.meta.verificationMode).toBe("strict");
    expect(typeof character.meta.createdAt).toBe("string");
    expect(typeof character.meta.updatedAt).toBe("string");
    expect(character.meta.createdAt).toBe(character.meta.updatedAt);
    expect(Number.isNaN(Date.parse(character.meta.createdAt))).toBe(false);
    expect(Number.isNaN(Date.parse(character.meta.updatedAt))).toBe(false);

    expect(character.identity).toEqual({
      characterName: "",
      playerName: "",
      level: 1,
      tier: 1,
      ancestryId: null,
      cultureExpertiseIds: [],
      pathIds: [],
      startingPathId: null
    });

    expect(Object.keys(character.skills)).toEqual([
      "agility",
      "athletics",
      "heavyWeaponry",
      "lightWeaponry",
      "stealth",
      "thievery",
      "crafting",
      "deduction",
      "discipline",
      "intimidation",
      "lore",
      "medicine",
      "deception",
      "insight",
      "leadership",
      "perception",
      "persuasion",
      "survival"
    ]);

    expect(character.skills.agility).toEqual({ ranks: 0, modifier: 0 });
    expect(character.skills.heavyWeaponry).toEqual({ ranks: 0, modifier: 0 });

    expect(character.customSkills).toEqual({
      physical: null,
      cognitive: null,
      spiritual: null
    });

    expect(character.expertises).toEqual([]);

    expect(character.talents).toEqual([]);

    expect(character.resources).toEqual({
      health: { current: 0, max: 0 },
      focus: { current: 0, max: 0 },
      investiture: { current: 0, max: 0 }
    });

    expect(character.defenses).toEqual({
      physical: 0,
      cognitive: 0,
      spiritual: 0,
      deflect: 0
    });

    expect(character.derived).toEqual({
      movement: null,
      recoveryDie: null,
      liftingCapacity: null,
      sensesRange: null
    });

    expect(character.inventory).toEqual({
      startingKitId: null,
      weapons: [],
      armor: [],
      equipment: [],
      currency: {
        marks: 0,
        notes: ""
      }
    });

    expect(character.story).toEqual({
      purpose: "",
      obstacle: "",
      goals: [],
      notes: "",
      appearance: "",
      personality: "",
      connections: []
    });

    expect(character.radiant).toEqual({
      enabled: false,
      radiantOrderId: null,
      sprenName: null,
      sprenBondRange: null,
      ideals: {
        first: false,
        second: false,
        third: false,
        fourth: false,
        fifth: false
      },
      surges: [],
      stormlightActions: []
    });

    expect(character.conditions).toEqual([]);
    expect(character.injuries).toEqual([]);
    expect(character.rewards).toEqual([]);
    expect(character.revisionHistory).toEqual([]);
  });

  it("creates a fresh empty character with explicit identity metadata", () => {
    const character = createEmptyCharacter();

    expect(character.meta.verificationMode).toBe("strict");
    expect(character.identity.level).toBe(1);
    expect(character.identity.tier).toBe(1);
    expect(character.id.length).toBeGreaterThan(0);
  });

  it("defaults radiant.enabled to false and unsupported derived values to null", () => {
    const character = createEmptyCharacter();

    expect(character.radiant.enabled).toBe(false);
    expect(character.derived.movement).toBeNull();
    expect(character.derived.recoveryDie).toBeNull();
    expect(character.derived.liftingCapacity).toBeNull();
    expect(character.derived.sensesRange).toBeNull();
    expect(character.resources.investiture.max).toBe(0);
  });

  it("strips ownerAccountId while preserving canonical input", () => {
    const character = createEmptyCharacter();
    const normalized = normalizeCharacterInput({
      ...character,
      ownerAccountId: "account_123"
    });

    expect(normalized).toEqual(character);
    expect("ownerAccountId" in normalized).toBe(false);
    expect((normalized as { ownerAccountId?: string }).ownerAccountId).toBeUndefined();
  });

  it("rejects drifted non-canonical input instead of coercing it", () => {
    const character = createEmptyCharacter();

    expect(() =>
      normalizeCharacterInput({
        ...character,
        skills: {
          ...character.skills,
          heavy_weaponry: { ranks: 1, modifier: 0 }
        }
      })
    ).toThrow();

    expect(() =>
      normalizeCharacterInput({
        ...character,
        expertises: {
          physical: ["dueling"]
        }
      })
    ).toThrow();
  });

  it("parses canonical issues with default path and context", () => {
    expect(
      issueSchema.parse({
        code: "VALIDATION_FAILED",
        message: "Canonical character payload failed validation"
      })
    ).toEqual({
      code: "VALIDATION_FAILED",
      message: "Canonical character payload failed validation",
      path: [],
      context: {}
    });
  });

  it("rejects non-canonical issue payloads", () => {
    expect(() =>
      issueSchema.parse({
        code: "VALIDATION_FAILED",
        message: "Canonical character payload failed validation",
        extra: true
      })
    ).toThrow();
  });
});

describe("creation preview", () => {
  it("normalizes a valid draft, applies the free path rank, and exposes selectable metadata", () => {
    const preview = buildCreationPreview({
      identity: {
        ancestryId: "human",
        startingPathId: "agent",
        cultureExpertiseIds: [],
        pathIds: []
      },
      attributes: {
        strength: 3,
        speed: 3,
        intellect: 0,
        willpower: 3,
        awareness: 3,
        presence: 0
      },
      skills: {
        insight: { ranks: 0, modifier: 0 },
        athletics: { ranks: 2, modifier: 0 },
        leadership: { ranks: 2, modifier: 0 }
      },
      expertises: [],
      talents: ["rousing_presence"],
      inventory: {
        startingKitId: "academic_kit"
      }
    });

    expect(preview.character.identity.startingPathId).toBe("agent");
    expect(preview.character.skills.insight).toEqual({ ranks: 1, modifier: 0 });
    expect(preview.character.talents).toEqual(expect.arrayContaining(["opportunist", "rousing_presence"]));

    expect(preview.errors).toEqual([]);
    expect(preview.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "GM_CONFIRMATION_REQUIRED",
          path: ["ancestry", "human", "bonus_talent"]
        }),
        expect.objectContaining({
          code: "UNSUPPORTED_RULE",
          path: ["derived", "movement"]
        })
      ])
    );

    expect(preview.derived).toEqual(
      expect.objectContaining({
        defenses: {
          physical: 16,
          cognitive: 13,
          spiritual: 13,
          deflect: null
        },
        resources: {
          health: {
            max: null
          },
          focus: {
            max: 5
          },
          investiture: {
            max: 0
          }
        }
      })
    );

    expect(preview.character.derived).toEqual({
      movement: null,
      recoveryDie: null,
      liftingCapacity: null,
      sensesRange: null
    });

    expect(preview.selectableMetadata.heroicPaths).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "agent",
          keyTalentId: "opportunist",
          startingSkillId: "insight",
          startingSkillKey: "insight"
        })
      ])
    );

    expect(preview.selectableMetadata.skills).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "heavy_weaponry",
          characterKey: "heavyWeaponry"
        })
      ])
    );
  });

  it("surfaces illegal draft selections as errors instead of coercing them", () => {
    const preview = buildCreationPreview({
      identity: {
        ancestryId: "human",
        startingPathId: "agent"
      },
      attributes: {
        strength: 3,
        speed: 3,
        intellect: 0,
        willpower: 3,
        awareness: 3,
        presence: 0
      },
      skills: {
        insight: { ranks: 0, modifier: 0 },
        athletics: { ranks: 3, modifier: 0 },
        leadership: { ranks: 1, modifier: 0 }
      },
      expertises: [],
      talents: ["rousing_presence"],
      inventory: {
        startingKitId: "academic_kit"
      }
    });

    expect(preview.character.skills.athletics.ranks).toBe(3);
    expect(preview.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "VALIDATION_FAILED",
          path: ["skills", "athletics"]
        })
      ])
    );
  });

  it("retains invalid starting paths long enough to report the field-specific error", () => {
    const preview = buildCreationPreview({
      identity: {
        ancestryId: "human",
        startingPathId: "spy"
      },
      attributes: {
        strength: 3,
        speed: 3,
        intellect: 0,
        willpower: 3,
        awareness: 3,
        presence: 0
      },
      skills: {
        athletics: { ranks: 2, modifier: 0 },
        leadership: { ranks: 2, modifier: 0 }
      },
      expertises: [],
      talents: ["rousing_presence"],
      inventory: {
        startingKitId: "academic_kit"
      }
    });

    expect(preview.character.identity.startingPathId).toBe("spy");
    expect(preview.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "VALIDATION_FAILED",
          path: ["identity", "startingPathId"]
        })
      ])
    );
  });
});
