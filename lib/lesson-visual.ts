import type { Exercise } from "./curriculum";

export function isExponentLesson(exercise: Pick<Exercise, "id" | "topic">): boolean {
  return exercise.topic === "חזקות";
}

export type FractionVisual =
  | { kind: "bar"; heading: string; count: number; filled: number; label: string; caption: string }
  | { kind: "equation"; heading: string; label: string; caption: string };

export function fractionVisualForExercise(exercise: Pick<Exercise, "id">): FractionVisual {
  const visuals: Record<string, FractionVisual> = {
    "fraction-1": { kind: "bar", heading: "חלק אחד מתוך שניים", count: 2, filled: 1, label: "1/2", caption: "המונה הוא 1 והמכנה הוא 2." },
    "fraction-2": { kind: "equation", heading: "שני חצאים יוצרים שלם", label: "1/2 + 1/2 = 1", caption: "כשמחברים שני חצאים מקבלים שלם אחד." },
    "fraction-3": { kind: "bar", heading: "שני חלקים מתוך שלושה", count: 3, filled: 2, label: "2/3", caption: "המונה מציין שני חלקים; המכנה מציין שלושה חלקים שווים." },
    "fraction-reduce-1": { kind: "bar", heading: "מצמצמים בלי לשנות את הערך", count: 8, filled: 4, label: "4/8 = 1/2", caption: "ארבעה מתוך שמונה חלקים הם חצי מהשלם." },
    "fraction-reduce-2": { kind: "bar", heading: "צמצום שבר נוסף", count: 9, filled: 6, label: "6/9 = 2/3", caption: "שישה מתוך תשעה חלקים שווים לשני שלישים." },
    "fraction-add-same-1": { kind: "equation", heading: "מחברים מונים, המכנה נשאר", label: "2/7 + 3/7 = 5/7", caption: "המכנה נשאר 7; מחברים 2 + 3 במונה." },
    "fraction-sub-same-1": { kind: "equation", heading: "מחסרים מונים, המכנה נשאר", label: "5/8 − 2/8 = 3/8", caption: "המכנה נשאר 8; מחסרים 5 − 2 במונה." },
    "fraction-common-1": { kind: "equation", heading: "יוצרים מכנה משותף", label: "1/2 + 1/4 = 2/4 + 1/4 = 3/4", caption: "ממירים חצי לשני רבעים ורק אז מחברים." },
    "fraction-multiply-1": { kind: "equation", heading: "כפל שברים", label: "1/2 × 2/3 = 2/6 = 1/3", caption: "מכפילים מונה במונה ומכנה במכנה, ואז מצמצמים." },
    "fraction-divide-1": { kind: "equation", heading: "חילוק שברים", label: "1/2 ÷ 1/4 = 1/2 × 4/1 = 2", caption: "הופכים את השבר השני ומחליפים חילוק בכפל." }
  };
  return visuals[exercise.id] ?? { kind: "equation", heading: "עובדים עם השברים שבתרגיל", label: "קראו את השבר ופעלו לפי ההוראות", caption: "שימו לב למונה, למכנה ולפעולה המבוקשת." };
}

export type FormulaVisual = {
  heading: string;
  lhs: string;
  operator: string;
  rhs: string;
  legend: string[];
  caption: string;
};

export function formulaVisualForExercise(exercise: Pick<Exercise, "id" | "topic">): FormulaVisual {
  if (exercise.id === "formula-subject-1") {
    return {
      heading: "מבודדים משתנה בנוסחה",
      lhs: "A", operator: "=", rhs: "B × C",
      legend: ["A = התוצאה", "B ו־C = גורמים בנוסחה"],
      caption: "כדי לבודד את C, מחלקים את שני אגפי A = B × C ב־B (כאשר B אינו אפס): C = A/B."
    };
  }
  if (exercise.id === "formula-subject-2") {
    return {
      heading: "מבודדים רוחב בנוסחת שטח",
      lhs: "A", operator: "=", rhs: "L × W",
      legend: ["A = שטח", "L = אורך", "W = רוחב"],
      caption: "כדי למצוא רוחב, מחלקים את השטח באורך: W = A/L."
    };
  }
  if (exercise.topic === "חשמל — הספק") {
    return {
      heading: "נוסחת ההספק החשמלי",
      lhs: "P", operator: "=", rhs: "V × I",
      legend: ["P = הספק (וואט)", "V = מתח (וולט)", "I = זרם (אמפר)"],
      caption: "מכפילים את המתח בזרם כדי לחשב את ההספק."
    };
  }
  return {
    heading: "חוק אוהם",
    lhs: "V", operator: "=", rhs: "I × R",
    legend: ["V = מתח (וולט)", "I = זרם (אמפר)", "R = התנגדות (אוהם)"],
    caption: "מזהים מה נתון ומה מחפשים, ואז מסדרים את חוק אוהם בהתאם."
  };
}

export type UnitConversionVisual = {
  heading: string;
  expression: string;
  caption: string;
};

export function unitConversionVisualForExercise(exercise: Pick<Exercise, "id">): UnitConversionVisual {
  if (exercise.id === "units-mm-cm-1") {
    return {
      heading: "ממירים מילימטרים לסנטימטרים",
      expression: "35 מ״מ ÷ 10 = 3.5 ס״מ",
      caption: "בכל סנטימטר יש 10 מילימטרים, לכן מחלקים ב־10."
    };
  }
  if (exercise.id === "units-cm-m-1") {
    return {
      heading: "ממירים סנטימטרים למטרים",
      expression: "250 ס״מ ÷ 100 = 2.5 מטר",
      caption: "בכל מטר יש 100 סנטימטרים, לכן מחלקים ב־100."
    };
  }
  return {
    heading: "המרת יחידות אורך",
    expression: "בודקים כמה יחידות קטנות יש ביחידה הגדולה",
    caption: "בחרו את פעולת ההמרה לפי היחידות הנתונות."
  };
}
