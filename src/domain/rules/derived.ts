import type { Issue } from "../models/issues";

export type DerivedAttributes = {
  strength?: number;
  speed?: number;
  intellect?: number;
  willpower?: number;
  awareness?: number;
  presence?: number;
};

export type SupportedDerivedInput = {
  attributes: DerivedAttributes;
  radiant?: {
    enabled?: boolean;
  };
};

export type SupportedDerivedValues = {
  defenses: {
    physical: number;
    cognitive: number;
    spiritual: number;
    deflect: null;
  };
  resources: {
    health: {
      max: null;
    };
    focus: {
      max: number;
    };
    investiture: {
      max: number | null;
    };
  };
  derived: {
    movement: null;
    recoveryDie: null;
    liftingCapacity: null;
    sensesRange: null;
  };
};

export type SupportedDerivedResult = {
  values: SupportedDerivedValues;
  issues: Issue[];
};

function readAttribute(attributes: DerivedAttributes, key: keyof DerivedAttributes): number {
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

export function calcPhysicalDefense(input: { attributes: DerivedAttributes }): number {
  return 10 + readAttribute(input.attributes, "strength") + readAttribute(input.attributes, "speed");
}

export function calcCognitiveDefense(input: { attributes: DerivedAttributes }): number {
  return 10 + readAttribute(input.attributes, "intellect") + readAttribute(input.attributes, "willpower");
}

export function calcSpiritualDefense(input: { attributes: DerivedAttributes }): number {
  return 10 + readAttribute(input.attributes, "awareness") + readAttribute(input.attributes, "presence");
}

export function calcFocusMax(input: { attributes: DerivedAttributes }): number {
  return 2 + readAttribute(input.attributes, "willpower");
}

export function calcInvestitureMax(input: { radiant?: { enabled?: boolean } }): number | null {
  if (input.radiant?.enabled) {
    return null;
  }

  return 0;
}

export function calcSupportedDerived(input: SupportedDerivedInput): SupportedDerivedResult {
  const investitureMax = calcInvestitureMax(input);
  const issues = [
    ...(investitureMax === null ? [unsupportedIssue(["resources", "investiture", "max"], "Investiture max")] : []),
    unsupportedIssue(["derived", "movement"], "Movement"),
    unsupportedIssue(["derived", "recoveryDie"], "Recovery die"),
    unsupportedIssue(["derived", "liftingCapacity"], "Lifting capacity"),
    unsupportedIssue(["derived", "sensesRange"], "Senses range"),
    unsupportedIssue(["defenses", "deflect"], "Deflect"),
    unsupportedIssue(["resources", "health", "max"], "Max health")
  ];

  return {
    values: {
      defenses: {
        physical: calcPhysicalDefense(input),
        cognitive: calcCognitiveDefense(input),
        spiritual: calcSpiritualDefense(input),
        deflect: null
      },
      resources: {
        health: {
          max: null
        },
        focus: {
          max: calcFocusMax(input)
        },
        investiture: {
          max: investitureMax
        }
      },
      derived: {
        movement: null,
        recoveryDie: null,
        liftingCapacity: null,
        sensesRange: null
      }
    },
    issues
  };
}
