import ancestries from "../../content/ancestries.json";
import heroicPaths from "../../content/heroic_paths.json";
import skills from "../../content/skills.json";
import expertises from "../../content/expertises.json";
import talents from "../../content/talents.json";
import startingKits from "../../content/starting_kits.json";
import advancementRules from "../../content/advancement_rules.json";
import {
  ancestryListSchema,
  advancementRulesSchema,
  contentRegistrySchema,
  type ContentRegistry,
  expertiseListSchema,
  heroicPathListSchema,
  skillListSchema,
  startingKitListSchema,
  talentListSchema,
} from "./schemas";

function validationErrorMessage(label: string, error: { issues: Array<{ path: Array<string | number>; message: string }> }): string {
  const details = error.issues
    .map((issue) => `${issue.path.length > 0 ? issue.path.join(".") : "<root>"}: ${issue.message}`)
    .join("; ");

  return `Invalid ${label} content: ${details}`;
}

function collectMissingIds<T extends { id: string }>(items: T[]) {
  return new Set(items.map((item) => item.id));
}

export function validateContentReferences(registry: ContentRegistry): void {
  const skillIds = collectMissingIds(registry.skills);
  const talentIds = collectMissingIds(registry.talents);
  const errors: string[] = [];

  for (const path of registry.heroicPaths) {
    if (!skillIds.has(path.starting_skill_id)) {
      errors.push(`heroic path ${path.id} starting_skill_id references missing skill ${path.starting_skill_id}`);
    }

    if (!talentIds.has(path.key_talent_id)) {
      errors.push(`heroic path ${path.id} key_talent_id references missing talent ${path.key_talent_id}`);
    }
  }

  for (const ancestry of registry.ancestries) {
    const benefits = ancestry.benefits;

    if (benefits?.granted_talent_ids) {
      for (const talentId of benefits.granted_talent_ids) {
        if (!talentIds.has(talentId)) {
          errors.push(`ancestry ${ancestry.id} granted_talent_ids references missing talent ${talentId}`);
        }
      }
    }

    if (benefits?.starting_form_packages) {
      for (const packageItem of benefits.starting_form_packages) {
        for (const talentId of packageItem.talent_ids) {
          if (!talentIds.has(talentId)) {
            errors.push(`ancestry ${ancestry.id} starting_form_packages.${packageItem.name} references missing talent ${talentId}`);
          }
        }
      }
    }

    if (benefits?.change_form_targets) {
      for (const talentId of benefits.change_form_targets) {
        if (!talentIds.has(talentId)) {
          errors.push(`ancestry ${ancestry.id} change_form_targets references missing talent ${talentId}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid content references: ${errors.join("; ")}`);
  }
}

export function loadContent(): ContentRegistry {
  const parsed = {
    ancestries: ancestryListSchema.safeParse(ancestries),
    heroicPaths: heroicPathListSchema.safeParse(heroicPaths),
    skills: skillListSchema.safeParse(skills),
    expertises: expertiseListSchema.safeParse(expertises),
    talents: talentListSchema.safeParse(talents),
    startingKits: startingKitListSchema.safeParse(startingKits),
    advancementRules: advancementRulesSchema.safeParse(advancementRules)
  };

  for (const [label, result] of Object.entries(parsed)) {
    if (!result.success) {
      throw new Error(validationErrorMessage(label, result.error));
    }
  }

  const registry = contentRegistrySchema.parse({
    ancestries: parsed.ancestries.data,
    heroicPaths: parsed.heroicPaths.data,
    skills: parsed.skills.data,
    expertises: parsed.expertises.data,
    talents: parsed.talents.data,
    startingKits: parsed.startingKits.data,
    advancementRules: parsed.advancementRules.data
  });

  validateContentReferences(registry);

  return registry;
}
