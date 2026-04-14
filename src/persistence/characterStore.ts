import { type Character } from "../domain/models/character";
import { generateEditToken, hashToken, tokenToObjectKey } from "./token";

export interface PersistenceR2Object {
  json<T = unknown>(): Promise<T>;
  text(): Promise<string>;
}

export interface PersistenceR2Bucket {
  get(key: string): Promise<PersistenceR2Object | null>;
  put(key: string, value: string): Promise<unknown>;
}

export interface CharacterStoreEnv {
  characters?: PersistenceR2Bucket;
  CHARACTERS_BUCKET?: PersistenceR2Bucket;
}

export interface CharacterEnvelope {
  id: string;
  tokenHash: string;
  ownerAccountId: null;
  createdAt: string;
  updatedAt: string;
  sourceRulesVersion: Character["meta"]["sourceRulesVersion"];
  verificationMode: Character["meta"]["verificationMode"];
  character: Character;
}

export interface CreatedCharacterRecord {
  envelope: CharacterEnvelope;
  editToken: string;
  token: string;
}

function getBucket(env: CharacterStoreEnv): PersistenceR2Bucket {
  const bucket = env.characters ?? env.CHARACTERS_BUCKET;

  if (!bucket) {
    throw new Error("Character store R2 binding is missing");
  }

  return bucket;
}

async function readEnvelope(env: CharacterStoreEnv, token: string): Promise<CharacterEnvelope | null> {
  const key = await tokenToObjectKey(token);
  const stored = await getBucket(env).get(key);

  if (!stored) {
    return null;
  }

  return stored.json<CharacterEnvelope>();
}

async function writeEnvelope(env: CharacterStoreEnv, envelope: CharacterEnvelope): Promise<void> {
  const tokenKey = `characters/${envelope.tokenHash}.json`;

  await getBucket(env).put(tokenKey, JSON.stringify(envelope));
}

export async function createCharacter(env: CharacterStoreEnv, character: Character): Promise<CreatedCharacterRecord> {
  const editToken = generateEditToken();
  const tokenHash = await hashToken(editToken);
  const envelope: CharacterEnvelope = {
    id: character.id,
    tokenHash,
    ownerAccountId: null,
    createdAt: character.meta.createdAt,
    updatedAt: character.meta.updatedAt,
    sourceRulesVersion: character.meta.sourceRulesVersion,
    verificationMode: character.meta.verificationMode,
    character
  };

  await writeEnvelope(env, envelope);

  return {
    envelope,
    editToken,
    token: editToken
  };
}

export async function getCharacterByToken(env: CharacterStoreEnv, token: string): Promise<CharacterEnvelope | null> {
  return readEnvelope(env, token);
}

export async function updateCharacterByToken(
  env: CharacterStoreEnv,
  token: string,
  character: Character
): Promise<CharacterEnvelope | null> {
  const existing = await readEnvelope(env, token);

  if (!existing) {
    return null;
  }

  const nextCharacter: Character = {
    ...character,
    id: existing.id
  };

  const envelope: CharacterEnvelope = {
    ...existing,
    character: nextCharacter,
    updatedAt: nextCharacter.meta.updatedAt,
    sourceRulesVersion: nextCharacter.meta.sourceRulesVersion,
    verificationMode: nextCharacter.meta.verificationMode
  };

  await writeEnvelope(env, envelope);

  return envelope;
}
