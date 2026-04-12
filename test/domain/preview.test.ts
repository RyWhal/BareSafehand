import { describe, expect, it } from "vitest";
import { createEmptyCharacter, normalizeCharacterInput } from "../../src/domain/models/character";

describe("canonical character normalization", () => {
  it("defaults a normalized level 1 draft to strict verification mode", () => {
    const character = normalizeCharacterInput({});

    expect(character.meta.verificationMode).toBe("strict");
    expect(character.identity.level).toBe(1);
    expect(character.identity.tier).toBe(1);
  });

  it("defaults radiant.enabled to false", () => {
    const character = createEmptyCharacter();

    expect(character.radiant.enabled).toBe(false);
  });

  it("keeps unsupported derived values unset", () => {
    const character = createEmptyCharacter();

    expect(character.derived.movement).toBeNull();
    expect(character.derived.recoveryDie).toBeNull();
    expect(character.derived.maxHealth).toBeNull();
    expect(character.resources.investiture.max).toBe(0);
  });

  it("keeps ownerAccountId out of the canonical payload", () => {
    const character = normalizeCharacterInput({
      id: "character-preview-test",
      ownerAccountId: "account_123"
    });

    expect("ownerAccountId" in character).toBe(false);
    expect((character as { ownerAccountId?: string }).ownerAccountId).toBeUndefined();
  });
});
