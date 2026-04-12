import { describe, expect, it } from "vitest";
import { CharacterSchema, createEmptyCharacter, normalizeCharacterInput } from "../../src/domain/models/character";

describe("canonical character normalization", () => {
  it("keeps the canonical payload aligned to the approved schema basis", () => {
    const character = createEmptyCharacter();

    expect(character.meta.version).toBe(1);
    expect(character.meta.sourceRulesVersion).toBe("stormlight-v1");
    expect(character.meta.verificationMode).toBe("strict");
    expect(typeof character.meta.createdAt).toBe("string");
    expect(typeof character.meta.updatedAt).toBe("string");
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

  it("defaults a normalized level 1 draft to strict verification mode", () => {
    const character = normalizeCharacterInput({});

    expect(character.meta.verificationMode).toBe("strict");
    expect(character.identity.level).toBe(1);
    expect(character.identity.tier).toBe(1);
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

  it("keeps ownerAccountId out of the canonical payload", () => {
    const character = normalizeCharacterInput({
      id: "character-preview-test",
      ownerAccountId: "account_123"
    });

    expect("ownerAccountId" in character).toBe(false);
    expect((character as { ownerAccountId?: string }).ownerAccountId).toBeUndefined();
    expect(() => CharacterSchema.parse({ ...character, ownerAccountId: "account_123" })).not.toThrow();
  });
});
