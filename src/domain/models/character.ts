import { z } from "zod";

const sourceRulesVersionSchema = z.literal("stormlight-v1");

const defaultTextSchema = (fallback = "") =>
  z.preprocess((value) => (value == null ? fallback : value), z.string());

const nullableTextSchema = z.preprocess(
  (value) => (value == null || value === "" ? null : value),
  z.string().nullable()
);

const integerSchema = (fallback = 0) =>
  z.preprocess((value) => (value == null ? fallback : value), z.number().int());

const booleanSchema = (fallback = false) =>
  z.preprocess((value) => (value == null ? fallback : value), z.boolean());

const isoTimestampSchema = z.preprocess(
  (value) => (value == null || value === "" ? new Date().toISOString() : value),
  z.string().datetime()
);

const metaSchema = z.object({
  version: z.literal(1).default(1),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  sourceRulesVersion: sourceRulesVersionSchema.default("stormlight-v1"),
  verificationMode: z.enum(["strict", "lenient"]).default("strict")
});

const identitySchema = z.object({
  characterName: defaultTextSchema(""),
  playerName: defaultTextSchema(""),
  level: integerSchema(1),
  tier: integerSchema(1),
  ancestryId: nullableTextSchema.default(null),
  cultureExpertiseIds: z.array(z.string().min(1)).default([]),
  pathIds: z.array(z.string().min(1)).default([]),
  startingPathId: nullableTextSchema.default(null)
});

const attributeValueSchema = integerSchema(0);

const attributesSchema = z.object({
  strength: attributeValueSchema,
  speed: attributeValueSchema,
  intellect: attributeValueSchema,
  willpower: attributeValueSchema,
  awareness: attributeValueSchema,
  presence: attributeValueSchema
});

const skillSlotSchema = z.object({
  ranks: integerSchema(0),
  modifier: integerSchema(0)
});

const skillsSchema = z.object({
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
});

const customSkillEntrySchema = z.object({
  name: defaultTextSchema(""),
  ranks: integerSchema(0),
  modifier: integerSchema(0),
  notes: nullableTextSchema
});

const customSkillsSchema = z.object({
  physical: customSkillEntrySchema.nullable().default(null),
  cognitive: customSkillEntrySchema.nullable().default(null),
  spiritual: customSkillEntrySchema.nullable().default(null)
});

const expertiseListSchema = z.array(z.string().min(1)).default([]);
const talentListSchema = z.array(z.string().min(1)).default([]);

const resourceSlotSchema = z.object({
  current: integerSchema(0),
  max: integerSchema(0)
});

const resourcesSchema = z.object({
  health: resourceSlotSchema.default({}),
  focus: resourceSlotSchema.default({}),
  investiture: resourceSlotSchema.default({})
});

const defenseSchema = z.object({
  physical: integerSchema(0),
  cognitive: integerSchema(0),
  spiritual: integerSchema(0),
  deflect: integerSchema(0)
});

const derivedSchema = z.object({
  movement: nullableTextSchema.default(null),
  recoveryDie: nullableTextSchema.default(null),
  liftingCapacity: nullableTextSchema.default(null),
  sensesRange: nullableTextSchema.default(null)
});

const inventoryEntrySchema = z.object({
  itemId: z.string().min(1),
  quantity: integerSchema(1),
  name: defaultTextSchema(""),
  notes: nullableTextSchema
});

const inventorySchema = z.object({
  startingKitId: nullableTextSchema,
  weapons: z.array(inventoryEntrySchema).default([]),
  armor: z.array(inventoryEntrySchema).default([]),
  equipment: z.array(inventoryEntrySchema).default([]),
  currency: z
    .object({
      marks: integerSchema(0),
      notes: defaultTextSchema("")
    })
    .default({
      marks: 0,
      notes: ""
    })
}).default({
  startingKitId: null,
  weapons: [],
  armor: [],
  equipment: [],
  currency: {
    marks: 0,
    notes: ""
  }
});

const storySchema = z.object({
  purpose: defaultTextSchema(""),
  obstacle: defaultTextSchema(""),
  goals: z.array(z.string().min(1)).default([]),
  notes: defaultTextSchema(""),
  appearance: defaultTextSchema(""),
  personality: defaultTextSchema(""),
  connections: z.array(z.string().min(1)).default([])
});

const radiantIdealsSchema = z.object({
  first: booleanSchema(false),
  second: booleanSchema(false),
  third: booleanSchema(false),
  fourth: booleanSchema(false),
  fifth: booleanSchema(false)
});

const radiantSchema = z.object({
  enabled: booleanSchema(false),
  radiantOrderId: nullableTextSchema,
  sprenName: nullableTextSchema,
  sprenBondRange: nullableTextSchema,
  ideals: radiantIdealsSchema.default({}),
  surges: z.array(z.string().min(1)).default([]),
  stormlightActions: z.array(z.string().min(1)).default([])
});

const revisionEntrySchema = z.record(z.string(), z.unknown());

export const CharacterSchema = z
  .object({
    id: z.string().min(1),
    meta: metaSchema.default({}),
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
  .strip();

export type Character = z.infer<typeof CharacterSchema>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function flattenStringArrays(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    return readStringArray(value) ?? [];
  }

  if (!isRecord(value)) {
    return undefined;
  }

  return Object.values(value).flatMap((entry) => readStringArray(entry) ?? []);
}

function normalizeCustomSkillSlot(value: unknown): Record<string, unknown> | null | undefined {
  if (value == null) {
    return null;
  }

  if (isRecord(value)) {
    return value;
  }

  return null;
}

function normalizeSkills(value: unknown): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    ...value,
    heavyWeaponry: value.heavyWeaponry ?? value.heavy_weaponry,
    lightWeaponry: value.lightWeaponry ?? value.light_weaponry
  };
}

function normalizeInventory(value: unknown): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const currency = isRecord(value.currency)
    ? {
        ...value.currency,
        marks: value.currency.marks ?? value.currency.amount
      }
    : value.currency;

  return {
    ...value,
    currency
  };
}

function normalizeRadiant(value: unknown): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    ...value,
    radiantOrderId: value.radiantOrderId ?? value.orderId
  };
}

function normalizeIdentity(value: unknown): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const pathIds = readStringArray(value.pathIds);
  const normalizedPathIds = pathIds ?? [];

  return {
    ...value,
    ancestryId: value.ancestryId ?? null,
    playerName: value.playerName ?? "",
    pathIds: normalizedPathIds,
    startingPathId: value.startingPathId ?? null
  };
}

function normalizeDerived(value: unknown): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  return {
    movement: value.movement,
    recoveryDie: value.recoveryDie,
    liftingCapacity: value.liftingCapacity,
    sensesRange: value.sensesRange
  };
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
    id,
    meta: payload.meta,
    identity: normalizeIdentity(payload.identity),
    skills: normalizeSkills(payload.skills),
    customSkills: isRecord(payload.customSkills)
      ? {
          physical: normalizeCustomSkillSlot(payload.customSkills.physical),
          cognitive: normalizeCustomSkillSlot(payload.customSkills.cognitive),
          spiritual: normalizeCustomSkillSlot(payload.customSkills.spiritual)
        }
      : payload.customSkills,
    expertises: flattenStringArrays(payload.expertises),
    talents: flattenStringArrays(payload.talents),
    derived: normalizeDerived(payload.derived),
    inventory: normalizeInventory(payload.inventory),
    radiant: normalizeRadiant(payload.radiant)
  });
}

export function createEmptyCharacter(): Character {
  return normalizeCharacterInput({});
}
