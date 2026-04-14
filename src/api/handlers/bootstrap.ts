import { loadContent } from "../../content/loadContent";
import { getAvailableAncestries, getAvailableExpertises, getAvailableHeroicPaths, getAvailableStartingKits, getAvailableTalents } from "../../domain/rules/choices";
import { noIndexJsonResponse } from "../http";

function toChoiceMetadata(item: {
  id: string;
  name: string;
  verification_status: string;
  notes: string | null;
}) {
  return {
    id: item.id,
    name: item.name,
    verificationStatus: item.verification_status,
    notes: item.notes
  };
}

export function bootstrapHandler(): Response {
  const registry = loadContent();

  return noIndexJsonResponse({
    ancestries: getAvailableAncestries(registry).map(toChoiceMetadata),
    heroicPaths: getAvailableHeroicPaths(registry).map((path) => ({
      ...toChoiceMetadata(path),
      startingSkillId: path.starting_skill_id,
      keyTalentId: path.key_talent_id
    })),
    skills: registry.skills
      .filter((skill) => skill.verification_status === "verified")
      .map(toChoiceMetadata),
    expertises: getAvailableExpertises(registry, { includePartial: true }).map(toChoiceMetadata),
    startingKits: getAvailableStartingKits(registry).map(toChoiceMetadata),
    talents: getAvailableTalents(registry).map((talent) => ({
      ...toChoiceMetadata(talent),
      pathId: talent.path_id ?? null
    })),
    rulesVersion: {
      id: registry.advancementRules.id,
      name: registry.advancementRules.name,
      verificationStatus: registry.advancementRules.verification_status,
      notes: registry.advancementRules.notes
    }
  });
}
