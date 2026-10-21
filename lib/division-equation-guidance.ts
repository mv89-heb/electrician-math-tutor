export type DivisionEquationGuidance = {
  question: string;
  correct: string;
  options: string[];
  explanation: string;
};

export function divisionEquationGuidance(prompt: string): DivisionEquationGuidance | null {
  const match = prompt.match(/X\\s*[÷/]\\s*\\(?(-?\\d+)\\)?\\s*=/);
  if (!match) return null;

  const divisor = Number(match[1]);
  if (!Number.isFinite(divisor) || divisor === 0) return null;
  const divisorLabel = divisor < 0 ? "(" + divisor + ")" : String(divisor);
  const correct = "לכפול את שני האגפים ב־" + divisorLabel + " כדי לבודד את X";
  return {
    question: "איך מבטלים את החילוק ליד X?",
    correct,
    options: [
      correct,
      "לחלק שוב ב־" + divisorLabel,
      "להוסיף " + divisorLabel + " לשני האגפים",
    ],
    explanation: "הפעולה ההפוכה לחילוק ב־" + divisorLabel + " היא כפל ב־" + divisorLabel + ".",
  };
}
