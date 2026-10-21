export type FormulaSubjectGuidance = {
  question: string;
  correct: string;
  options: string[];
  explanation: string;
};

export function formulaSubjectGuidance(exerciseId: string): FormulaSubjectGuidance | null {
  if (exerciseId === "formula-subject-1") {
    const correct = "לחלק את שני האגפים ב־B";
    return {
      question: "איזו פעולה תבודד את C בנוסחה A = B × C?",
      correct,
      options: [correct, "לכפול את שני האגפים ב־B", "להחסיר B משני האגפים"],
      explanation: "מחלקים את שני האגפים ב־B ומקבלים C = A ÷ B, כאשר B אינו אפס.",
    };
  }
  if (exerciseId === "formula-subject-2") {
    const correct = "לחלק את שני האגפים ב־L";
    return {
      question: "איזו פעולה תבודד את W בנוסחה A = L × W?",
      correct,
      options: [correct, "לכפול את שני האגפים ב־L", "להחסיר L משני האגפים"],
      explanation: "מחלקים את שני האגפים ב־L ומקבלים W = A ÷ L, כאשר L אינו אפס.",
    };
  }
  return null;
}
