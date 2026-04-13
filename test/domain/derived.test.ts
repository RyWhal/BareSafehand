import { describe, expect, it } from "vitest";
import {
  calcCognitiveDefense,
  calcFocusMax,
  calcInvestitureMax,
  calcPhysicalDefense,
  calcSpiritualDefense,
  calcSupportedDerived
} from "../../src/domain/rules/derived";

describe("derived stat calculators", () => {
  it("calculates physical defense from strength and speed", () => {
    const value = calcPhysicalDefense({
      attributes: {
        strength: 3,
        speed: 2,
        intellect: 0,
        willpower: 0,
        awareness: 0,
        presence: 0
      }
    });

    expect(value).toBe(15);
  });

  it("calculates cognitive defense from intellect and willpower", () => {
    const value = calcCognitiveDefense({
      attributes: {
        strength: 0,
        speed: 0,
        intellect: 4,
        willpower: 1,
        awareness: 0,
        presence: 0
      }
    });

    expect(value).toBe(15);
  });

  it("calculates spiritual defense from awareness and presence", () => {
    const value = calcSpiritualDefense({
      attributes: {
        strength: 0,
        speed: 0,
        intellect: 0,
        willpower: 0,
        awareness: 5,
        presence: 2
      }
    });

    expect(value).toBe(17);
  });

  it("calculates focus max from willpower", () => {
    const value = calcFocusMax({
      attributes: {
        strength: 0,
        speed: 0,
        intellect: 0,
        willpower: 6,
        awareness: 0,
        presence: 0
      }
    });

    expect(value).toBe(8);
  });

  it("defaults missing attributes to zero", () => {
    const value = calcPhysicalDefense({
      attributes: {}
    });

    expect(value).toBe(10);
  });

  it("defaults non-radiant investiture max to zero", () => {
    const value = calcInvestitureMax({
      radiant: {
        enabled: false
      }
    });

    expect(value).toBe(0);
  });

  it("treats radiant investiture max as unsupported", () => {
    const value = calcInvestitureMax({
      radiant: {
        enabled: true
      }
    });

    expect(value).toBeNull();
  });

  it("returns supported derived values and warnings for unsupported formulas", () => {
    const result = calcSupportedDerived({
      attributes: {
        strength: 3,
        speed: 2,
        intellect: 4,
        willpower: 1,
        awareness: 5,
        presence: 2
      },
      radiant: {
        enabled: false
      }
    });

    expect(result.values).toEqual({
      defenses: {
        physical: 15,
        cognitive: 15,
        spiritual: 17,
        deflect: null
      },
      resources: {
        health: {
          max: null
        },
        focus: {
          max: 3
        },
        investiture: {
          max: 0
        }
      },
      derived: {
        movement: null,
        recoveryDie: null,
        liftingCapacity: null,
        sensesRange: null
      }
    });

    expect(result.issues).toHaveLength(6);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "UNSUPPORTED_RULE", path: ["derived", "movement"] }),
        expect.objectContaining({ code: "UNSUPPORTED_RULE", path: ["derived", "recoveryDie"] }),
        expect.objectContaining({ code: "UNSUPPORTED_RULE", path: ["derived", "liftingCapacity"] }),
        expect.objectContaining({ code: "UNSUPPORTED_RULE", path: ["derived", "sensesRange"] }),
        expect.objectContaining({ code: "UNSUPPORTED_RULE", path: ["defenses", "deflect"] }),
        expect.objectContaining({ code: "UNSUPPORTED_RULE", path: ["resources", "health", "max"] })
      ])
    );
  });

  it("surfaces radiant investiture as unsupported in the aggregate result", () => {
    const result = calcSupportedDerived({
      attributes: {
        strength: 3,
        speed: 2,
        intellect: 4,
        willpower: 1,
        awareness: 5,
        presence: 2
      },
      radiant: {
        enabled: true
      }
    });

    expect(result.values.resources.investiture.max).toBeNull();
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "UNSUPPORTED_RULE",
          path: ["resources", "investiture", "max"]
        })
      ])
    );
  });
});
