export type BasicFormulaGuidance = {
  question: string;
  correct: string;
  options: string[];
  explanation: string;
};

export function basicFormulaGuidance(exerciseId: string): BasicFormulaGuidance | null {
  if (exerciseId === "formula-1b") {
    return {
      question: "איזו אות מייצגת את המתח בנוסחה V = I × R?",
      correct: "V — מתח",
      options: ["V — מתח", "I — זרם", "R — התנגדות"],
      explanation: "V היא האות שמייצגת מתח חשמלי, והוא נמדד בוולט.",
    };
  }
  if (exerciseId === "formula-1") {
    return {
      question: "איזו אות מייצגת את ההתנגדות שאותה רוצים למצוא?",
      correct: "R — התנגדות",
      options: ["R — התנגדות", "V — מתח", "I — זרם"],
      explanation: "V ו־I ידועים, ולכן מחפשים את R — ההתנגדות. לפי חוק אוהם, R = V ÷ I.",
    };
  }
  if (exerciseId === "formula-2") {
    return {
      question: "איזו פעולה הפוכה לכפל ב־I תבודד את R?",
      correct: "לחלק את שני האגפים ב־I",
      options: ["לחלק את שני האגפים ב־I", "לכפול את שני האגפים ב־I", "להוסיף I לשני האגפים"],
      explanation: "V = I × R. מחלקים את שני האגפים ב־I ומקבלים R = V ÷ I, כאשר I אינו אפס.",
    };
  }
  if (exerciseId === "formula-3") {
    return {
      question: "איזו פעולה הפוכה לכפל ב־R תבודד את I?",
      correct: "לחלק את שני האגפים ב־R",
      options: ["לחלק את שני האגפים ב־R", "לכפול את שני האגפים ב־R", "להחסיר R משני האגפים"],
      explanation: "V = I × R. מחלקים את שני האגפים ב־R ומקבלים I = V ÷ R, כאשר R אינו אפס.",
    };
  }
  return null;
}
