import type { ContentRegistry, Expertise, HeroicPath, Ancestry } from "./schemas";

export function getAvailableAncestries(registry: ContentRegistry): Ancestry[] {
  return registry.ancestries.filter((item) => item.verification_status === "verified");
}

export function getAvailableHeroicPaths(registry: ContentRegistry): HeroicPath[] {
  return registry.heroicPaths.filter((item) => item.verification_status === "verified");
}

export function getSelectableExpertises(
  registry: ContentRegistry,
  options: { includePartial?: boolean } = {}
): Expertise[] {
  if (options.includePartial === true) {
    return registry.expertises.filter((item) => item.verification_status !== "unavailable");
  }

  return registry.expertises.filter((item) => item.verification_status === "verified");
}
