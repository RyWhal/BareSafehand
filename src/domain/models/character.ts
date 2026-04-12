import { z } from "zod";

const sourceRulesVersionSchema = z.literal("stormlight-v1");

const nullableTextSchema = z.string().nullable();

const metaSchema = z
  .object({
    version: z.literal(1).default(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    sourceRulesVersion: sourceRulesVersionSchema.default("stormlight-v1"),
    verificationMode: z.enum(["strict", "lenient"]).default("strict")
  })
  .strict();

const identitySchema = z
  .object({
    characterName: z.string().default(""),
    playerName: z.string().default(""),
    level: z.number().int().default(1),
    tier: z.number().int().default(1),
    ancestryId: nullableTextSchema.default(null),
    cultureExpertiseIds: z.array(z.string().min(1)).default([]),
    pathIds: z.array(z.string().min(1)).default([]),
    startingPathId: nullableTextSchema.default(null)
  })
  .strict();

const attributeValueSchema = z.number().int().default(0);

const attributesSchema = z
  .object({
    strength: attributeValueSchema,
    speed: attributeValueSchema,
    intellect: attributeValueSchema,
    willpower: attributeValueSchema,
    awareness: attributeValueSchema,
    presence: attributeValueSchema
  })
  .strict();

const skillSlotSchema = z
  .object({
    ranks: z.number().int().default(0),
    modifier: z.number().int().default(0)
  })
  .strict();

const skillsSchema = z
  .object({
    agility: skillSlotSchema.default({}),
    athletics: skillSlotSchema.default({}),
    heavyWeaponry: skillSlotSchema.default({}),
    lightWeaponry: skillSlotSchema.default({}),
    stealth: skillSlotSchema.default({}),
    thievery: skillSlotSchema.default({}),
    crafting: skillSlotSchema.default({}),
    deduction: skillSlotSchema.default({}),
    discipline: skillSlotSchema.default({}),
    intimidation: skillSlotSchema.default({}),
    lore: skillSlotSchema.default({}),
    medicine: skillSlotSchema.default({}),
    deception: skillSlotSchema.default({}),
    insight: skillSlotSchema.default({}),
    leadership: skillSlotSchema.default({}),
    perception: skillSlotSchema.default({}),
    persuasion: skillSlotSchema.default({}),
    survival: skillSlotSchema.default({})
  })
  .strict();

const customSkillEntrySchema = z
  .object({
    name: z.string().default(""),
    ranks: z.number().int().default(0),
    modifier: z.number().int().default(0),
    notes: nullableTextSchema.default(null)
  })
  .strict();

const customSkillsSchema = z
  .object({
    physical: customSkillEntrySchema.nullable().default(null),
    cognitive: customSkillEntrySchema.nullable().default(null),
    spiritual: customSkillEntrySchema.nullable().default(null)
  })
  .strict();

const expertiseListSchema = z.array(z.string().min(1)).default([]);
const talentListSchema = z.array(z.string().min(1)).default([]);

const resourceSlotSchema = z
  .object({
    current: z.number().int().default(0),
    max: z.number().int().default(0)
  })
  .strict();

const resourcesSchema = z
  .object({
    health: resourceSlotSchema.default({}),
    focus: resourceSlotSchema.default({}),
    investiture: resourceSlotSchema.default({})
  })
  .strict();

const defenseSchema = z
  .object({
    physical: z.number().int().default(0),
    cognitive: z.number().int().default(0),
    spiritual: z.number().int().default(0),
    deflect: z.number().int().default(0)
  })
  .strict();

const derivedSchema = z
  .object({
    movement: nullableTextSchema.default(null),
    recoveryDie: nullableTextSchema.default(null),
    liftingCapacity: nullableTextSchema.default(null),
    sensesRange: nullableTextSchema.default(null)
  })
  .strict();

const inventoryEntrySchema = z
  .object({
    itemId: z.string().min(1),
    quantity: z.number().int().default(1),
    name: z.string().default(""),
    notes: nullableTextSchema.default(null)
  })
  .strict();

const currencySchema = z
  .object({
    marks: z.number().int().default(0),
    notes: z.string().default("")
  })
  .strict();

const inventorySchema = z
  .object({
    startingKitId: nullableTextSchema.default(null),
    weapons: z.array(inventoryEntrySchema).default([]),
    armor: z.array(inventoryEntrySchema).default([]),
    equipment: z.array(inventoryEntrySchema).default([]),
    currency: currencySchema.default({})
  })
  .strict();

const storySchema = z
  .object({
    purpose: z.string().default(""),
    obstacle: z.string().default(""),
    goals: z.array(z.string().min(1)).default([]),
    notes: z.string().default(""),
    appearance: z.string().default(""),
    personality: z.string().default(""),
    connections: z.array(z.string().min(1)).default([])
  })
  .strict();

const radiantIdealsSchema = z
  .object({
    first: z.boolean().default(false),
    second: z.boolean().default(false),
    third: z.boolean().default(false),
    fourth: z.boolean().default(false),
    fifth: z.boolean().default(false)
  })
  .strict();

const radiantSchema = z
  .object({
    enabled: z.boolean().default(false),
    radiantOrderId: nullableTextSchema.default(null),
    sprenName: nullableTextSchema.default(null),
    sprenBondRange: nullableTextSchema.default(null),
    ideals: radiantIdealsSchema.default({}),
    surges: z.array(z.string().min(1)).default([]),
    stormlightActions: z.array(z.string().min(1)).default([])
  })
  .strict();

const revisionEntrySchema = z.record(z.string(), z.unknown());

export const CharacterSchema = z
  .object({
    id: z.string().min(1),
    meta: metaSchema,
    identity: identitySchema.default({}),
    attributes: attributesSchema.default({}),
    skills: skillsSchema.default({}),
    customSkills: customSkillsSchema.default({}),
    expertises: expertiseListSchema,
    talents: talentListSchema,
    resources: resourcesSchema.default({}),
    defenses: defenseSchema.default({}),
    derived: derivedSchema.default({}),
    inventory: inventorySchema.default({}),
    story: storySchema.default({}),
    radiant: radiantSchema.default({}),
    conditions: z.array(z.string().min(1)).default([]),
    injuries: z.array(z.string().min(1)).default([]),
    rewards: z.array(z.string().min(1)).default([]),
    revisionHistory: z.array(revisionEntrySchema).default([])
  })
  .strict();

export type Character = z.infer<typeof CharacterSchema>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createCharacterId(): string {
  const cryptoLike = globalThis as typeof globalThis & { crypto?: { randomUUID?: () => string } };

  return cryptoLike.crypto?.randomUUID?.() ?? `character-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeCharacterInput(input: unknown): Character {
  if (!isRecord(input)) {
    return CharacterSchema.parse(input);
  }

  const { ownerAccountId: _ownerAccountId, ...payload } = input;

  return CharacterSchema.parse(payload);
}

export function createEmptyCharacter(): Character {
  const timestamp = new Date().toISOString();

  return CharacterSchema.parse({
    id: createCharacterId(),
    meta: {
      createdAt: timestamp,
      updatedAt: timestamp
    }
  });
}
