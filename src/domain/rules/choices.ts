import type {
  Ancestry,
  ContentRegistry,
  Expertise,
  HeroicPath,
  StartingKit,
  Talent
} from "../../content/schemas";
import type { Issue } from "../models/issues";

type ChoiceFilterOptions = {
  includePartial?: boolean;
};

type AvailableTalentOptions = ChoiceFilterOptions & {
  heroicPathId?: string | null;
};

type AvailableAncestryTalentOptions = ChoiceFilterOptions & {
  ancestryId?: string | null;
  heroicPathId?: string | null;
};

export type AncestryTalentChoiceOption = {
  id: string;
  name: string;
  talentIds?: string[];
};

export type AncestryTalentChoiceGroup = {
  id: string;
  type: "heroic_path_talent" | "talent_package";
  count: number;
  options: AncestryTalentChoiceOption[];
  issues: Issue[];
};

export type AvailableAncestryTalentsResult = {
  ancestry: Ancestry | null;
  grantedTalents: Talent[];
  choiceGroups: AncestryTalentChoiceGroup[];
  issues: Issue[];
};

function isSelectable(
  item: { verification_status: "verified" | "partial" | "unavailable" },
  options: ChoiceFilterOptions
): boolean {
  if (options.includePartial === true) {
    return item.verification_status !== "unavailable";
  }

  return item.verification_status === "verified";
}

function gmConfirmationIssue(path: Array<string | number>, message: string): Issue {
  return {
    code: "GM_CONFIRMATION_REQUIRED",
    message,
    path,
    context: {}
  };
}

function makePackageId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function uniqueTalents(talents: Talent[]): Talent[] {
  const seen = new Set<string>();

  return talents.filter((talent) => {
    if (seen.has(talent.id)) {
      return false;
    }

    seen.add(talent.id);
    return true;
  });
}

function findAncestry(
  registry: ContentRegistry,
  ancestryId: string | null | undefined,
  options: ChoiceFilterOptions
): Ancestry | null {
  if (!ancestryId) {
    return null;
  }

  return registry.ancestries.find((item) => item.id === ancestryId && isSelectable(item, options)) ?? null;
}

function findHeroicPath(
  registry: ContentRegistry,
  heroicPathId: string | null | undefined,
  options: ChoiceFilterOptions
): HeroicPath | null {
  if (!heroicPathId) {
    return null;
  }

  return registry.heroicPaths.find((item) => item.id === heroicPathId && isSelectable(item, options)) ?? null;
}

function findSelectableTalentsByIds(
  registry: ContentRegistry,
  talentIds: string[],
  options: ChoiceFilterOptions
): Talent[] {
  return uniqueTalents(
    registry.talents.filter((item) => talentIds.includes(item.id) && isSelectable(item, options))
  );
}

export function getAvailableAncestries(registry: ContentRegistry, options: ChoiceFilterOptions = {}): Ancestry[] {
  return registry.ancestries.filter((item) => isSelectable(item, options));
}

export function getAvailableHeroicPaths(
  registry: ContentRegistry,
  options: ChoiceFilterOptions = {}
): HeroicPath[] {
  return registry.heroicPaths.filter((item) => isSelectable(item, options));
}

export function getAvailableExpertises(
  registry: ContentRegistry,
  options: ChoiceFilterOptions = {}
): Expertise[] {
  return registry.expertises.filter((item) => isSelectable(item, options));
}

export function getAvailableTalents(
  registry: ContentRegistry,
  options: AvailableTalentOptions = {}
): Talent[] {
  const heroicPath = findHeroicPath(registry, options.heroicPathId, options);

  if (options.heroicPathId && heroicPath === null) {
    return [];
  }

  return registry.talents.filter((item) => {
    if (!isSelectable(item, options)) {
      return false;
    }

    if (heroicPath) {
      return item.path_id === heroicPath.id;
    }

    return true;
  });
}

export function getAvailableAncestryTalents(
  registry: ContentRegistry,
  options: AvailableAncestryTalentOptions = {}
): AvailableAncestryTalentsResult {
  const ancestry = findAncestry(registry, options.ancestryId, options);

  if (ancestry === null) {
    const issues = options.ancestryId
      ? [
          {
            code: "VALIDATION_FAILED" as const,
            message: "Only verified ancestries are selectable during character creation.",
            path: ["identity", "ancestryId"],
            context: { ancestryId: options.ancestryId }
          }
        ]
      : [];

    return {
      ancestry: null,
      grantedTalents: [],
      choiceGroups: [],
      issues
    };
  }

  const grantedTalents = findSelectableTalentsByIds(
    registry,
    ancestry.benefits?.granted_talent_ids ?? [],
    options
  );
  const choiceGroups: AncestryTalentChoiceGroup[] = [];
  const issues: Issue[] = [];

  if (ancestry.id === "human" && ancestry.benefits?.bonus_talent) {
    const currentPath = findHeroicPath(registry, options.heroicPathId, options);
    const currentPathId = currentPath?.id ?? null;
    const bonusOptions = uniqueTalents(
      registry.heroicPaths
        .filter((path) => isSelectable(path, options) && path.id !== currentPathId)
        .map((path) => registry.talents.find((talent) => talent.id === path.key_talent_id))
        .filter((talent): talent is Talent => talent !== undefined && isSelectable(talent, options))
    ).map((talent) => ({
      id: talent.id,
      name: talent.name
    }));

    const groupIssues = [
      gmConfirmationIssue(
        ["ancestry", ancestry.id, "bonus_talent"],
        "GM confirmation required because current data cannot prove all legal heroic-path talent prerequisites."
      )
    ];

    choiceGroups.push({
      id: "human_bonus_talent",
      type: "heroic_path_talent",
      count: 1,
      options: bonusOptions,
      issues: groupIssues
    });
    issues.push(...groupIssues);
  }

  if (ancestry.id === "singer" && ancestry.benefits?.starting_form_packages) {
    const selectablePackages = ancestry.benefits.starting_form_packages.filter((item) =>
      item.talent_ids.every((talentId) =>
        registry.talents.some((talent) => talent.id === talentId && isSelectable(talent, options))
      )
    );

    choiceGroups.push({
      id: "singer_starting_form_package",
      type: "talent_package",
      count: 1,
      options: selectablePackages.map((item) => ({
        id: makePackageId(item.name),
        name: item.name,
        talentIds: item.talent_ids
      })),
      issues: []
    });
  }

  return {
    ancestry,
    grantedTalents,
    choiceGroups,
    issues
  };
}

export function getAvailableStartingKits(
  registry: ContentRegistry,
  options: ChoiceFilterOptions = {}
): StartingKit[] {
  return registry.startingKits.filter((item) => isSelectable(item, options));
}
