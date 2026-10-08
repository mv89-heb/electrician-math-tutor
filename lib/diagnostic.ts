import { answerMatches } from "./answer-checker";

export type DiagnosticSkill = "חיבור" | "חיסור" | "כפל" | "חילוק" | "נעלם" | "נוסחה";

export type DiagnosticQuestion = {
  id: string;
  skill: DiagnosticSkill;
  prompt: string;
  accepted: string[];
  encouragement: string;
};

export const diagnosticQuestions: DiagnosticQuestion[] = [
  { id:"add", skill:"חיבור", prompt:"חימום: כמה זה 2 + 3?", accepted:["5"], encouragement:"מצוין. אנחנו רק בודקים מה כבר יושב לך טוב." },
  { id:"subtract", skill:"חיסור", prompt:"כמה זה 7 − 3?", accepted:["4"], encouragement:"טוב מאוד. ממשיכים בעדינות." },
  { id:"multiply", skill:"כפל", prompt:"כמה זה 2 × 4?", accepted:["8"], encouragement:"יפה. כפל הוא פשוט חיבור חוזר." },
  { id:"divide", skill:"חילוק", prompt:"כמה זה 8 ÷ 2?", accepted:["4"], encouragement:"מצוין. חילוק הוא חלוקה לקבוצות שוות." },
  { id:"unknown", skill:"נעלם", prompt:"X + 2 = 5. מהו X?", accepted:["3"], encouragement:"יפה. כאן אנחנו כבר מתחילים לפתוח את הקופסה של X." },
  { id:"formula", skill:"נוסחה", prompt:"בנוסחה V = I × R, איזו אות מייצגת את ההתנגדות?", accepted:["R","r"], encouragement:"מצוין. עכשיו אפשר להתחיל לחבר את המתמטיקה לעולם החשמל." },
];

export function diagnosticAnswerIsCorrect(answer: string, question: DiagnosticQuestion) {
  return answerMatches(answer, question.accepted);
}
