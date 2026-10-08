import type { Exercise } from "./curriculum";
import type { LearningState } from "./learning";

export type LearningStage = { number: number; label: string; topics: string[] };

export const learningStages: LearningStage[] = [
  { number: 1, label: "יסודות", topics: ["מהו נעלם?", "חיבור וחיסור במשוואות"] },
  { number: 2, label: "פעולות", topics: ["כפל במשוואות", "חילוק במשוואות", "סדר פעולות"] },
  { number: 3, label: "X ומשוואות", topics: ["משוואות פשוטות"] },
  { number: 4, label: "שברים וחזקות", topics: ["שברים", "חזקות", "מספרים עשרוניים", "אחוזים"] },
  { number: 5, label: "אלגברה", topics: ["נוסחאות בסיסיות", "שינוי נושא נוסחה"] },
  { number: 6, label: "מתמטיקה לחשמל", topics: ["חשמל — חוק אוהם"] },
  { number: 7, label: "תרגול חשמלאי", topics: ["חשמל — הספק"] },
  { number: 8, label: "100 🎯", topics: [] },
];

export function stageForTopic(topic: string): LearningStage {
  return learningStages.find((stage) => stage.topics.includes(topic)) ?? learningStages[7];
}

export function stageForExercise(exercise: Exercise): LearningStage {
  return stageForTopic(exercise.topic);
}

export function stageExercises(stage: LearningStage, curriculum: Exercise[]): Exercise[] {
  return curriculum.filter((exercise) => stage.topics.includes(exercise.topic));
}

export function stageGateSatisfied(stageNumber: number, state: LearningState, curriculum: Exercise[]): boolean {
  if (stageNumber <= 1) return true;
  return learningStages
    .filter((stage) => stage.number < stageNumber && stage.topics.length > 0)
    .every((stage) => {
      const exercises = stageExercises(stage, curriculum);
      const allCompleted = exercises.every((exercise) => state.completed.includes(exercise.id));
      const topicsReady = stage.topics.every((topic) => {
        const stats = state.stats[topic];
        if (!stats || stats.attempts < 3) return false;
        return stats.correct / stats.attempts >= 0.8 &&
          stats.unassistedCorrect / stats.attempts >= 0.65 &&
          stats.streak >= 2;
      });
      return allCompleted && topicsReady;
    });
}

export function stageProgress(stageNumber: number, state: LearningState, curriculum: Exercise[]): number {
  const stage = learningStages.find((stage) => stage.number === stageNumber);
  if (!stage) return 0;
  const exercises = stageExercises(stage, curriculum);
  if (!exercises.length) return stageNumber === 8 ? 100 : 0;
  return Math.round(
    (exercises.filter((exercise) => state.completed.includes(exercise.id)).length / exercises.length) * 100,
  );
}
