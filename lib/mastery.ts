import type { Exercise } from "./curriculum";

export type MasteryQuestion = {
  id: string;
  topic: string;
  prompt: string;
  accepted: string[];
};


export function buildTopicMasteryTest(exercises: Exercise[], topic: string, seed = 0): MasteryQuestion[] {
  const source = exercises.filter((exercise) => exercise.topic === topic);
  if (!source.length) return [];
  const rotated = [...source.slice(seed % source.length), ...source.slice(0, seed % source.length)];
  const unique = rotated.filter((exercise, index, list) => list.findIndex((item) => item.id === exercise.id) === index);
  const selected = unique.slice(0, 3);
  return selected.map((exercise, index) => ({
    id: `mastery-${topic}-${seed}-${index + 1}-${exercise.id}`,
    topic,
    prompt: exercise.prompt,
    accepted: exercise.accepted,
  }));
}

export function masteryPasses(score: number, requiredCorrect = 3): boolean {
  return score >= requiredCorrect;
}
