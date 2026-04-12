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
  expertiseListSchema,
  heroicPathListSchema,
  skillListSchema,
  startingKitListSchema,
  talentListSchema,
  type ContentRegistry
} from "./schemas";

function validationErrorMessage(label: string, error: { issues: Array<{ path: Array<string | number>; message: string }> }): string {
  const details = error.issues
    .map((issue) => `${issue.path.length > 0 ? issue.path.join(".") : "<root>"}: ${issue.message}`)
    .join("; ");

  return `Invalid ${label} content: ${details}`;
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

  return contentRegistrySchema.parse({
    ancestries: parsed.ancestries.data,
    heroicPaths: parsed.heroicPaths.data,
    skills: parsed.skills.data,
    expertises: parsed.expertises.data,
    talents: parsed.talents.data,
    startingKits: parsed.startingKits.data,
    advancementRules: parsed.advancementRules.data
  });
}
