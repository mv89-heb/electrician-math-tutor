import type { Exercise } from "./curriculum";
import { normalizeAnswer } from "./answer-checker";

export function errorGuidance(exercise: Exercise, answer: string): string {
  const normalized = normalizeAnswer(answer);

  if (exercise.id.includes("zero-") && normalized.includes("-")) {
    return "נראה שאולי הלכת לכיוון של חיסור. בוא נבדוק יחד מה הפעולה שמופיעה ליד X.";
  }

  if (exercise.topic === "כפל במשוואות" && normalized !== "") {
    return "בתרגיל הזה X מוכפל במספר. חפש את הפעולה ההפוכה לכפל.";
  }

  if (exercise.topic === "חילוק במשוואות") {
    const match = exercise.prompt.match(/X\s*÷\s*\(?(-?\d+(?:[.,]\d+)?)\)?/);
    const divisor = match?.[1];
    if (divisor) {
      return `בתרגיל הזה X מחולק ב־${divisor}. כדי למצוא את X, השתמש בפעולה ההפוכה: כפל בתוצאה ובמחלק.`;
    }
    return "בתרגיל הזה X מחולק במספר. כדי למצוא את X, השתמש בפעולה ההפוכה: כפל.";
  }

  return "זו לא התשובה הפעם — וזה בסדר. השתמש ברמז הראשון ונסה שוב.";
}
