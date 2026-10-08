import type { Exercise } from "./curriculum";

export type GeneratedExercise = Exercise & { generated: true };

type Template = {
  topic: string;
  level: number;
  title: string;
  teachingNote: string;
  prompt: (n: number) => string;
  answer: (n: number) => string;
  hint1: string;
  hint2: string;
  explanation: string;
};

const templates: Template[] = [
  {
    topic: "מהו נעלם?", level: 0, title: "מוצאים את המספר בקופסה",
    teachingNote: "X הוא רק מקום שמחזיק מספר שאנחנו עדיין לא יודעים.",
    prompt: (n) => `X + ${n} = ${n + 2}. איזה מספר נמצא במקום X?`,
    answer: () => "2",
    hint1: "חשוב: איזה מספר ועוד המספר הקטן בצד נותן את התוצאה?",
    hint2: "אפשר לחשוב הפוך: קח את התוצאה והורד ממנה את המספר שנוסף ל-X.",
    explanation: "מצוין. מצאנו את המספר שמסתתר במקום X.",
  },
  {
    topic: "חיבור וחיסור במשוואות", level: 0, title: "מחזירים את מה שנוסף",
    teachingNote: "כדי לגלות את X, אנחנו יכולים להשתמש בפעולה ההפוכה לזו שנעשתה עליו.",
    prompt: (n) => `X + ${n} = ${n + 3}. איזה מספר הוא X?`,
    answer: () => "3",
    hint1: "איזה מספר צריך להוסיף למספר הראשון כדי להגיע לתוצאה?",
    hint2: "אפשר לחשוב על המרחק בין שני המספרים.",
    explanation: "נכון. ההפרש בין התוצאה למספר שנוסף הוא X.",
  },
  {
    topic: "כפל במשוואות", level: 0, title: "מוצאים X בכפל",
    teachingNote: "כשמספר מוכפל ב-X, אפשר לחשוב כמה פעמים צריך את X כדי להגיע לתוצאה.",
    prompt: (n) => `2 × X = ${n * 2}. איזה מספר הוא X?`,
    answer: (n) => String(n),
    hint1: "איזה מספר כפול 2 נותן את התוצאה?",
    hint2: "אפשר לחלק את התוצאה ל-2 כדי לחזור ל-X.",
    explanation: "יפה. השתמשת בפעולה ההפוכה לכפל.",
  },
  {
    topic: "חילוק במשוואות", level: 0, title: "מחזירים את X",
    teachingNote: "כש-X מחולק במספר, כפל יכול לעזור לנו לחזור למספר המקורי.",
    prompt: (n) => `X ÷ 2 = ${n}. איזה מספר הוא X?`,
    answer: (n) => String(n * 2),
    hint1: "אם X חולק ל-2 חלקים שווים וקיבלנו את התוצאה, כמה היה לפני החלוקה?",
    hint2: "נסה לעשות את הפעולה ההפוכה לחילוק.",
    explanation: "מצוין. כפל ב-2 מחזיר אותנו ל-X.",
  },
];

export function generateExercise(topic: string, seed: number): GeneratedExercise | null {
  const pool = templates.filter((template) => template.topic === topic);
  if (!pool.length) return null;
  const template = pool[seed % pool.length];
  const n = 2 + (seed % 7);
  return {
    id: `generated-${topic}-${seed}`,
    topic: template.topic,
    level: template.level,
    title: template.title,
    teachingNote: template.teachingNote,
    prompt: template.prompt(n),
    accepted: [template.answer(n)],
    hint1: template.hint1,
    hint2: template.hint2,
    explanation: template.explanation,
    generated: true,
  };
}

export function generateReinforcement(topic: string, seed: number): GeneratedExercise | null {
  return generateExercise(topic, seed + 1);
}
