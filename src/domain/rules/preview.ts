import { loadContent } from "../../content/loadContent";
import { CharacterSchema, createEmptyCharacter, type Character } from "../models/character";
import type { Issue } from "../models/issues";
import {
  getAvailableAncestryTalents,
  getAvailableAncestries,
  getAvailableExpertises,
  getAvailableHeroicPaths,
  getAvailableStartingKits,
  getAvailableTalents
} from "./choices";
import {
  calcSupportedDerived,
  type SupportedDerivedValues
} from "./derived";
import {
  validateCreationAttributes,
  validateCreationExpertiseCount,
  validateCreationSkillRanks,
  validateStartingKitSelection,
  validateTalentSelection
} from "./validation";

type RecordValue = Record<string, unknown>;
type RawCreationAttributes = Partial<
  Record<"strength" | "speed" | "intellect" | "willpower" | "awareness" | "presence", unknown>
>;

export type PreviewSelectableSkill = {
  id: string;
  name: string;
  characterKey: string;
  verificationStatus: string;
  notes: string | null;
};

export type PreviewSelectableHeroicPath = {
  id: string;
  name: string;
  startingSkillId: string;
  startingSkillKey: string;
  keyTalentId: string;
  verificationStatus: string;
  notes: string | null;
};

export type PreviewSelectableSimpleChoice = {
  id: string;
  name: string;
  verificationStatus: string;
  notes: string | null;
};

export type PreviewSelectableMetadata = {
  ancestries: PreviewSelectableSimpleChoice[];
  heroicPaths: PreviewSelectableHeroicPath[];
  skills: PreviewSelectableSkill[];
  expertises: PreviewSelectableSimpleChoice[];
  startingKits: PreviewSelectableSimpleChoice[];
  talents: Array<
    PreviewSelectableSimpleChoice & {
      pathId?: string;
    }
  >;
  ancestryTalents: ReturnType<typeof getAvailableAncestryTalents>;
};

export type CreationPreview = {
  character: Character;
  errors: Issue[];
  warnings: Issue[];
  derived: SupportedDerivedValues;
  selectableMetadata: PreviewSelectableMetadata;
};

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function toCharacterSkillKey(skillId: string): string {
  return skillId.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function toContentSkillId(skillKey: string): string {
  return skillKey.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readDraftAttributes(input: unknown): RawCreationAttributes {
  if (!isRecord(input) || !isRecord(input.attributes)) {
    return {};
  }

  const attributes: RawCreationAttributes = {};

  for (const key of ["strength", "speed", "intellect", "willpower", "awareness", "presence"] as const) {
    if (key in input.attributes) {
      attributes[key] = input.attributes[key];
    }
  }

  return attributes;
}

function readDraftTalentIds(input: unknown, fallback: string[]): string[] {
  if (!isRecord(input) || !Array.isArray(input.talents)) {
    return fallback;
  }

  return input.talents.filter((entry): entry is string => typeof entry === "string");
}

function readDraftExpertiseIds(input: unknown, fallback: string[]): string[] {
  if (!isRecord(input) || !Array.isArray(input.expertises)) {
    return fallback;
  }

  return input.expertises.filter((entry): entry is string => typeof entry === "string");
}

function mergeValidationTalentIds(rawTalentIds: string[], appliedTalentIds: string[]): string[] {
  return [...rawTalentIds, ...appliedTalentIds.filter((talentId) => !rawTalentIds.includes(talentId))];
}

function normalizeCharacterDraft(input: unknown, registry: ReturnType<typeof loadContent>): Character {
  const character = createEmptyCharacter();

  if (!isRecord(input)) {
    return CharacterSchema.parse(character);
  }

  if (isRecord(input.identity)) {
    const identity = input.identity;

    if (typeof identity.characterName === "string") {
      character.identity.characterName = identity.characterName;
    }

    if (typeof identity.playerName === "string") {
      character.identity.playerName = identity.playerName;
    }

    if (Number.isInteger(identity.level)) {
      character.identity.level = identity.level as number;
    }

    if (Number.isInteger(identity.tier)) {
      character.identity.tier = identity.tier as number;
    }

    if (typeof identity.ancestryId === "string" || identity.ancestryId === null) {
      character.identity.ancestryId = identity.ancestryId;
    }

    if (isStringArray(identity.cultureExpertiseIds)) {
      character.identity.cultureExpertiseIds = uniqueStrings(identity.cultureExpertiseIds);
    }

    if (isStringArray(identity.pathIds)) {
      character.identity.pathIds = uniqueStrings(identity.pathIds);
    }

    if (typeof identity.startingPathId === "string" || identity.startingPathId === null) {
      character.identity.startingPathId = identity.startingPathId;
    }
  }

  if (isRecord(input.attributes)) {
    for (const key of ["strength", "speed", "intellect", "willpower", "awareness", "presence"] as const) {
      const value = readNumber(input.attributes[key]);

      if (value !== null) {
        character.attributes[key] = value;
      }
    }
  }

  if (isRecord(input.skills)) {
    for (const skill of registry.skills) {
      const skillKey = toCharacterSkillKey(skill.id);
      const draftSlot = input.skills[skillKey];

      if (isRecord(draftSlot)) {
        const ranks = readNumber(draftSlot.ranks);
        const modifier = readNumber(draftSlot.modifier);

        if (ranks !== null) {
          character.skills[skillKey as keyof Character["skills"]].ranks = ranks;
        }

        if (modifier !== null) {
          character.skills[skillKey as keyof Character["skills"]].modifier = modifier;
        }
      }
    }
  }

  if (isRecord(input.customSkills)) {
    for (const key of ["physical", "cognitive", "spiritual"] as const) {
      const slot = input.customSkills[key];

      if (slot === null) {
        character.customSkills[key] = null;
        continue;
      }

      if (isRecord(slot)) {
        const ranks = readNumber(slot.ranks);
        const modifier = readNumber(slot.modifier);

        character.customSkills[key] = {
          name: typeof slot.name === "string" ? slot.name : "",
          ranks: ranks ?? 0,
          modifier: modifier ?? 0,
          notes: typeof slot.notes === "string" || slot.notes === null ? slot.notes : null
        };
      }
    }
  }

  if (isStringArray(input.expertises)) {
    character.expertises = uniqueStrings(input.expertises);
  }

  if (isStringArray(input.talents)) {
    character.talents = uniqueStrings(input.talents);
  }

  if (isRecord(input.resources)) {
    for (const key of ["health", "focus", "investiture"] as const) {
      const slot = input.resources[key];

      if (isRecord(slot)) {
        const current = readNumber(slot.current);
        const max = readNumber(slot.max);

        if (current !== null) {
          character.resources[key].current = current;
        }

        if (max !== null) {
          character.resources[key].max = max;
        }
      }
    }
  }

  if (isRecord(input.defenses)) {
    for (const key of ["physical", "cognitive", "spiritual", "deflect"] as const) {
      const value = readNumber(input.defenses[key]);

      if (value !== null) {
        character.defenses[key] = value;
      }
    }
  }

  if (isRecord(input.inventory)) {
    if (typeof input.inventory.startingKitId === "string" || input.inventory.startingKitId === null) {
      character.inventory.startingKitId = input.inventory.startingKitId;
    }

    if (isRecord(input.inventory.currency)) {
      const marks = readNumber(input.inventory.currency.marks);

      if (marks !== null) {
        character.inventory.currency.marks = marks;
      }

      if (typeof input.inventory.currency.notes === "string") {
        character.inventory.currency.notes = input.inventory.currency.notes;
      }
    }
  }

  if (isRecord(input.story)) {
    for (const key of ["purpose", "obstacle", "notes", "appearance", "personality"] as const) {
      if (typeof input.story[key] === "string") {
        character.story[key] = input.story[key];
      }
    }

    if (isStringArray(input.story.goals)) {
      character.story.goals = uniqueStrings(input.story.goals);
    }

    if (isStringArray(input.story.connections)) {
      character.story.connections = uniqueStrings(input.story.connections);
    }
  }

  if (isRecord(input.radiant)) {
    if (typeof input.radiant.enabled === "boolean") {
      character.radiant.enabled = input.radiant.enabled;
    }

    if (typeof input.radiant.radiantOrderId === "string" || input.radiant.radiantOrderId === null) {
      character.radiant.radiantOrderId = input.radiant.radiantOrderId;
    }

    if (typeof input.radiant.sprenName === "string" || input.radiant.sprenName === null) {
      character.radiant.sprenName = input.radiant.sprenName;
    }

    if (typeof input.radiant.sprenBondRange === "string" || input.radiant.sprenBondRange === null) {
      character.radiant.sprenBondRange = input.radiant.sprenBondRange;
    }

    if (isRecord(input.radiant.ideals)) {
      for (const key of ["first", "second", "third", "fourth", "fifth"] as const) {
        if (typeof input.radiant.ideals[key] === "boolean") {
          character.radiant.ideals[key] = input.radiant.ideals[key];
        }
      }
    }

    if (isStringArray(input.radiant.surges)) {
      character.radiant.surges = uniqueStrings(input.radiant.surges);
    }

    if (isStringArray(input.radiant.stormlightActions)) {
      character.radiant.stormlightActions = uniqueStrings(input.radiant.stormlightActions);
    }
  }

  if (isStringArray(input.conditions)) {
    character.conditions = uniqueStrings(input.conditions);
  }

  if (isStringArray(input.injuries)) {
    character.injuries = uniqueStrings(input.injuries);
  }

  if (isStringArray(input.rewards)) {
    character.rewards = uniqueStrings(input.rewards);
  }

  if (Array.isArray(input.revisionHistory)) {
    character.revisionHistory = input.revisionHistory.filter((entry) => isRecord(entry));
  }

  return CharacterSchema.parse(character);
}

function buildSelectableSkillMetadata(registry: ReturnType<typeof loadContent>): PreviewSelectableSkill[] {
  return registry.skills.map((skill) => ({
    id: skill.id,
    name: skill.name,
    characterKey: toCharacterSkillKey(skill.id),
    verificationStatus: skill.verification_status,
    notes: skill.notes
  }));
}

function buildSelectableHeroicPathMetadata(
  registry: ReturnType<typeof loadContent>
): PreviewSelectableHeroicPath[] {
  return getAvailableHeroicPaths(registry).map((path) => ({
    id: path.id,
    name: path.name,
    startingSkillId: path.starting_skill_id,
    startingSkillKey: toCharacterSkillKey(path.starting_skill_id),
    keyTalentId: path.key_talent_id,
    verificationStatus: path.verification_status,
    notes: path.notes
  }));
}

function buildSelectableSimpleChoices(
  items: Array<{ id: string; name: string; verification_status: string; notes: string | null }>
): PreviewSelectableSimpleChoice[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    verificationStatus: item.verification_status,
    notes: item.notes
  }));
}

function buildSelectableTalents(
  registry: ReturnType<typeof loadContent>,
  heroicPathId: string | null
): PreviewSelectableMetadata["talents"] {
  return getAvailableTalents(registry, { heroicPathId }).map((talent) => ({
    id: talent.id,
    name: talent.name,
    verificationStatus: talent.verification_status,
    notes: talent.notes,
    pathId: talent.path_id
  }));
}

function buildSelectableMetadata(
  registry: ReturnType<typeof loadContent>,
  heroicPathId: string | null,
  ancestryId: string | null
): PreviewSelectableMetadata {
  return {
    ancestries: buildSelectableSimpleChoices(getAvailableAncestries(registry)),
    heroicPaths: buildSelectableHeroicPathMetadata(registry),
    skills: buildSelectableSkillMetadata(registry),
    expertises: buildSelectableSimpleChoices(getAvailableExpertises(registry)),
    startingKits: buildSelectableSimpleChoices(getAvailableStartingKits(registry)),
    talents: buildSelectableTalents(registry, heroicPathId),
    ancestryTalents: getAvailableAncestryTalents(registry, {
      ancestryId,
      heroicPathId
    })
  };
}

function buildContentSkillRanks(
  registry: ReturnType<typeof loadContent>,
  character: Character
): Record<string, number> {
  const ranks: Record<string, number> = {};

  for (const skill of registry.skills) {
    const characterKey = toCharacterSkillKey(skill.id) as keyof Character["skills"];
    ranks[skill.id] = character.skills[characterKey].ranks;
  }

  return ranks;
}

function applyFreePathRank(character: Character, registry: ReturnType<typeof loadContent>): string | null {
  const startingPathId = character.identity.startingPathId;
  const heroicPath = getAvailableHeroicPaths(registry).find((path) => path.id === startingPathId);

  if (!heroicPath) {
    return null;
  }

  const characterSkillKey = toCharacterSkillKey(heroicPath.starting_skill_id) as keyof Character["skills"];
  character.skills[characterSkillKey].ranks = Math.max(character.skills[characterSkillKey].ranks, 1);
  character.identity.pathIds = uniqueStrings([...(character.identity.pathIds ?? []), heroicPath.id]);

  return heroicPath.id;
}

function autoApplyTalents(
  character: Character,
  registry: ReturnType<typeof loadContent>,
  heroicPathId: string | null,
  ancestryId: string | null
): void {
  const selectedTalents = new Set(character.talents);

  if (heroicPathId) {
    const heroicPath = getAvailableHeroicPaths(registry).find((path) => path.id === heroicPathId);

    if (heroicPath) {
      selectedTalents.add(heroicPath.key_talent_id);
    }
  }

  const ancestryTalents = getAvailableAncestryTalents(registry, {
    ancestryId,
    heroicPathId
  });

  for (const talent of ancestryTalents.grantedTalents) {
    selectedTalents.add(talent.id);
  }

  character.talents = [...selectedTalents];
}

function collectValidationIssues(
  input: unknown,
  character: Character,
  registry: ReturnType<typeof loadContent>,
  requestedHeroicPathId: string | null,
  appliedHeroicPathId: string | null,
  ancestryId: string | null
): { errors: Issue[]; warnings: Issue[] } {
  const warnings: Issue[] = [];
  const errors: Issue[] = [];

  const verifiedAncestry = getAvailableAncestries(registry).find((item) => item.id === ancestryId) ?? null;

  if (ancestryId && !verifiedAncestry) {
    errors.push({
      code: "VALIDATION_FAILED",
      message: "Only verified ancestries are selectable during character creation.",
      path: ["identity", "ancestryId"],
      context: { ancestryId }
    });
  }

  const ancestryTalents = getAvailableAncestryTalents(registry, {
    ancestryId: verifiedAncestry?.id ?? null,
    heroicPathId: appliedHeroicPathId
  });

  const draftTalentIds = readDraftTalentIds(input, character.talents);
  const draftExpertiseIds = readDraftExpertiseIds(input, character.expertises);
  const validationTalentIds = mergeValidationTalentIds(draftTalentIds, character.talents);
  const draftAttributes = readDraftAttributes(input);

  errors.push(
    ...validateCreationAttributes(
      draftAttributes as Partial<Record<keyof typeof character.attributes, number>>
    ).errors
  );
  errors.push(
    ...validateCreationSkillRanks({
      startingSkillId: appliedHeroicPathId
        ? toContentSkillId(
            (getAvailableHeroicPaths(registry).find((path) => path.id === appliedHeroicPathId)?.starting_skill_id ??
              "") as string
          )
        : null,
      skillRanks: buildContentSkillRanks(registry, character)
    }).errors
  );

  errors.push(
    ...validateCreationExpertiseCount({
      intellect: character.attributes.intellect,
      additionalExpertiseIds: draftExpertiseIds
    }).errors
  );

  const selectableExpertiseIds = new Set(getAvailableExpertises(registry).map((item) => item.id));

  for (const expertiseId of character.expertises) {
    if (!selectableExpertiseIds.has(expertiseId)) {
      errors.push({
        code: "VALIDATION_FAILED",
        message: "This expertise is not selectable during character creation.",
        path: ["expertises", expertiseId],
        context: { expertiseId }
      });
    }
  }

  errors.push(
    ...validateStartingKitSelection({
      registry,
      startingKitId: character.inventory.startingKitId
    }).errors
  );

  errors.push(
    ...validateTalentSelection({
      registry,
      heroicPathId: requestedHeroicPathId,
      ancestryId: verifiedAncestry?.id ?? null,
      selectedTalentIds: validationTalentIds
    }).errors
  );

  warnings.push(...calcSupportedDerived({ attributes: character.attributes, radiant: character.radiant }).issues);
  warnings.push(...ancestryTalents.issues);

  return {
    errors,
    warnings
  };
}

export function buildCreationPreview(input: unknown): CreationPreview {
  const registry = loadContent();
  const character = normalizeCharacterDraft(input, registry);
  const requestedHeroicPathId = character.identity.startingPathId;
  const ancestryId = character.identity.ancestryId;

  const appliedHeroicPathId = applyFreePathRank(character, registry);
  autoApplyTalents(character, registry, appliedHeroicPathId, ancestryId);

  const selectionMetadata = buildSelectableMetadata(registry, appliedHeroicPathId, ancestryId);
  const { errors, warnings } = collectValidationIssues(
    input,
    character,
    registry,
    requestedHeroicPathId,
    appliedHeroicPathId,
    ancestryId
  );
  const derived = calcSupportedDerived({ attributes: character.attributes, radiant: character.radiant }).values;

  return {
    character,
    errors,
    warnings,
    derived,
    selectableMetadata: selectionMetadata
  };
}
