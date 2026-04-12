import { describe, expect, it } from "vitest";
import { CharacterSchema, createEmptyCharacter, normalizeCharacterInput } from "../../src/domain/models/character";
import { issueSchema } from "../../src/domain/models/issues";

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
});
