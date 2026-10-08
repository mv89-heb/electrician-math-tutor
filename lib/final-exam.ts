import type { Exercise } from "./curriculum";

export type FinalExamQuestion = {
  id: string;
  topic: string;
  prompt: string;
  accepted: string[];
  hint1: string;
};

const finalExamIds = [
  "zero-2c","zero-4c","zero-5c","zero-6b","zero-7b","zero-8c",
  "fraction-3","power-2","decimal-2","percent-2","formula-3","ohm-2","power-2"
];

export const FINAL_EXAM_TOTAL = 12;
export const FINAL_EXAM_REQUIRED = 10;

export function buildFinalExam(exercises: Exercise[], seed = 0): FinalExamQuestion[] {
  const pool = finalExamIds
    .map((id) => exercises.find((exercise) => exercise.id === id))
    .filter((exercise): exercise is Exercise => Boolean(exercise));
  if (!pool.length) return [];
  const offset = seed % pool.length;
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];
  const unique = rotated.filter((exercise, index, list) =>
    list.findIndex((item) => item.id === exercise.id) === index
  );
  return unique.slice(0, FINAL_EXAM_TOTAL).map((exercise, index) => ({
    id: `final-100-${index + 1}-${exercise.id}`,
    topic: exercise.topic,
    prompt: exercise.prompt,
    accepted: exercise.accepted,
    hint1: exercise.hint1,
  }));
}

export function finalExamPasses(score: number): boolean {
  return score >= FINAL_EXAM_REQUIRED;
}
