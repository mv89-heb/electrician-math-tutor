import { describe, expect, it } from "vitest";
import { generateExercise } from "./exercise-generator";

describe("adaptive exercise generator", () => {
  it("creates a valid beginner exercise with a deterministic accepted answer", () => {
    const exercise = generateExercise("מהו נעלם?", 4);
    expect(exercise).not.toBeNull();
    expect(exercise?.generated).toBe(true);
    expect(exercise?.accepted.length).toBeGreaterThan(0);
  });

  it("returns no generated exercise for an unknown topic", () => {
    expect(generateExercise("נושא שלא קיים", 1)).toBeNull();
  });
});
