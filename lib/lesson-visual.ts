import type { Exercise } from "./curriculum";

export function isExponentLesson(exercise: Pick<Exercise, "id" | "topic">): boolean {
  return exercise.topic === "חזקות";
}

export function isElectricalLesson(exercise: Pick<Exercise, "id" | "topic">): boolean {
  // The IDs for exponent lessons include "power", but they are not electrical lessons.
  return !isExponentLesson(exercise) && /ohm|power|חשמל/i.test(`${exercise.id} ${exercise.topic}`);
}

export type FractionVisual =
  | { kind: "bar"; heading: string; count: number; filled: number; label: string; caption: string }
  | { kind: "equation"; heading: string; label: string; caption: string };

export function fractionVisualForExercise(exercise: Pick<Exercise, "id"> & Partial<Pick<Exercise, "topic" | "prompt">>): FractionVisual {
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
  if (exercise.topic === "שברים" && exercise.prompt) {
    const onePart = exercise.prompt.match(/חלק אחד מתוך (\d+) חלקים/);
    if (onePart) {
      const count = Number(onePart[1]);
      return {
        kind: "bar",
        heading: `חלק אחד מתוך ${count} חלקים שווים`,
        count,
        filled: 1,
        label: `1/${count}`,
        caption: `השלם מחולק ל־${count} חלקים שווים, ואנחנו מסמנים חלק אחד.`,
      };
    }
  }
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
  if (["formula-1", "formula-2", "ohm-2"].includes(exercise.id)) {
    return {
      heading: "מוצאים התנגדות לפי חוק אוהם",
      lhs: "R", operator: "=", rhs: "V ÷ I",
      legend: ["R = התנגדות (אוהם)", "V = מתח (וולט)", "I = זרם (אמפר)"],
      caption: "כדי למצוא התנגדות, מחלקים את המתח בזרם: R = V ÷ I."
    };
  }
  if (["formula-3", "ohm-1", "electrical-ohm-sub-1"].includes(exercise.id)) {
    return {
      heading: "מוצאים זרם לפי חוק אוהם",
      lhs: "I", operator: "=", rhs: "V ÷ R",
      legend: ["I = זרם (אמפר)", "V = מתח (וולט)", "R = התנגדות (אוהם)"],
      caption: "כדי למצוא זרם, מחלקים את המתח בהתנגדות: I = V ÷ R."
    };
  }
  if (exercise.id === "electrical-power-sub-1") {
    return {
      heading: "מוצאים זרם מתוך הספק ומתח",
      lhs: "I", operator: "=", rhs: "P ÷ V",
      legend: ["I = זרם (אמפר)", "P = הספק (וואט)", "V = מתח (וולט)"],
      caption: "כדי למצוא זרם, מחלקים את ההספק במתח: I = P ÷ V."
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

export function isElectricalPowerLesson(exercise: Pick<Exercise, "id" | "topic">): boolean {
  return isElectricalLesson(exercise) &&
    (exercise.topic === "חשמל — הספק" || exercise.id.includes("electrical-power"));
}

export type PercentageVisual = {
  heading: string;
  expression: string;
  caption: string;
};

export function percentageVisualForExercise(
  exercise: Pick<Exercise, "prompt">,
): PercentageVisual {
  const match = exercise.prompt.match(/כמה זה\s+(\d+(?:[.,]\d+)?)%\s*מתוך\s*(\d+(?:[.,]\d+)?)/);
  if (!match) {
    return {
      heading: "מחשבים אחוז מתוך כמות",
      expression: "אחוז × כמות ÷ 100",
      caption: "מכפילים את הכמות באחוזים ומחלקים ב־100.",
    };
  }

  const percent = Number(match[1].replace(",", "."));
  const total = Number(match[2].replace(",", "."));
  const result = Number(((percent * total) / 100).toFixed(8)).toString();
  const totalLabel = Number(total.toFixed(8)).toString();
  const percentLabel = Number(percent.toFixed(8)).toString();
  return {
    heading: "מחשבים אחוז מתוך כמות",
    expression: `${percentLabel}% × ${totalLabel} ÷ 100 = ${result}`,
    caption: `מכפילים ${totalLabel} ב־${percentLabel} ומחלקים ב־100. התוצאה היא ${result}.`,
  };
}

export type DecimalVisual = {
  heading: string;
  expression: string;
  caption: string;
};

export function decimalVisualForExercise(
  exercise: Pick<Exercise, "prompt">,
): DecimalVisual {
  const match = exercise.prompt.match(/מה הערך של\s+(\d+(?:[.,]\d+)?)\s*([+−-])\s*(\d+(?:[.,]\d+)?)/);
  if (!match) {
    return {
      heading: "חישוב מספרים עשרוניים",
      expression: "שומרים על הערך של הספרות אחרי הנקודה",
      caption: "בצעו את הפעולה שבתרגיל ושמרו על מיקום הנקודה העשרונית.",
    };
  }

  const left = Number(match[1].replace(",", "."));
  const right = Number(match[3].replace(",", "."));
  const operator = match[2] === "+" ? "+" : "−";
  const result = Number((match[2] === "+" ? left + right : left - right).toFixed(8)).toString();
  const leftLabel = Number(left.toFixed(8)).toString();
  const rightLabel = Number(right.toFixed(8)).toString();
  return {
    heading: "חישוב מספרים עשרוניים",
    expression: `${leftLabel} ${operator} ${rightLabel} = ${result}`,
    caption: `שומרים על הערך של הספרות אחרי הנקודה: ${leftLabel} ${operator} ${rightLabel} = ${result}.`,
  };
}

export type EquationLabModel = {
  expression: string;
  rhs: number;
  answer: number;
  coefficient: number;
  offset: number;
  explanation: string;
};

export function equationLabModelForExercise(
  exercise: Pick<Exercise, "prompt">,
): EquationLabModel | null {
  const prompt = exercise.prompt;
  const twoStepAddition = prompt.match(/(\d+)\s*[×x]\s*X\s*\+\s*(\d+)\s*=\s*(\d+)/);
  if (twoStepAddition) {
    const coefficient = Number(twoStepAddition[1]);
    const offset = Number(twoStepAddition[2]);
    const rhs = Number(twoStepAddition[3]);
    const answer = Number(((rhs - offset) / coefficient).toFixed(8));
    return {
      expression: twoStepAddition[1] + " × X + " + twoStepAddition[2],
      rhs,
      answer,
      coefficient,
      offset,
      explanation: "מציבים את הערך במקום X ובודקים את שני אגפי המשוואה. הפתרון הוא X = " + answer + ".",
    };
  }

  const twoStepSubtraction = prompt.match(/(\d+)\s*[×x]\s*X\s*[−-]\s*(\d+)\s*=\s*(\d+)/);
  if (twoStepSubtraction) {
    const coefficient = Number(twoStepSubtraction[1]);
    const offset = -Number(twoStepSubtraction[2]);
    const rhs = Number(twoStepSubtraction[3]);
    const answer = Number(((rhs - offset) / coefficient).toFixed(8));
    return {
      expression: twoStepSubtraction[1] + " × X − " + twoStepSubtraction[2],
      rhs,
      answer,
      coefficient,
      offset,
      explanation: "מציבים את הערך במקום X ובודקים את שני אגפי המשוואה. הפתרון הוא X = " + answer + ".",
    };
  }
  let expression: string;
  let coefficient: number;
  let offset: number;
  let rhs: number;
  let match: RegExpMatchArray | null;

  match = prompt.match(/X\s*\+\s*(\d+)\s*=\s*(\d+)/);
  if (match) {
    expression = `X + ${match[1]}`;
    coefficient = 1;
    offset = Number(match[1]);
    rhs = Number(match[2]);
  } else if ((match = prompt.match(/X\s*[−-]\s*(\d+)\s*=\s*(\d+)/))) {
    expression = `X − ${match[1]}`;
    coefficient = 1;
    offset = -Number(match[1]);
    rhs = Number(match[2]);
  } else if ((match = prompt.match(/(\d+)\s*[×x]\s*X\s*\+\s*(\d+)\s*=\s*(\d+)/))) {
    expression = `${match[1]} × X + ${match[2]}`;
    coefficient = Number(match[1]);
    offset = Number(match[2]);
    rhs = Number(match[3]);
  } else if ((match = prompt.match(/(\d+)\s*[×x]\s*X\s*[−-]\s*(\d+)\s*=\s*(\d+)/))) {
    expression = `${match[1]} × X − ${match[2]}`;
    coefficient = Number(match[1]);
    offset = -Number(match[2]);
    rhs = Number(match[3]);
  } else if ((match = prompt.match(/(\d+)\s*[×x]\s*X\s*=\s*(\d+)/))) {
    expression = `${match[1]} × X`;
    coefficient = Number(match[1]);
    offset = 0;
    rhs = Number(match[2]);
  } else if ((match = prompt.match(/X\s*[÷/]\s*(\d+)\s*=\s*(\d+)/))) {
    expression = `X ÷ ${match[1]}`;
    coefficient = 1 / Number(match[1]);
    offset = 0;
    rhs = Number(match[2]);
  } else {
    return null;
  }

  if (!Number.isFinite(coefficient) || coefficient === 0) return null;
  const answer = Number(((rhs - offset) / coefficient).toFixed(8));
  return {
    expression,
    rhs,
    answer,
    coefficient,
    offset,
    explanation: `מציבים את הערך במקום X ובודקים את שני אגפי המשוואה. הפתרון הוא X = ${answer}.`,
  };
}

export type FractionLabDefaults = {
  numerator: number;
  denominator: number;
};

export function fractionLabDefaultsForExercise(exercise: Pick<Exercise, "id">): FractionLabDefaults {
  if (exercise.id === "fraction-reduce-1") return { numerator: 4, denominator: 8 };
  if (exercise.id === "fraction-reduce-2") return { numerator: 6, denominator: 9 };
  return { numerator: 12, denominator: 6 };
}

export type AreaLabDefaults = {
  length: number;
  width: number;
};

export function areaLabDefaultsForExercise(exercise: Pick<Exercise, "id">): AreaLabDefaults {
  if (exercise.id === "geometry-area-rectangle-1") return { length: 6, width: 3 };
  if (exercise.id === "geometry-area-square-1") return { length: 5, width: 5 };
  return { length: 5, width: 3 };
}

export type ReducedFraction = {
  numerator: number;
  denominator: number;
};

export function reduceFractionForLab(numerator: number, denominator: number): ReducedFraction {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator === 0) {
    return { numerator, denominator };
  }
  let a = Math.abs(numerator);
  let b = Math.abs(denominator);
  while (b !== 0) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  const divisor = a || 1;
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  };
}

export type ElectricalLabDefaults = {
  first: number;
  second: number;
};

export function electricalLabDefaultsForExercise(exercise: Pick<Exercise, "id">): ElectricalLabDefaults {
  if (exercise.id === "electrical-power-sub-1") return { first: 60, second: 12 };
  return { first: 12, second: 6 };
}
