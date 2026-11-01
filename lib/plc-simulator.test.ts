import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLC_INPUTS,
  PLC_PRACTICE_SCENARIOS,
  checkPlcPractice,
  evaluatePlcRule,
  type PlcInputs,
  type PlcRule,
} from "./plc-simulator";

function inputs(overrides: Partial<PlcInputs> = {}): PlcInputs {
  return { ...DEFAULT_PLC_INPUTS, ...overrides };
}

describe("isolated PLC boolean logic", () => {
  it("returns true for AND only when both selected inputs are active", () => {
    const rule: PlcRule = { operator: "AND", inputA: "I0.0", inputB: "I0.1" };
    expect(evaluatePlcRule(rule, inputs({ "I0.0": true, "I0.1": true })).output).toBe(true);
    expect(evaluatePlcRule(rule, inputs({ "I0.0": true, "I0.1": false })).output).toBe(false);
    expect(evaluatePlcRule(rule, inputs({ "I0.0": false, "I0.1": true })).output).toBe(false);
  });

  it("returns true for OR when at least one selected input is active", () => {
    const rule: PlcRule = { operator: "OR", inputA: "I0.0", inputB: "I0.1" };
    expect(evaluatePlcRule(rule, inputs({ "I0.0": false, "I0.1": true })).output).toBe(true);
    expect(evaluatePlcRule(rule, inputs({ "I0.0": true, "I0.1": false })).output).toBe(true);
    expect(evaluatePlcRule(rule, inputs({ "I0.0": false, "I0.1": false })).output).toBe(false);
  });

  it("inverts the selected input for NOT", () => {
    const rule: PlcRule = { operator: "NOT", inputA: "I0.2", inputB: "I0.0" };
    expect(evaluatePlcRule(rule, inputs({ "I0.2": false })).output).toBe(true);
    expect(evaluatePlcRule(rule, inputs({ "I0.2": true })).output).toBe(false);
  });

  it("returns an ordered trace of input reads, logic and output", () => {
    const result = evaluatePlcRule(
      { operator: "AND", inputA: "I0.0", inputB: "I0.1" },
      inputs({ "I0.0": true, "I0.1": false }),
    );
    expect(result.trace.map((step) => step.id)).toEqual(["input-a", "input-b", "logic", "output"]);
    expect(result.trace.at(-1)?.value).toBe(false);
  });

  it("ignores the second input for NOT", () => {
    const rule = { operator: "NOT", inputA: "I0.0", inputB: "invalid" } as unknown as PlcRule;
    expect(evaluatePlcRule(rule, inputs({ "I0.0": false })).output).toBe(true);
  });

  it("rejects unsupported operators and unknown input identifiers", () => {
    const unsupported = { operator: "XOR", inputA: "I0.0", inputB: "I0.1" } as unknown as PlcRule;
    const unknownInput = { operator: "AND", inputA: "I9.9", inputB: "I0.1" } as unknown as PlcRule;
    expect(() => evaluatePlcRule(unsupported, inputs())).toThrow(RangeError);
    expect(() => evaluatePlcRule(unknownInput, inputs())).toThrow(RangeError);
  });

  it("rejects missing input values and incomplete binary rules", () => {
    const missingValue = { ...DEFAULT_PLC_INPUTS, "I0.0": undefined } as unknown as PlcInputs;
    const incompleteRule = { operator: "OR", inputA: "I0.0" } as unknown as PlcRule;
    expect(() => evaluatePlcRule({ operator: "NOT", inputA: "I0.0", inputB: "I0.1" }, missingValue)).toThrow(TypeError);
    expect(() => evaluatePlcRule(incompleteRule, inputs())).toThrow(RangeError);
  });
});

describe("PLC practice scenarios", () => {
  it("accepts a correct AND scenario and treats AND input order as equivalent", () => {
    const scenario = PLC_PRACTICE_SCENARIOS.find((item) => item.id === "and-both-active")!;
    const result = checkPlcPractice(
      { operator: "AND", inputA: "I0.1", inputB: "I0.0" },
      inputs({ "I0.0": true, "I0.1": true }),
      scenario,
    );
    expect(result.passed).toBe(true);
    expect(result.message).toContain("מצוין");
  });

  it("asks the learner to correct input states before passing a scenario", () => {
    const scenario = PLC_PRACTICE_SCENARIOS.find((item) => item.id === "and-both-active")!;
    const result = checkPlcPractice(
      scenario.rule,
      inputs({ "I0.0": true, "I0.1": false }),
      scenario,
    );
    expect(result.passed).toBe(false);
    expect(result.message).toContain("מצבי הכניסות");
  });

  it("does not pass a scenario when the selected operator is wrong", () => {
    const scenario = PLC_PRACTICE_SCENARIOS.find((item) => item.id === "or-one-active")!;
    const wrongRule: PlcRule = { operator: "AND", inputA: "I0.1", inputB: "I0.2" };
    expect(checkPlcPractice(wrongRule, inputs(), scenario).passed).toBe(false);
  });

  it("covers AND, OR and NOT with positive and negative output scenarios", () => {
    expect(PLC_PRACTICE_SCENARIOS.map((scenario) => scenario.rule.operator)).toEqual(["AND", "AND", "OR", "NOT"]);
    expect(PLC_PRACTICE_SCENARIOS.some((scenario) => scenario.expectedOutput)).toBe(true);
    expect(PLC_PRACTICE_SCENARIOS.some((scenario) => !scenario.expectedOutput)).toBe(true);
  });
});
