import { describe, expect, it } from "vitest";
import { createEmptyCharacter, type Character } from "../../src/domain/models/character";
import {
  createCharacter,
  getCharacterByToken,
  updateCharacterByToken,
  type CharacterEnvelope,
  type CharacterStoreEnv
} from "../../src/persistence/characterStore";

class InMemoryR2Bucket {
  private readonly objects = new Map<string, string>();

  async put(key: string, value: string): Promise<void> {
    this.objects.set(key, value);
  }

  async get(key: string): Promise<{ json<T>(): Promise<T>; text(): Promise<string> } | null> {
    const value = this.objects.get(key);

    if (value === undefined) {
      return null;
    }

    return {
      async json<T>() {
        return JSON.parse(value) as T;
      },
      async text() {
        return value;
      }
    };
  }
}

function createEnv(): CharacterStoreEnv {
  return {
    CHARACTERS_BUCKET: new InMemoryR2Bucket()
  };
}

function createCharacterFixture(): Character {
  return createEmptyCharacter();
}

describe("character store", () => {
  it("writes the character envelope to R2 on create", async () => {
    const env = createEnv();
    const character = createCharacterFixture();
    const result = await createCharacter(env, character);

    expect(result.token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(result.envelope).toEqual(
      expect.objectContaining({
        id: character.id,
        tokenHash: expect.any(String),
        ownerAccountId: null,
        createdAt: character.meta.createdAt,
        updatedAt: character.meta.updatedAt,
        sourceRulesVersion: character.meta.sourceRulesVersion,
        verificationMode: character.meta.verificationMode,
        character
      })
    );

    const loaded = await getCharacterByToken(env, result.token);

    expect(loaded).toEqual(result.envelope);
  });

  it("returns null for a missing token", async () => {
    const env = createEnv();

    expect(await getCharacterByToken(env, "missing-token")).toBeNull();
  });

  it("replaces the stored character and advances updatedAt on update", async () => {
    const env = createEnv();
    const original = createCharacterFixture();
    const created = await createCharacter(env, original);
    const updatedCharacter: Character = {
      ...created.envelope.character,
      meta: {
        ...created.envelope.character.meta,
        updatedAt: "2026-04-14T12:34:56.000Z"
      },
      story: {
        ...created.envelope.character.story,
        notes: "Updated notes"
      }
    };

    const updated = await updateCharacterByToken(env, created.token, updatedCharacter);

    expect(updated).toEqual(
      expect.objectContaining<CharacterEnvelope>({
        id: created.envelope.id,
        tokenHash: created.envelope.tokenHash,
        ownerAccountId: null,
        createdAt: created.envelope.createdAt,
        updatedAt: "2026-04-14T12:34:56.000Z",
        sourceRulesVersion: created.envelope.sourceRulesVersion,
        verificationMode: created.envelope.verificationMode,
        character: updatedCharacter
      })
    );

    const loaded = await getCharacterByToken(env, created.token);

    expect(loaded?.updatedAt).toBe("2026-04-14T12:34:56.000Z");
    expect(loaded?.character.story.notes).toBe("Updated notes");
  });

  it("preserves the stored character identity on update", async () => {
    const env = createEnv();
    const original = createCharacterFixture();
    const created = await createCharacter(env, original);
    const updatedCharacter: Character = {
      ...created.envelope.character,
      id: "different-character-id",
      meta: {
        ...created.envelope.character.meta,
        updatedAt: "2026-04-14T13:00:00.000Z"
      }
    };

    const updated = await updateCharacterByToken(env, created.token, updatedCharacter);

    expect(updated?.id).toBe(created.envelope.id);
    expect(updated?.character.id).toBe(created.envelope.id);
  });
});
