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
  version: 7;
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
  finalExamPassed: boolean;
};

export const emptyLearningState: LearningState = {
  version: 7,
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
  finalExamPassed: false,
};

const OPTIONAL_PRACTICE: Record<string, string[]> = {
  "zero-2": ["zero-2b", "zero-2c"],
  "zero-2b": ["zero-2c"],
  "zero-2c": ["zero-2b"],
  "zero-3": ["zero-3b"],
  "zero-3b": ["zero-3"],
  "zero-4": ["zero-4b", "zero-4c"],
  "zero-4b": ["zero-4c"],
  "zero-4c": ["zero-4b"],
  "zero-5": ["zero-5b", "zero-5c"],
  "zero-5b": ["zero-5c"],
  "zero-5c": ["zero-5b"],
  "zero-6": ["zero-6b"],
  "zero-6b": ["zero-6"],
  "zero-7": ["zero-7b"],
  "zero-7b": ["zero-7"],
  "zero-8": ["zero-8b"],
  "zero-8b": ["zero-8"],
  "fraction-1": ["fraction-3"],
  "fraction-3": ["fraction-1"],
  "power-0": ["power-1b", "power-square-4"],
  "power-1b": ["power-square-4"],
  "power-square-4": ["power-1b"],
  "decimal-1": ["decimal-2"],
  "decimal-2": ["decimal-1"],
  "formula-1": ["formula-1b"],
  "formula-1b": ["formula-1"],
  "fraction-reduce-1": ["fraction-reduce-2"],
  "fraction-reduce-2": ["fraction-reduce-1"],
  "power-1": ["power-2"],
  "power-2": ["power-1"],
};

const CORE_LEARNING_ORDER = [
  "zero-1", "zero-2", "zero-3", "zero-4", "zero-5", "zero-6", "zero-7", "zero-8", "zero-8c",
  "fraction-1", "fraction-2", "fraction-reduce-1", "fraction-add-same-1", "fraction-sub-same-1",
  "fraction-common-1", "fraction-multiply-1", "fraction-divide-1", "power-0", "decimal-1",
  "percent-1", "percent-2", "formula-1", "formula-2", "formula-3", "formula-subject-1",
  "formula-subject-2", "geometry-area-rectangle-1", "geometry-area-square-1", "geometry-diameter-1",
  "geometry-radius-1", "geometry-area-circle-1", "units-mm-cm-1", "units-cm-m-1", "ohm-1", "ohm-2",
  "electrical-ohm-sub-1", "electrical-units-1", "power-1", "electrical-power-sub-1",
];

function orderedExercises(curriculum: Exercise[]): Exercise[] {
  const rank = new Map(CORE_LEARNING_ORDER.map((id, index) => [id, index]));
  return [...curriculum].sort((a, b) =>
    (rank.get(a.id) ?? CORE_LEARNING_ORDER.length + curriculum.indexOf(a)) -
    (rank.get(b.id) ?? CORE_LEARNING_ORDER.length + curriculum.indexOf(b))
  );
}

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
  const newlyCompleted = correct && isCurriculumExercise
    ? [exercise.id, ...(!usedHint ? (OPTIONAL_PRACTICE[exercise.id] ?? []) : [])]
    : [];
  const completed = [...new Set([...state.completed, ...newlyCompleted])];
  const mistakes = !correct && isCurriculumExercise && !state.mistakes.includes(exercise.id)
    ? [...state.mistakes, exercise.id]
    : state.mistakes;

  return {
    ...state,
    version: 7,
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
    .filter(([id, card]) => !id.startsWith("generated-") && card.lapses >= 2 && card.dueAt <= now)
    .sort((a, b) => a[1].dueAt - b[1].dueAt)
    .map(([id]) => id);
}

export function shouldGenerateReinforcement(stats?: TopicStats): boolean {
  return !!stats && stats.attempts >= 2 && !topicMasteryGate(stats);
}

export function topicMasteryGate(stats?: TopicStats): boolean {
  // One independent correct answer is enough to move on; repeated errors, not extra drills, trigger review.
  return !!stats && stats.unassistedCorrect >= 1 && stats.streak >= 1;
}

export function topicNeedsRemediation(stats?: TopicStats): boolean {
  return !!stats && stats.attempts >= 2 && !topicMasteryGate(stats) && topicMastery(stats) < 80;
}

export function generatedReinforcement(topic: string, seed: number, errorType?: ErrorType): Exercise | null {
  return generateReinforcement(topic, seed, errorType);
}

export function resolveExercise(curriculum: Exercise[], state: LearningState, index = state.currentIndex): Exercise {
  const baseExercise = curriculum[index] ?? curriculum[0];
  if (!baseExercise) throw new Error("Curriculum is empty");

  const stats = state.stats[baseExercise.topic];
  if (!shouldGenerateReinforcement(stats)) return baseExercise;

  const topicError = state.errors
    .filter((error) => error.topic === baseExercise.topic)
    .sort((a, b) => b.count - a.count)[0];

  return generateReinforcement(
    baseExercise.topic,
    state.attempts + baseExercise.level + state.completed.length,
    topicError?.type,
  ) ?? baseExercise;
}

export function topicMastery(stats?: TopicStats): number {
  if (!stats || stats.attempts === 0) return 0;
  const accuracy = stats.correct / stats.attempts;
  const consistency = Math.min(1, stats.streak / 3);
  const unassisted = stats.unassistedCorrect / stats.attempts;
  return Math.round((accuracy * 0.6 + unassisted * 0.25 + consistency * 0.15) * 100);
}

export function chooseNextExercise(curriculum: Exercise[], state: LearningState): number {
  const ordered = orderedExercises(curriculum);
  const due = dueReviewIds(state);
  const dueExercise = due
    .map((id) => curriculum.findIndex((exercise) => exercise.id === id))
    .find((index) => index >= 0);
  if (dueExercise !== undefined) return dueExercise;

  const current = curriculum[state.currentIndex] ?? curriculum[0];
  if (!current) return 0;
  const currentRank = ordered.findIndex((exercise) => exercise.id === current.id);
  const currentStats = state.stats[current.topic];

  if (!topicMasteryGate(currentStats)) {
    const sameTopicUnfinished = ordered.find((exercise) =>
      exercise.topic === current.topic && !state.completed.includes(exercise.id)
    );
    if (sameTopicUnfinished) return curriculum.findIndex((exercise) => exercise.id === sameTopicUnfinished.id);

    const topicErrorCount = state.errors
      .filter((error) => error.topic === current.topic)
      .reduce((sum, error) => sum + error.count, 0);
    if (topicErrorCount >= 3) return state.currentIndex;
  }

  const next = ordered
    .slice(Math.max(0, currentRank + 1))
    .find((exercise) => !state.completed.includes(exercise.id));
  if (next) return curriculum.findIndex((exercise) => exercise.id === next.id);

  const first = ordered.find((exercise) => !state.completed.includes(exercise.id));
  return first ? curriculum.findIndex((exercise) => exercise.id === first.id) : 0;
}

function nonNegativeInteger(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? Math.floor(numeric) : 0;
}

export function loadLearningState(storage: Storage | null): LearningState {
  if (!storage) return emptyLearningState;

  try {
    const raw = storage.getItem("electrician-math-learning");
    if (!raw) return emptyLearningState;
    const parsed = JSON.parse(raw) as Partial<LearningState>;
    const storedVersion = Number(parsed.version);
    if (storedVersion !== 3 && storedVersion !== 4 && storedVersion !== 5 && storedVersion !== 6 && storedVersion !== 7) return emptyLearningState;

    const rawStats = parsed.stats && typeof parsed.stats === "object" ? parsed.stats as Record<string, TopicStats> : {};
    const stats = Object.fromEntries(Object.entries(rawStats).map(([topic, value]) => [topic, {
      attempts: nonNegativeInteger(value?.attempts),
      correct: nonNegativeInteger(value?.correct),
      hints: nonNegativeInteger(value?.hints),
      streak: nonNegativeInteger(value?.streak),
      unassistedCorrect: nonNegativeInteger(value?.unassistedCorrect),
    }]));

    return {
      ...emptyLearningState,
      ...parsed,
      version: 7,
      currentIndex: nonNegativeInteger(parsed.currentIndex),
      attempts: nonNegativeInteger(parsed.attempts),
      stats,
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
      diagnosticResults: Array.isArray(parsed.diagnosticResults) ? parsed.diagnosticResults : [],
      checkpointsCompleted: Array.isArray(parsed.checkpointsCompleted) ? parsed.checkpointsCompleted : [],
      reviews: parsed.reviews && typeof parsed.reviews === "object" ? parsed.reviews as Record<string, ReviewCard> : {},
      errors: Array.isArray(parsed.errors) ? parsed.errors as ErrorRecord[] : [],
      masteryTests: parsed.masteryTests && typeof parsed.masteryTests === "object" ? parsed.masteryTests as Record<string, MasteryTestResult> : {},
      finalExamPassed: parsed.finalExamPassed === true,
    };
  } catch {
    return emptyLearningState;
  }
}

export function saveLearningState(storage: Storage | null, state: LearningState) {
  if (!storage) return;
  storage.setItem("electrician-math-learning", JSON.stringify({ ...state, version: 7 }));
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
  return index >= 0 ? index : 0;
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


export function canStartMasteryTest(topic: string, state: LearningState, exercises?: Exercise[]): boolean {
  const hasEnoughQuestions = exercises ? new Set(exercises.filter((exercise) => exercise.topic === topic).map((exercise) => exercise.id)).size >= 3 : true;
  const repeatedErrors = state.errors.filter((error) => error.topic === topic).reduce((sum, error) => sum + error.count, 0);
  return hasEnoughQuestions && repeatedErrors >= 3 && topicNeedsRemediation(state.stats[topic]) && !state.masteryTests[topic]?.passed;
}

export function recordMasteryTest(state: LearningState, topic: string, score: number, requiredCorrect = 3): LearningState {
  const previous = state.masteryTests[topic];
  const passed = score >= requiredCorrect;
  return {
    ...state,
    version: 7,
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


export function recordFinalExam(state: LearningState, passed: boolean): LearningState {
  return { ...state, version: 7, finalExamPassed: state.finalExamPassed || passed };
}
