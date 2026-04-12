import { z } from "zod";

const sourceRulesVersionSchema = z.literal("stormlight-v1");

const nullableValueSchema = z.union([z.string(), z.number()]).nullable().default(null);

const attributesSchema = z
  .object({
    strength: z.number().int().min(0).max(3).default(0),
    speed: z.number().int().min(0).max(3).default(0),
    intellect: z.number().int().min(0).max(3).default(0),
    willpower: z.number().int().min(0).max(3).default(0),
    awareness: z.number().int().min(0).max(3).default(0),
    presence: z.number().int().min(0).max(3).default(0)
  })
  .default({});

const metaSchema = z
  .object({
    version: z.literal(1).default(1),
    sourceRulesVersion: sourceRulesVersionSchema.default("stormlight-v1"),
    verificationMode: z.enum(["strict", "lenient"]).default("strict")
  })
  .default({});

const identitySchema = z
  .object({
    level: z.literal(1).default(1),
    tier: z.literal(1).default(1),
    ancestryId: z.string().min(1).nullable().default(null),
    cultureExpertiseIds: z.array(z.string().min(1)).default([]),
    heroicPathId: z.string().min(1).nullable().default(null)
  })
  .default({});

const skillsSchema = z.record(z.string().min(1), z.number().int().min(0).max(2)).default({});

const customSkillSchema = z.record(z.string(), z.unknown());

const resourcesSchema = z
  .object({
    investiture: z
      .object({
        current: z.number().int().min(0).default(0),
        max: z.number().int().min(0).default(0)
      })
      .default({})
  })
  .default({});

const defensesSchema = z
  .object({
    physical: z.number().nullable().default(null),
    cognitive: z.number().nullable().default(null),
    spiritual: z.number().nullable().default(null)
  })
  .default({});

const derivedSchema = z
  .object({
    physicalDefense: z.number().nullable().default(null),
    cognitiveDefense: z.number().nullable().default(null),
    spiritualDefense: z.number().nullable().default(null),
    focusMax: z.number().nullable().default(null),
    movement: nullableValueSchema,
    recoveryDie: nullableValueSchema,
    liftingCapacity: nullableValueSchema,
    sensesRange: nullableValueSchema,
    deflect: nullableValueSchema,
    maxHealth: z.number().nullable().default(null)
  })
  .default({});

const storySchema = z
  .object({
    name: z.string().default(""),
    summary: z.string().nullable().default(null),
    background: z.string().nullable().default(null),
    notes: z.string().nullable().default(null)
  })
  .default({});

const inventoryItemSchema = z.record(z.string(), z.unknown());

const radiantSchema = z
  .object({
    enabled: z.boolean().default(false)
  })
  .default({});

const revisionEntrySchema = z.record(z.string(), z.unknown());

export const CharacterSchema = z
  .object({
    id: z.string().min(1),
    meta: metaSchema,
    identity: identitySchema,
    attributes: attributesSchema,
    skills: skillsSchema,
    customSkills: z.array(customSkillSchema).default([]),
    expertises: z.array(z.string().min(1)).default([]),
    talents: z.array(z.string().min(1)).default([]),
    resources: resourcesSchema,
    defenses: defensesSchema,
    derived: derivedSchema,
    inventory: z.array(inventoryItemSchema).default([]),
    story: storySchema,
    radiant: radiantSchema,
    conditions: z.array(z.string().min(1)).default([]),
    injuries: z.array(z.string().min(1)).default([]),
    rewards: z.array(z.string().min(1)).default([]),
    revisionHistory: z.array(revisionEntrySchema).default([])
  })
  .strip();

export type Character = z.infer<typeof CharacterSchema>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createCharacterId(): string {
  const cryptoLike = globalThis as typeof globalThis & { crypto?: { randomUUID?: () => string } };

  return cryptoLike.crypto?.randomUUID?.() ?? `character-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeCharacterInput(input: unknown): Character {
  const payload = isRecord(input) ? { ...input } : {};
  const id = typeof payload.id === "string" && payload.id.trim().length > 0 ? payload.id : createCharacterId();

  return CharacterSchema.parse({
    ...payload,
    id
  });
}

export function createEmptyCharacter(): Character {
  return normalizeCharacterInput({});
}
