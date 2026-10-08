import type { Exercise } from "./curriculum";

export type CheckpointQuestion = {
  id: string;
  topic: string;
  prompt: string;
  accepted: string[];
  hint1: string;
  hint2: string;
};

export function buildCheckpoint(exercises: Exercise[], checkpointNumber: number, completedIds?: string[]): CheckpointQuestion[] {
  const completed = completedIds?.length
    ? exercises.filter((exercise) => completedIds.includes(exercise.id))
    : exercises.filter((exercise) => exercise.level <= Math.max(1, checkpointNumber - 1));
  const source = completed.length ? completed : exercises;
  const start = source.length > 3 ? (checkpointNumber * 2) % source.length : 0;
  const rotated = [...source.slice(start), ...source.slice(0, start)];
  return rotated.slice(0, 3).map((exercise, index) => ({
    id: `checkpoint-${checkpointNumber}-${index + 1}-${exercise.id}`,
    topic: exercise.topic,
    prompt: exercise.prompt,
    accepted: exercise.accepted,
    hint1: exercise.hint1,
    hint2: exercise.hint2,
  }));
}

export function shouldRunCheckpoint(completedCount: number, completedCheckpoints: number[]): boolean {
  if (completedCount < 5) return false;
  const checkpointNumber = Math.floor(completedCount / 5);
  return !completedCheckpoints.includes(checkpointNumber);
}
