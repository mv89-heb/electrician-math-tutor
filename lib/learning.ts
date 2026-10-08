import type { Exercise } from "./curriculum";

export type TopicStats = {
  attempts: number;
  correct: number;
  hints: number;
  streak: number;
};

export type DiagnosticSkill = "חיבור" | "חיסור" | "כפל" | "חילוק" | "נעלם" | "נוסחה";

export type DiagnosticResult = {
  skill: DiagnosticSkill;
  correct: boolean;
};

export type LearningState = {
  version: 3;
  currentIndex: number;
  attempts: number;
  completed: string[];
  mistakes: string[];
  stats: Record<string, TopicStats>;
  diagnosticResults: DiagnosticResult[];
};

export const emptyLearningState: LearningState = {
  version: 3,
  currentIndex: 0,
  attempts: 0,
  completed: [],
  mistakes: [],
  stats: {},
  diagnosticResults: [],
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
    version: 3,
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

function firstIncomplete(curriculum: Exercise[], state: LearningState) {
  return curriculum
    .map((exercise, index) => ({ exercise, index }))
    .find(({ exercise }) => !state.completed.includes(exercise.id));
}

export function chooseNextExercise(curriculum: Exercise[], state: LearningState): number {
  const next = firstIncomplete(curriculum, state);
  if (!next) return 0;

  const weakTopic = Object.entries(state.stats)
    .filter(([, stats]) => stats.attempts >= 2 && topicMastery(stats) < 60)
    .sort((a, b) => topicMastery(a[1]) - topicMastery(b[1]))[0]?.[0];

  if (weakTopic) {
    const reinforcement = curriculum
      .map((exercise, index) => ({ exercise, index }))
      .find(({ exercise }) => exercise.topic === weakTopic && !state.completed.includes(exercise.id));
    if (reinforcement) return reinforcement.index;
    const knownExercise = curriculum
      .map((exercise, index) => ({ exercise, index }))
      .find(({ exercise }) => exercise.topic === weakTopic);
    if (knownExercise) return knownExercise.index;
  }

  if (state.diagnosticResults.length) {
    const diagnosticTopics: Record<DiagnosticSkill, string> = {
      "חיבור": "חיבור וחיסור במשוואות",
      "חיסור": "חיבור וחיסור במשוואות",
      "כפל": "כפל במשוואות",
      "חילוק": "חילוק במשוואות",
      "נעלם": "מהו נעלם?",
      "נוסחה": "נוסחאות בסיסיות",
    };
    const weakest = (["נעלם", "חילוק", "כפל", "חיסור", "חיבור", "נוסחה"] as DiagnosticSkill[])
      .map((skill) => ({ skill, score: diagnosticScore(state.diagnosticResults, skill) }))
      .sort((a, b) => a.score - b.score)[0];
    if (weakest && weakest.score < 80) {
      const targetTopic = diagnosticTopics[weakest.skill];
      const targeted = curriculum
        .map((exercise, index) => ({ exercise, index }))
        .find(({ exercise }) => exercise.topic === targetTopic && !state.completed.includes(exercise.id));
      if (targeted) return targeted.index;
    }
  }

  return next.index;
}

export function loadLearningState(storage: Storage | null): LearningState {
  if (!storage) return emptyLearningState;

  try {
    const raw = storage.getItem("electrician-math-learning");
    if (!raw) return emptyLearningState;
    const parsed = JSON.parse(raw) as Partial<LearningState>;
    if (parsed.version !== 3) return emptyLearningState;

    return {
      ...emptyLearningState,
      ...parsed,
      version: 3,
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
      stats: parsed.stats && typeof parsed.stats === "object" ? parsed.stats : {},
      diagnosticResults: Array.isArray(parsed.diagnosticResults) ? parsed.diagnosticResults : [],
    };
  } catch {
    return emptyLearningState;
  }
}

export function saveLearningState(storage: Storage | null, state: LearningState) {
  if (!storage) return;
  storage.setItem("electrician-math-learning", JSON.stringify({ ...state, version: 3 }));
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
