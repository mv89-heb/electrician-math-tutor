import type { Exercise } from "./curriculum";

export type FractionGuidance = {
  question: string;
  correct: string;
  options: string[];
  explanation: string;
};

export function fractionGuidanceForExercise(
  exercise: Pick<Exercise, "id" | "prompt">,
): FractionGuidance | null {
  const prompt = exercise.prompt;

  if (/צמצם|צמצום/.test(prompt)) {
    const correct = "לחלק את המונה והמכנה באותו מספר";
    return {
      question: "איך מצמצמים שבר בלי לשנות את הערך שלו?",
      correct,
      options: [correct, "לחלק רק את המונה", "לחסר את המכנה מהמונה"],
      explanation: "מחלקים גם את המונה וגם את המכנה באותו מספר שאינו אפס, ולכן ערך השבר נשאר זהה.",
    };
  }

  if (exercise.id === "fraction-common-1") {
    const correct = "להמיר את השברים למכנה משותף לפני החיבור";
    return {
      question: "מה צריך לעשות לפני שמחברים שברים עם מכנים שונים?",
      correct,
      options: [correct, "לחבר את המכנים", "לחבר את המונים בלי לשנות את המכנים"],
      explanation: "ממירים את השברים לשברים שקולים עם אותו מכנה, ורק אז מחברים את המונים.",
    };
  }

  if (/\d+\s*\/\s*\d+\s*÷\s*\d+\s*\/\s*\d+/.test(prompt)) {
    const correct = "להפוך את השבר השני ולהחליף חילוק בכפל";
    return {
      question: "איך מחלקים שבר בשבר?",
      correct,
      options: [correct, "לחלק מונה במונה ומכנה במכנה", "לחבר את שני השברים"],
      explanation: "משאירים את השבר הראשון, הופכים את השבר השני ומכפילים.",
    };
  }

  if (/\d+\s*\/\s*\d+\s*×\s*\d+\s*\/\s*\d+/.test(prompt)) {
    const correct = "לכפול מונה במונה ומכנה במכנה";
    return {
      question: "איך כופלים שני שברים?",
      correct,
      options: [correct, "לחבר את המונים ולהשאיר את המכנה", "להפוך את השבר השני ולחלק"],
      explanation: "מכפילים את המונים זה בזה ואת המכנים זה בזה, ואז אפשר לצמצם את התוצאה.",
    };
  }

  const sameDenominatorAddition = prompt.match(/(\d+)\s*\/\s*(\d+)\s*\+\s*(\d+)\s*\/\s*(\d+)/);
  if (sameDenominatorAddition && sameDenominatorAddition[2] === sameDenominatorAddition[4]) {
    const correct = "לחבר את המונים ולהשאיר את המכנה כפי שהוא";
    return {
      question: "איך מחברים שברים עם אותו מכנה?",
      correct,
      options: [correct, "לחבר גם את המכנים", "להכפיל את המונים"],
      explanation: "מחברים את המונים בלבד ומשאירים את המכנה המשותף ללא שינוי.",
    };
  }

  const sameDenominatorSubtraction = prompt.match(/(\d+)\s*\/\s*(\d+)\s*[−-]\s*(\d+)\s*\/\s*(\d+)/);
  if (sameDenominatorSubtraction && sameDenominatorSubtraction[2] === sameDenominatorSubtraction[4]) {
    const correct = "לחסר את המונים ולהשאיר את המכנה כפי שהוא";
    return {
      question: "איך מחסרים שברים עם אותו מכנה?",
      correct,
      options: [correct, "לחסר גם את המכנים", "לחסר את המכנה מהמונה"],
      explanation: "מחסרים את המונים בלבד ומשאירים את המכנה המשותף ללא שינוי.",
    };
  }

  return null;
}
