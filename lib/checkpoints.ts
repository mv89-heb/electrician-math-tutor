import type { Exercise } from "./curriculum";

export type CheckpointQuestion = {
  id: string;
  topic: string;
  prompt: string;
  accepted: string[];
  hint1: string;
  hint2: string;
};

export function buildCheckpoint(exercises: Exercise[], checkpointNumber: number): CheckpointQuestion[] {
  const completed = exercises.filter((exercise) => exercise.level <= Math.max(1, checkpointNumber - 1));
  const source = completed.length ? completed : exercises;
  return source.slice(0, 3).map((exercise, index) => ({
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
