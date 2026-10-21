import type { Exercise } from "./curriculum";

/**
 * Chooses the formula for the quantity the exercise asks the learner to find.
 * Explicit rearranged formulas take precedence over the broader teaching note,
 * which may mention the original formula as background.
 */
export function electricalGuidedFormula(
  exercise: Pick<Exercise, "id" | "topic" | "prompt" | "teachingNote">,
): string | null {
  const context = `${exercise.prompt} ${exercise.teachingNote}`;
  if (!/ohm|power|חשמל/i.test(`${exercise.id} ${exercise.topic}`)) return null;

  if (/\bI\s*=\s*P\s*[÷/]\s*V/i.test(context)) return "I = P ÷ V";
  if (/\bR\s*=\s*V\s*[÷/]\s*I/i.test(context)) return "R = V ÷ I";
  if (/\bP\s*=\s*V\s*[×*]\s*I/i.test(context)) return "P = V × I";
  if (/\bI\s*=\s*V\s*[÷/]\s*R/i.test(context)) return "I = V ÷ R";

  if (/התנגדות/i.test(exercise.prompt)) return "R = V ÷ I";
  if (/הספק/i.test(exercise.prompt) && !/זרם/i.test(exercise.prompt)) return "P = V × I";
  if (/זרם/i.test(exercise.prompt)) return "I = V ÷ R";
  return null;
}
