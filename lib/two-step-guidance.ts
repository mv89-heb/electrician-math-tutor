export type TwoStepGuidance = {
  question: string;
  correct: string;
  options: string[];
  explanation: string;
};

/**
 * For equations of the form a × X ± b = c, remove the additive term first.
 * Dividing by a before undoing the addition/subtraction teaches the wrong order.
 */
export function twoStepEquationGuidance(prompt: string): TwoStepGuidance | null {
  const match = prompt.match(/(\d+)\s*[×x]\s*X\s*([+−-])\s*(\d+)\s*=/);
  if (!match) return null;

  const factor = Number(match[1]);
  const operator = match[2];
  const constant = Number(match[3]);
  if (operator === "+") {
    const correct = `לחסר ${constant} משני האגפים לפני שמחלקים במקדם של X`;
    return {
      question: "מה צריך לבטל קודם כדי לבודד את X?",
      correct,
      options: [
        correct,
        `לחלק מיד ב־${factor} לפני שמבטלים את החיבור`,
        `להוסיף ${constant} לשני האגפים`,
      ],
      explanation: `קודם מחסרים ${constant} משני האגפים, ואז מחלקים ב־${factor} כדי לבודד את X.`,
    };
  }

  const correct = `להוסיף ${constant} לשני האגפים לפני שמחלקים במקדם של X`;
  return {
    question: "מה צריך לבטל קודם כדי לבודד את X?",
    correct,
    options: [
      correct,
      `לחלק מיד ב־${factor} לפני שמבטלים את החיסור`,
      `לחסר ${constant} משני האגפים`,
    ],
    explanation: `קודם מוסיפים ${constant} לשני האגפים, ואז מחלקים ב־${factor} כדי לבודד את X.`,
  };
}
