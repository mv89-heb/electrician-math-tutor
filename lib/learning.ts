import type { Exercise } from "./curriculum";

export type TopicStats = {
  attempts: number;
  correct: number;
  hints: number;
  streak: number;
};

export type LearningState = {
  currentIndex: number;
  attempts: number;
  completed: string[];
  mistakes: string[];
  stats: Record<string, TopicStats>;
};

export const emptyLearningState: LearningState = {
  currentIndex: 0,
  attempts: 0,
  completed: [],
  mistakes: [],
  stats: {},
};

export function recordAttempt(
  state: LearningState,
  exercise: Exercise,
  correct: boolean,
  usedHint: boolean,
): LearningState {
  const previous = state.stats[exercise.topic] ?? { attempts: 0, correct: 0, hints: 0, streak: 0 };
  const nextStreak = correct ? previous.streak + 1 : 0;
  const completed = correct && !state.completed.includes(exercise.id)
    ? [...state.completed, exercise.id]
    : state.completed;
  const mistakes = !correct && !state.mistakes.includes(exercise.id)
    ? [...state.mistakes, exercise.id]
    : state.mistakes;

  return {
    ...state,
    attempts: state.attempts + 1,
    completed,
    mistakes,
    stats: {
      ...state.stats,
      [exercise.topic]: {
        attempts: previous.attempts + 1,
        correct: previous.correct + (correct ? 1 : 0),
        hints: previous.hints + (usedHint ? 1 : 0),
        streak: nextStreak,
      },
    },
  };
}

export function topicMastery(stats?: TopicStats): number {
  if (!stats || stats.attempts === 0) return 0;
  const accuracy = stats.correct / stats.attempts;
  const consistency = Math.min(1, stats.streak / 3);
  return Math.round((accuracy * 0.75 + consistency * 0.25) * 100);
}

export function chooseNextExercise(
  curriculum: Exercise[],
  state: LearningState,
): number {
  const incomplete = curriculum
    .map((exercise, index) => ({ exercise, index }))
    .filter(({ exercise }) => !state.completed.includes(exercise.id));

  if (incomplete.length === 0) return 0;

  const weakTopic = Object.entries(state.stats)
    .sort((a, b) => topicMastery(a[1]) - topicMastery(b[1]))[0]?.[0];

  if (weakTopic) {
    const weak = incomplete.find(({ exercise }) => exercise.topic === weakTopic);
    if (weak) return weak.index;
  }

  return incomplete[0].index;
}

export function loadLearningState(storage: Storage | null): LearningState {
  if (!storage) return emptyLearningState;
  try {
    const raw = storage.getItem("electrician-math-learning");
    if (!raw) return emptyLearningState;
    const parsed = JSON.parse(raw) as LearningState;
    return {
      ...emptyLearningState,
      ...parsed,
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
      stats: parsed.stats && typeof parsed.stats === "object" ? parsed.stats : {},
    };
  } catch {
    return emptyLearningState;
  }
}

export function saveLearningState(storage: Storage | null, state: LearningState) {
  if (!storage) return;
  storage.setItem("electrician-math-learning", JSON.stringify(state));
}
