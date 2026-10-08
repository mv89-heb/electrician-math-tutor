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
    hint1: "חשוב: איזה מספר ועוד המספר הקטן בצד נותן את התוצאה?",
    hint2: "אפשר לחשוב הפוך: קח את התוצאה והורד ממנה את המספר שנוסף ל-X.",
    explanation: "מצוין. מצאנו את המספר שמסתתר במקום X.",
  },
  {
    topic: "חיבור וחיסור במשוואות", level: 0, title: "מחזירים את מה שנוסף",
    teachingNote: "כדי לגלות את X, אנחנו יכולים להשתמש בפעולה ההפוכה לזו שנעשתה עליו.",
    prompt: (n) => `X + ${n} = ${n + 3}. איזה מספר הוא X?`,
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
    topic: "מספרים עשרוניים", level: 0, title: "תרגול עשרוני",
    teachingNote: "מספרים עשרוניים מאפשרים לנו לכתוב חלקים של שלם בצורה נוחה.",
    prompt: () => "מה הערך של 0.5 + 0.5?",
    hint1: "שני חצאים יוצרים שלם.",
    hint2: "0.5 הוא חצי. כמה חצאים יש לך?",
    explanation: "נכון. 0.5 + 0.5 = 1.",
  },
  {
    topic: "אחוזים", level: 1, title: "תרגול אחוזים",
    teachingNote: "אחוז הוא חלק מתוך 100.",
    prompt: () => "כמה זה 10% מתוך 100?",
    hint1: "10% פירושו 10 מתוך 100.",
    hint2: "כשיש בדיוק 100, האחוז והמספר זהים.",
    explanation: "נכון. 10% מתוך 100 הם 10.",
  },
  {
    topic: "שברים", level: 0, title: "שבר קטן לתרגול",
    teachingNote: "שבר הוא חלק מתוך שלם. המספר למעלה אומר כמה חלקים יש לנו.",
    prompt: (n) => `איזה שבר מתאר ${n} חלק מתוך 2 חלקים שווים?`,
    hint1: "החלק שאנחנו מחפשים הוא חצי.",
    hint2: "כתוב את המספר 1 למעלה ואת המספר 2 למטה.",
    explanation: "נכון. זהו שבר שמתאר חצי.",
  },
  {
    topic: "חזקות", level: 1, title: "חזקה ככפל חוזר",
    teachingNote: "חזקה היא דרך קצרה לכתוב כפל של מספר בעצמו.",
    prompt: (n) => `מה הערך של ${n}²?`,
    answer: (n) => String(n * n),
    hint1: "החזקה 2 אומרת לכפול את המספר בעצמו.",
    hint2: "חשב את המספר כפול אותו מספר.",
    explanation: "מצוין. הפכת חזקה לכפל פשוט.",
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

export function generateReinforcement(topic: string, seed: number, errorType?: "sign" | "operation" | "unknown" | "unit" | "arithmetic" | "concept"): GeneratedExercise | null {
  if (!errorType) return generateExercise(topic, seed);

  const n = 2 + (seed % 6);
  const targeted: Record<string, GeneratedExercise> = {
    sign: {
      id: `generated-${topic}-sign-${seed}`, topic, level: 0, title: "חיזוק סימנים",
      teachingNote: "הפעם נתמקד רק בסימן. הסימן אומר לנו איזו פעולה לבצע.",
      prompt: `X − ${n} = ${n + 2}. איזה מספר הוא X?`,
      accepted: [String(n + 2 + n)],
      hint1: "שים לב: כאן יש סימן חיסור.",
      hint2: `כדי לבטל חיסור של ${n}, הוסף ${n} לתוצאה.`,
      explanation: `נכון. ${n + 2} + ${n} = ${n + 2 + n}, ולכן X = ${n + 2 + n}.`, generated: true,
    },
    operation: {
      id: `generated-${topic}-operation-${seed}`, topic, level: 0, title: "חיזוק הפעולה ההפוכה",
      teachingNote: "כדי למצוא את X, נשתמש בפעולה ההפוכה לפעולה שנעשתה עליו.",
      prompt: `${n} × X = ${n * 4}. איזה מספר הוא X?`,
      accepted: ["4"],
      hint1: "מה הפעולה שנעשתה על X?",
      hint2: `כדי לבטל כפל ב־${n}, חלק את התוצאה ב־${n}.`,
      explanation: `נכון. ${n * 4} ÷ ${n} = 4.`, generated: true,
    },
    arithmetic: {
      id: `generated-${topic}-arithmetic-${seed}`, topic, level: 0, title: "חיזוק דיוק בחישוב",
      teachingNote: "נפתור לאט, שלב אחד בכל פעם, ונבדוק את התוצאה לפני השליחה.",
      prompt: `${n} + ${n + 3} = ?`,
      accepted: [String(n + n + 3)],
      hint1: "חבר את המספרים בלי לדלג על שלב.",
      hint2: `התחל מ־${n} והוסף אליו ${n + 3}.`,
      explanation: `נכון. ${n} + ${n + 3} = ${n + n + 3}.`, generated: true,
    },
    unit: {
      id: `generated-${topic}-unit-${seed}`, topic: "נוסחאות בסיסיות", level: 1, title: "חיזוק יחידות חשמל",
      teachingNote: "בחשמל חשוב לזהות גם את הגודל וגם את היחידה שלו.",
      prompt: "איזו יחידה מתאימה לזרם חשמלי: V, A או Ω?",
      accepted: ["A", "a", "אמפר"],
      hint1: "חשוב על האות I בחוק אוהם.",
      hint2: "זרם נמדד באמפר.",
      explanation: "נכון. זרם חשמלי נמדד באמפר, והסימון הוא A.",
      generated: true,
    },
    concept: {
      id: `generated-${topic}-concept-${seed}`, topic, level: 0, title: "חיזוק הבנת הנעלם",
      teachingNote: "לפני החישוב נזהה מה ידוע ומה אנחנו מחפשים.",
      prompt: "במשוואה X + 3 = 7, מהו הנעלם?",
      accepted: ["X", "x"],
      hint1: "איזה סימן מייצג את המספר שאנחנו עדיין לא יודעים?",
      hint2: "חפש את האות שמייצגת את המספר החסר.",
      explanation: "נכון. X הוא הנעלם שאנחנו רוצים למצוא.",
      generated: true,
    },
    unknown: {
      id: `generated-${topic}-unknown-${seed}`, topic, level: 0, title: "חיזוק מציאת הנעלם",
      teachingNote: "נפרק את התרגיל לצעד אחד פשוט ונמצא את המספר החסר.",
      prompt: `X + ${n} = ${n + 5}. איזה מספר הוא X?`,
      accepted: ["5"],
      hint1: "איזה מספר ועוד המספר שבצד נותן את התוצאה?",
      hint2: `חשב ${n + 5} − ${n}.`,
      explanation: "נכון. המספר שנשאר הוא 5.",
      generated: true,
    },
  };

  return targeted[errorType] ?? generateExercise(topic, seed);
}
