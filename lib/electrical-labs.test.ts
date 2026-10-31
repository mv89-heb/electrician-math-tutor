import { describe, expect, it } from "vitest";
import { calculateOhmsLaw, calculateTwoResistorCircuit } from "./electrical-labs";

describe("electrical learning lab calculations", () => {
  it("calculates current and power from Ohm's law", () => {
    expect(calculateOhmsLaw(12, 6)).toEqual({ voltage: 12, resistance: 6, current: 2, power: 24 });
  });

  it("calculates equivalent resistance and equal current in series", () => {
    const result = calculateTwoResistorCircuit(12, 6, 6, "series");
    expect(result.equivalentResistance).toBe(12);
    expect(result.totalCurrent).toBe(1);
    expect(result.branchCurrents).toEqual([1, 1]);
  });

  it("calculates equivalent resistance and branch currents in parallel", () => {
    const result = calculateTwoResistorCircuit(12, 6, 6, "parallel");
    expect(result.equivalentResistance).toBe(3);
    expect(result.totalCurrent).toBe(4);
    expect(result.branchCurrents).toEqual([2, 2]);
  });

  it("rejects invalid resistance values", () => {
    expect(() => calculateOhmsLaw(12, 0)).toThrow(RangeError);
    expect(() => calculateTwoResistorCircuit(12, 6, -1, "series")).toThrow(RangeError);
  });
});
