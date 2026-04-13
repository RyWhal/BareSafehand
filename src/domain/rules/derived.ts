import type { Character } from "../models/character";
import type { Issue } from "../models/issues";

type DerivedAttributes = Pick<
  Character["attributes"],
  "strength" | "speed" | "intellect" | "willpower" | "awareness" | "presence"
>;

type SupportedDerivedInput = {
  attributes: Partial<DerivedAttributes>;
  radiant?: {
    enabled?: boolean;
  };
};

type SupportedDerivedValues = {
  physicalDefense: number;
  cognitiveDefense: number;
  spiritualDefense: number;
  focusMax: number;
  investitureMax: number | null;
  movement: null;
  recoveryDie: null;
  liftingCapacity: null;
  sensesRange: null;
  deflect: null;
  maxHealth: null;
};

type SupportedDerivedResult = {
  values: SupportedDerivedValues;
  issues: Issue[];
};

function readAttribute(attributes: Partial<DerivedAttributes>, key: keyof DerivedAttributes): number {
  return attributes[key] ?? 0;
}

function unsupportedIssue(path: Array<string | number>, label: string): Issue {
  return {
    code: "UNSUPPORTED_RULE",
    message: `${label} is not yet supported by the approved derived-stat rules`,
    path,
    context: {}
  };
}

export function calcPhysicalDefense(input: { attributes: Partial<DerivedAttributes> }): number {
  return 10 + readAttribute(input.attributes, "strength") + readAttribute(input.attributes, "speed");
}

export function calcCognitiveDefense(input: { attributes: Partial<DerivedAttributes> }): number {
  return 10 + readAttribute(input.attributes, "intellect") + readAttribute(input.attributes, "willpower");
}

export function calcSpiritualDefense(input: { attributes: Partial<DerivedAttributes> }): number {
  return 10 + readAttribute(input.attributes, "awareness") + readAttribute(input.attributes, "presence");
}

export function calcFocusMax(input: { attributes: Partial<DerivedAttributes> }): number {
  return 2 + readAttribute(input.attributes, "willpower");
}

export function calcInvestitureMax(input: { radiant?: { enabled?: boolean } }): number | null {
  if (input.radiant?.enabled) {
    return null;
  }

  return 0;
}

export function calcSupportedDerived(input: SupportedDerivedInput): SupportedDerivedResult {
  return {
    values: {
      physicalDefense: calcPhysicalDefense(input),
      cognitiveDefense: calcCognitiveDefense(input),
      spiritualDefense: calcSpiritualDefense(input),
      focusMax: calcFocusMax(input),
      investitureMax: calcInvestitureMax(input),
      movement: null,
      recoveryDie: null,
      liftingCapacity: null,
      sensesRange: null,
      deflect: null,
      maxHealth: null
    },
    issues: [
      ...(input.radiant?.enabled ? [unsupportedIssue(["resources", "investiture", "max"], "Investiture max")] : []),
      unsupportedIssue(["derived", "movement"], "Movement"),
      unsupportedIssue(["derived", "recoveryDie"], "Recovery die"),
      unsupportedIssue(["derived", "liftingCapacity"], "Lifting capacity"),
      unsupportedIssue(["derived", "sensesRange"], "Senses range"),
      unsupportedIssue(["defenses", "deflect"], "Deflect"),
      unsupportedIssue(["resources", "health", "max"], "Max health")
    ]
  };
}
