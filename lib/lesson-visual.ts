import type { Exercise } from "./curriculum";

export function isExponentLesson(exercise: Pick<Exercise, "id" | "topic">): boolean {
  return exercise.topic === "חזקות";
}
