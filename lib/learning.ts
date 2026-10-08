import type { Exercise } from "./curriculum";
import { generateReinforcement } from "./exercise-generator";

export type TopicStats = {
  attempts: number;
  correct: number;
  hints: number;
  streak: number;
  unassistedCorrect: number;
};

export type DiagnosticSkill = "חיבור" | "חיסור" | "כפל" | "חילוק" | "נעלם" | "נוסחה";

export type DiagnosticResult = {
  skill: DiagnosticSkill;
  correct: boolean;
};

export type ErrorType = "sign" | "operation" | "unknown" | "unit" | "arithmetic" | "concept";

export type MasteryTestResult = {
  topic: string;
  attempts: number;
  passed: boolean;
  bestScore: number;
  lastScore: number;
  lastAttemptAt: number;
};

export type ErrorRecord = {
  type: ErrorType;
  exerciseId: string;
  topic: string;
  count: number;
  lastAnswer: string;
};

export type ReviewCard = {
  dueAt: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
};

export type LearningState = {
  version: 6;
  currentIndex: number;
  attempts: number;
  completed: string[];
  mistakes: string[];
  stats: Record<string, TopicStats>;
  diagnosticResults: DiagnosticResult[];
  checkpointsCompleted: number[];
  reviews: Record<string, ReviewCard>;
  errors: ErrorRecord[];
  masteryTests: Record<string, MasteryTestResult>;
};

export const emptyLearningState: LearningState = {
  version: 5,
  currentIndex: 0,
  attempts: 0,
  completed: [],
  mistakes: [],
  stats: {},
  diagnosticResults: [],
  checkpointsCompleted: [],
  reviews: {},
  errors: [],
  masteryTests: {},
};

export function recordAttempt(
  state: LearningState,
  exercise: Exercise,
  correct: boolean,
  usedHint: boolean,
  errorType?: ErrorType,
  lastAnswer = "",
): LearningState {
  const previous = state.stats[exercise.topic] ?? { attempts: 0, correct: 0, hints: 0, streak: 0, unassistedCorrect: 0 };
  const nextStreak = correct ? previous.streak + 1 : 0;
  const isCurriculumExercise = !exercise.id.startsWith("generated-");
  const completed = correct && isCurriculumExercise && !state.completed.includes(exercise.id)
    ? [...state.completed, exercise.id]
    : state.completed;
  const mistakes = !correct && isCurriculumExercise && !state.mistakes.includes(exercise.id)
    ? [...state.mistakes, exercise.id]
    : state.mistakes;

  return {
    ...state,
    version: 6,
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
        unassistedCorrect: previous.unassistedCorrect + (correct && !usedHint ? 1 : 0),
      },
    },
    reviews: {
      ...state.reviews,
      ...(isCurriculumExercise ? {
        [exercise.id]: scheduleReview(state.reviews[exercise.id], correct, usedHint),
      } : {}),
    },
    errors: correct || !errorType || !isCurriculumExercise
      ? state.errors
      : upsertError(state.errors, { type: errorType, exerciseId: exercise.id, topic: exercise.topic, count: 1, lastAnswer }),
  };
}

export function upsertError(errors: ErrorRecord[], incoming: ErrorRecord): ErrorRecord[] {
  const existing = errors.find((error) => error.exerciseId === incoming.exerciseId && error.type === incoming.type);
  if (!existing) return [...errors, incoming];
  return errors.map((error) => error === existing ? { ...error, count: error.count + 1, lastAnswer: incoming.lastAnswer } : error);
}

export function classifyError(answer: string, exercise: Exercise): ErrorType {
  const normalized = answer.trim().toLowerCase().replaceAll(" ", "");
  if (/(אמפר|amp|וולט|volt|וואט|w|v|a)$/.test(normalized)) return "unit";
  if (normalized.includes("-") || normalized.includes("−")) return "sign";
  if (exercise.topic.includes("כפל") && (normalized.includes("/") || normalized.includes("÷"))) return "operation";
  if (exercise.topic.includes("חילוק") && (normalized.includes("*") || normalized.includes("×"))) return "operation";
  if (/^[0-9.,]+$/.test(normalized)) return "arithmetic";
  if (/[a-zא-ת]/i.test(normalized)) return "concept";
  return "unknown";
}

export function topErrorTypes(errors: ErrorRecord[]): ErrorType[] {
  return [...new Set([...errors].sort((a, b) => b.count - a.count).map((error) => error.type))];
}

export function scheduleReview(card: ReviewCard | undefined, correct: boolean, usedHint: boolean): ReviewCard {
  const previous = card ?? { dueAt: Date.now(), intervalDays: 0, repetitions: 0, lapses: 0 };
  if (!correct) {
    return { dueAt: Date.now() + 10 * 60 * 1000, intervalDays: 0, repetitions: 0, lapses: previous.lapses + 1 };
  }
  const nextInterval = previous.repetitions === 0
    ? 1
    : previous.repetitions === 1
      ? 3
      : usedHint
        ? Math.max(2, Math.round(previous.intervalDays * 1.5))
        : Math.max(4, Math.round(previous.intervalDays * 2.4));
  return {
    dueAt: Date.now() + nextInterval * 24 * 60 * 60 * 1000,
    intervalDays: nextInterval,
    repetitions: previous.repetitions + 1,
    lapses: previous.lapses,
  };
}

export function dueReviewIds(state: LearningState, now = Date.now()): string[] {
  return Object.entries(state.reviews)
    .filter(([id, card]) => !id.startsWith("generated-") && card.dueAt <= now)
    .sort((a, b) => a[1].dueAt - b[1].dueAt)
    .map(([id]) => id);
}

export function shouldGenerateReinforcement(stats?: TopicStats): boolean {
  return !!stats && stats.attempts >= 2 && !topicMasteryGate(stats);
}

export function topicMasteryGate(stats?: TopicStats): boolean {
  if (!stats || stats.attempts < 3) return false;
  const accuracy = stats.correct / stats.attempts;
  const unassisted = stats.unassistedCorrect / stats.attempts;
  return accuracy >= 0.8 && unassisted >= 0.65 && stats.streak >= 2;
}

export function topicNeedsRemediation(stats?: TopicStats): boolean {
  return !!stats && stats.attempts >= 2 && !topicMasteryGate(stats) && topicMastery(stats) < 80;
}

export function generatedReinforcement(topic: string, seed: number, errorType?: ErrorType): Exercise | null {
  return generateReinforcement(topic, seed, errorType);
}

export function topicMastery(stats?: TopicStats): number {
  if (!stats || stats.attempts === 0) return 0;
  const accuracy = stats.correct / stats.attempts;
  const consistency = Math.min(1, stats.streak / 3);
  const unassisted = stats.unassistedCorrect / stats.attempts;
  return Math.round((accuracy * 0.6 + unassisted * 0.25 + consistency * 0.15) * 100);
}

function firstIncomplete(curriculum: Exercise[], state: LearningState) {
  return curriculum
    .map((exercise, index) => ({ exercise, index }))
    .find(({ exercise }) => !state.completed.includes(exercise.id));
}

export function chooseNextExercise(curriculum: Exercise[], state: LearningState): number {
  const due = dueReviewIds(state);
  const dueExercise = due
    .map((id) => curriculum.findIndex((exercise) => exercise.id === id))
    .find((index) => index >= 0);
  if (dueExercise !== undefined) return dueExercise;

  const current = curriculum[state.currentIndex] ?? curriculum[0];
  if (!current) return 0;

  const currentStats = state.stats[current.topic];
  if (!topicMasteryGate(currentStats)) {
    const sameTopicUnfinished = curriculum
      .map((exercise, index) => ({ exercise, index }))
      .find(({ exercise }) => exercise.topic === current.topic && !state.completed.includes(exercise.id));
    if (sameTopicUnfinished) return sameTopicUnfinished.index;

    const topicErrors = state.errors
      .filter((error) => error.topic === current.topic)
      .sort((a, b) => b.count - a.count);
    if (topicErrors.length) return state.currentIndex;

    const sameTopic = curriculum.findIndex((exercise) => exercise.topic === current.topic);
    if (sameTopic >= 0) return sameTopic;
  }

  const weakErrorTopic = state.errors
    .filter((error) => error.count >= 2)
    .map((error) => error.topic)
    .find((topic) => curriculum.some((exercise) => exercise.topic === topic && !state.completed.includes(exercise.id)));
  if (weakErrorTopic) {
    const targeted = curriculum.findIndex((exercise) => exercise.topic === weakErrorTopic && !state.completed.includes(exercise.id));
    if (targeted >= 0) return targeted;
  }

  const next = curriculum
    .map((exercise, index) => ({ exercise, index }))
    .find(({ exercise, index }) => index > state.currentIndex && !state.completed.includes(exercise.id));
  if (next) return next.index;

  const first = curriculum.findIndex((exercise) => !state.completed.includes(exercise.id));
  if (first >= 0) return first;

  return 0;
}

export function loadLearningState(storage: Storage | null): LearningState {
  if (!storage) return emptyLearningState;

  try {
    const raw = storage.getItem("electrician-math-learning");
    if (!raw) return emptyLearningState;
    const parsed = JSON.parse(raw) as Partial<LearningState>;
    const storedVersion = Number(parsed.version);
    if (storedVersion !== 3 && storedVersion !== 4 && storedVersion !== 5 && storedVersion !== 6) return emptyLearningState;

    const rawStats = parsed.stats && typeof parsed.stats === "object" ? parsed.stats as Record<string, TopicStats> : {};
    const stats = Object.fromEntries(Object.entries(rawStats).map(([topic, value]) => [topic, {
      attempts: Number(value?.attempts) || 0,
      correct: Number(value?.correct) || 0,
      hints: Number(value?.hints) || 0,
      streak: Number(value?.streak) || 0,
      unassistedCorrect: Number(value?.unassistedCorrect) || 0,
    }]));

    return {
      ...emptyLearningState,
      ...parsed,
      version: 6,
      stats,
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
      diagnosticResults: Array.isArray(parsed.diagnosticResults) ? parsed.diagnosticResults : [],
      checkpointsCompleted: Array.isArray(parsed.checkpointsCompleted) ? parsed.checkpointsCompleted : [],
      reviews: parsed.reviews && typeof parsed.reviews === "object" ? parsed.reviews as Record<string, ReviewCard> : {},
      errors: Array.isArray(parsed.errors) ? parsed.errors as ErrorRecord[] : [],
      masteryTests: parsed.masteryTests && typeof parsed.masteryTests === "object" ? parsed.masteryTests as Record<string, MasteryTestResult> : {},
    };
  } catch {
    return emptyLearningState;
  }
}

export function saveLearningState(storage: Storage | null, state: LearningState) {
  if (!storage) return;
  storage.setItem("electrician-math-learning", JSON.stringify({ ...state, version: 6 }));
}

export function diagnosticScore(results: DiagnosticResult[], skill: DiagnosticSkill): number {
  const relevant = results.filter((result) => result.skill === skill);
  if (!relevant.length) return 50;
  return relevant[relevant.length - 1].correct ? 100 : 0;
}

export function recommendedStartingIndex(results: DiagnosticResult[], curriculum: Exercise[]): number {
  if (!results.length) return 0;
  const weakest = (["נעלם", "נוסחה", "חילוק", "כפל", "חיסור", "חיבור"] as DiagnosticSkill[])
    .map((skill) => ({ skill, score: diagnosticScore(results, skill) }))
    .sort((a, b) => a.score - b.score)[0];

  if (!weakest || weakest.score >= 80) return 0;

  const topicMap: Partial<Record<DiagnosticSkill, string>> = {
    "חיבור": "חיבור וחיסור במשוואות",
    "חיסור": "חיבור וחיסור במשוואות",
    "כפל": "כפל במשוואות",
    "חילוק": "חילוק במשוואות",
    "נעלם": "מהו נעלם?",
    "נוסחה": "נוסחאות בסיסיות",
  };
  const target = topicMap[weakest.skill];
  const index = curriculum.findIndex((exercise) => exercise.topic === target);
  return index >= 0 ? Math.max(0, index - 1) : 0;
}

export function weakestDiagnosticSkills(results: DiagnosticResult[]): DiagnosticSkill[] {
  const skills: DiagnosticSkill[] = ["חיבור", "חיסור", "כפל", "חילוק", "נעלם", "נוסחה"];
  return skills
    .map((skill) => ({
      skill,
      correct: results.filter((result) => result.skill === skill && result.correct).length,
      total: results.filter((result) => result.skill === skill).length,
    }))
    .filter((item) => item.total > 0 && item.correct < item.total)
    .sort((a, b) => a.correct - b.correct)
    .map((item) => item.skill);
}


export function canStartMasteryTest(topic: string, state: LearningState): boolean {
  return topicMasteryGate(state.stats[topic]) && !state.masteryTests[topic]?.passed;
}

export function recordMasteryTest(state: LearningState, topic: string, score: number, requiredCorrect = 3): LearningState {
  const previous = state.masteryTests[topic];
  const passed = score >= requiredCorrect;
  return {
    ...state,
    version: 6,
    masteryTests: {
      ...state.masteryTests,
      [topic]: {
        topic,
        attempts: (previous?.attempts ?? 0) + 1,
        passed,
        bestScore: Math.max(previous?.bestScore ?? 0, score),
        lastScore: score,
        lastAttemptAt: Date.now(),
      },
    },
  };
}
