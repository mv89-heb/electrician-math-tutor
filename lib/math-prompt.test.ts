import { describe, expect, it } from "vitest";
import { curriculum } from "./curriculum";
import { splitMathPrompt } from "./math-prompt";

describe("math prompt direction and expression splitting", () => {
  it("keeps decimal addition together as one left-to-right expression", () => {
    expect(splitMathPrompt("מה הערך של 0.5 + 0.5?").filter((part) => part.type === "math").map((part) => part.value))
      .toEqual(["0.5 + 0.5"]);
  });

  it("keeps decimal values, percentages, and electrical units intact", () => {
    expect(splitMathPrompt("עם π ≈ 3.14.").filter((part) => part.type === "math").map((part) => part.value))
      .toEqual(["π ≈ 3.14"]);
    expect(splitMathPrompt("מתח 12V וזרם 3A").filter((part) => part.type === "math").map((part) => part.value))
      .toEqual(["12V", "3A"]);
    expect(splitMathPrompt("כמה זה 50%?").filter((part) => part.type === "math").map((part) => part.value))
      .toEqual(["50%"]);
  });

  it("keeps formulas, fractions, and powers in left-to-right order", () => {
    expect(splitMathPrompt("V = I × R").filter((part) => part.type === "math").map((part) => part.value))
      .toEqual(["V = I × R"]);
    expect(splitMathPrompt("חשב 1/2 + 1/2").filter((part) => part.type === "math").map((part) => part.value))
      .toEqual(["1/2 + 1/2"]);
    expect(splitMathPrompt("מה הערך של 2²?").filter((part) => part.type === "math").map((part) => part.value))
      .toEqual(["2²"]);
  });

  it("checks that every fixed curriculum exercise has a readable prompt", () => {
    expect(curriculum.length).toBeGreaterThanOrEqual(55);
    for (const exercise of curriculum) {
      expect(exercise.prompt.trim(), exercise.id).not.toBe("");
      expect(exercise.prompt.trim(), exercise.id).not.toMatch(/(?:^|\s)(?:=|\+|−|×|÷)\s*\?$/);
    }
  });
});
