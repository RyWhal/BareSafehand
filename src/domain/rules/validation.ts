import type { ContentRegistry } from "../../content/schemas";
import type { Issue } from "../models/issues";
import {
  getAvailableAncestries,
  getAvailableAncestryTalents,
  getAvailableHeroicPaths,
  getAvailableStartingKits,
  getAvailableTalents
} from "./choices";

const ATTRIBUTE_KEYS = [
  "strength",
  "speed",
  "intellect",
  "willpower",
  "awareness",
  "presence"
] as const;

type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];

export type CreationAttributes = Record<AttributeKey, number>;

export type ValidationResult = {
  ok: boolean;
  errors: Issue[];
};

export type CreationSkillRanksInput = {
  startingSkillId?: string | null;
  skillRanks: Record<string, number>;
};

export type CreationExpertiseCountInput = {
  intellect: number;
  additionalExpertiseIds: string[];
};

export type TalentSelectionInput = {
  registry: ContentRegistry;
  heroicPathId?: string | null;
  ancestryId?: string | null;
  selectedTalentIds: string[];
  includePartial?: boolean;
};

export type StartingKitSelectionInput = {
  registry: ContentRegistry;
  startingKitId?: string | null;
  includePartial?: boolean;
};

function validationIssue(
  path: Array<string | number>,
  message: string,
  context: Record<string, unknown> = {}
): Issue {
  return {
    code: "VALIDATION_FAILED",
    message,
    path,
    context
  };
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

function toResult(errors: Issue[]): ValidationResult {
  return {
    ok: errors.length === 0,
    errors
  };
}

export function validateCreationAttributes(
  attributes: Partial<Record<AttributeKey, number>>
): ValidationResult {
  const errors: Issue[] = [];
  let total = 0;

  for (const key of ATTRIBUTE_KEYS) {
    const value = attributes[key];

    if (value === undefined) {
      errors.push(
        validationIssue(
          ["attributes", key],
          "Creation attributes are required and must be integers between 0 and 3.",
          { min: 0, max: 3, actual: value }
        )
      );
      continue;
    }

    if (!Number.isInteger(value) || value < 0 || value > 3) {
      errors.push(
        validationIssue(
          ["attributes", key],
          "Creation attributes must be integers between 0 and 3.",
          { min: 0, max: 3, actual: value }
        )
      );
      continue;
    }

    total += value;
  }

  if (total !== 12) {
    errors.push(
      validationIssue(["attributes"], "Creation attributes must total exactly 12 points.", {
        expected: 12,
        actual: total
      })
    );
  }

  return toResult(errors);
}

export function validateCreationSkillRanks(input: CreationSkillRanksInput): ValidationResult {
  const errors: Issue[] = [];
  const entries = Object.entries(input.skillRanks);
  const totalRanks = entries.reduce((sum, [, value]) => sum + value, 0);

  for (const [skillId, value] of entries) {
    if (!Number.isInteger(value) || value < 0) {
      errors.push(
        validationIssue(["skills", skillId], "Creation skill ranks must be non-negative integers.", {
          actual: value
        })
      );
      continue;
    }

    if (value > 2) {
      errors.push(
        validationIssue(["skills", skillId], "Creation skill ranks cannot exceed 2.", {
          max: 2,
          actual: value
        })
      );
    }
  }

  const startingSkillId = input.startingSkillId ?? null;
  const startingSkillRanks = startingSkillId ? input.skillRanks[startingSkillId] ?? 0 : 0;

  if (!startingSkillId) {
    errors.push(validationIssue(["skills"], "A verified starting heroic path skill is required."));
  } else if (startingSkillRanks < 1) {
    errors.push(
      validationIssue(
        ["skills", startingSkillId],
        "The starting heroic path skill must include its free rank.",
        { requiredMinimum: 1, actual: startingSkillRanks }
      )
    );
  }

  if (totalRanks !== 5) {
    errors.push(
      validationIssue(["skills"], "Creation skill ranks must include 1 free path rank plus 4 discretionary ranks.", {
        expectedTotalRanks: 5,
        actualTotalRanks: totalRanks
      })
    );
  }

  return toResult(errors);
}

export function validateCreationExpertiseCount(
  input: CreationExpertiseCountInput
): ValidationResult {
  const errors: Issue[] = [];

  if (!Number.isInteger(input.intellect) || input.intellect < 0) {
    errors.push(
      validationIssue(["attributes", "intellect"], "Intellect must be a non-negative integer.", {
        actual: input.intellect
      })
    );
  }

  if (input.additionalExpertiseIds.length !== input.intellect) {
    errors.push(
      validationIssue(
        ["expertises", "additional"],
        "Additional expertise selections must equal Intellect.",
        {
          expected: input.intellect,
          actual: input.additionalExpertiseIds.length
        }
      )
    );
  }

  if (uniqueIds(input.additionalExpertiseIds).length !== input.additionalExpertiseIds.length) {
    errors.push(
      validationIssue(["expertises", "additional"], "Additional expertise selections cannot contain duplicates.")
    );
  }

  return toResult(errors);
}

export function validateTalentSelection(input: TalentSelectionInput): ValidationResult {
  const errors: Issue[] = [];
  const selectedIds = uniqueIds(input.selectedTalentIds);
  const availableAncestries = getAvailableAncestries(input.registry, {
    includePartial: input.includePartial
  });
  const availableHeroicPaths = getAvailableHeroicPaths(input.registry, {
    includePartial: input.includePartial
  });
  const ancestry = availableAncestries.find((item) => item.id === input.ancestryId);
  const heroicPath = availableHeroicPaths.find((item) => item.id === input.heroicPathId);

  if (selectedIds.length !== input.selectedTalentIds.length) {
    errors.push(validationIssue(["talents"], "Talent selections cannot contain duplicates."));
  }

  if (input.ancestryId && !ancestry) {
    errors.push(
      validationIssue(
        ["identity", "ancestryId"],
        "Only verified ancestries are selectable during character creation.",
        { ancestryId: input.ancestryId }
      )
    );
  }

  if (input.heroicPathId && !heroicPath) {
    errors.push(
      validationIssue(
        ["identity", "startingPathId"],
        "Only verified heroic paths are selectable during character creation.",
        { heroicPathId: input.heroicPathId }
      )
    );
  }

  const requiredTalentIds = new Set<string>();
  const selectableTalentIds = new Set<string>();

  if (heroicPath) {
    requiredTalentIds.add(heroicPath.key_talent_id);

    for (const talent of getAvailableTalents(input.registry, {
      heroicPathId: heroicPath.id,
      includePartial: input.includePartial
    })) {
      selectableTalentIds.add(talent.id);
    }
  }

  const ancestryTalents = getAvailableAncestryTalents(input.registry, {
    ancestryId: ancestry?.id ?? null,
    heroicPathId: heroicPath?.id ?? null,
    includePartial: input.includePartial
  });

  for (const talent of ancestryTalents.grantedTalents) {
    requiredTalentIds.add(talent.id);
    selectableTalentIds.add(talent.id);
  }

  for (const group of ancestryTalents.choiceGroups) {
    if (group.type === "heroic_path_talent") {
      for (const option of group.options) {
        selectableTalentIds.add(option.id);
      }

      const chosenFromGroup = selectedIds.filter((id) => group.options.some((option) => option.id === id));

      if (chosenFromGroup.length !== group.count) {
        errors.push(
          validationIssue(
            ["talents", group.id],
            `Select exactly ${group.count} talent choice${group.count === 1 ? "" : "s"} from this ancestry option.`,
            { actual: chosenFromGroup.length, expected: group.count }
          )
        );
      }
    }

    if (group.type === "talent_package") {
      const packageSelections = group.options.filter((option) => {
        const talentIds = option.talentIds ?? [];
        return talentIds.length > 0 && talentIds.every((id) => selectedIds.includes(id));
      });

      for (const option of group.options) {
        for (const talentId of option.talentIds ?? []) {
          selectableTalentIds.add(talentId);
        }
      }

      const selectedFromGroup = selectedIds.filter((id) =>
        group.options.some((option) => (option.talentIds ?? []).includes(id))
      );
      const expectedIds = new Set(packageSelections.flatMap((option) => option.talentIds ?? []));

      if (
        packageSelections.length !== group.count ||
        selectedFromGroup.some((id) => !expectedIds.has(id))
      ) {
        errors.push(
          validationIssue(
            ["talents", group.id],
            `Select exactly ${group.count} complete talent package${group.count === 1 ? "" : "s"} from this ancestry option.`,
            {
              actualPackages: packageSelections.length,
              expectedPackages: group.count
            }
          )
        );
      }
    }
  }

  for (const requiredId of requiredTalentIds) {
    if (!selectedIds.includes(requiredId)) {
      errors.push(
        validationIssue(["talents", requiredId], "This required creation talent is missing.", {
          talentId: requiredId
        })
      );
    }
  }

  for (const selectedId of selectedIds) {
    if (!selectableTalentIds.has(selectedId) && !requiredTalentIds.has(selectedId)) {
      errors.push(
        validationIssue(["talents", selectedId], "This talent is not selectable for the current creation choices.", {
          talentId: selectedId
        })
      );
    }
  }

  return toResult(errors);
}

export function validateStartingKitSelection(
  input: StartingKitSelectionInput
): ValidationResult {
  const availableKits = getAvailableStartingKits(input.registry, {
    includePartial: input.includePartial
  });
  const selectedKit = availableKits.find((item) => item.id === input.startingKitId);

  if (selectedKit) {
    return toResult([]);
  }

  return toResult([
    validationIssue(
      ["inventory", "startingKitId"],
      "Select a verified starting kit for character creation.",
      { startingKitId: input.startingKitId ?? null }
    )
  ]);
}
