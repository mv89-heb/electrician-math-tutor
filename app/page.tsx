"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, Lightbulb, RotateCcw, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { curriculum, firstExercise, type Exercise } from "../lib/curriculum";
import { diagnosticAnswerIsCorrect, diagnosticQuestions } from "../lib/diagnostic";
import { buildCheckpoint, checkpointPasses, shouldRunCheckpoint, type CheckpointQuestion } from "../lib/checkpoints";
import { chooseNextExercise, emptyLearningState, loadLearningState, recordAttempt, saveLearningState, topicMastery, recommendedStartingIndex, resolveExercise, dueReviewIds, classifyError, canStartMasteryTest, recordMasteryTest, recordFinalExam, type LearningState } from "../lib/learning";
import { buildTopicMasteryTest, masteryPasses, type MasteryQuestion } from "../lib/mastery";
import { answerMatches, normalizeAnswer } from "../lib/answer-checker";
import { buildFinalExam, finalExamPasses, FINAL_EXAM_REQUIRED, FINAL_EXAM_TOTAL, type FinalExamQuestion } from "../lib/final-exam";
import { ElectricalMiniSimulator } from "../components/ElectricalMiniSimulator";
import { stageForExercise, stageGateSatisfied, stageProgress, stageExercises } from "../lib/stages";

const topics = [...new Set(curriculum.map((exercise) => exercise.topic))];

function normalize(value: string) {
  return normalizeAnswer(value);
}

function isCorrect(answer: string, exercise: Exercise) {
  return answerMatches(answer, exercise.accepted);
}

function MathPrompt({ prompt }: { prompt: string }) {
  const expressionPattern = /(?:[A-Za-z0-9]+\\s*)?(?:[=+\\-−×÷*/]\\s*[A-Za-z0-9]+(?:\\s*[=+\\-−×÷*/]\\s*[A-Za-z0-9]+)*)/g;
  const parts: Array<{ type: "text" | "math"; value: string }> = [];
  let lastIndex = 0;

  for (const match of prompt.matchAll(expressionPattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) parts.push({ type: "text", value: prompt.slice(lastIndex, index) });
    parts.push({ type: "math", value: match[0].trim() });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < prompt.length) parts.push({ type: "text", value: prompt.slice(lastIndex) });
  if (!parts.some((part) => part.type === "math")) return <div className="promptText">{prompt}</div>;

  return (
    <div className="promptStack">
      {parts.map((part, index) =>
        part.type === "math"
          ? <div className="mathLine" dir="ltr" lang="en" key={`math-${index}`}>{part.value}</div>
          : part.value.trim()
            ? <div className="promptText" key={`text-${index}`}>{part.value.trim()}</div>
            : null,
      )}
    </div>
  );
}

function ElectricalBridge({ topic }: { topic: string }) {
  const text =
    topic === "מהו נעלם?"
      ? "בעולם החשמל גם אות יכולה לייצג מספר שעדיין לא ידוע. בהמשך נמצא כך ערכים כמו מתח, זרם והתנגדות."
      : topic === "חיבור וחיסור במשוואות"
        ? "בחשמל לפעמים צריך להוסיף או להוריד ערך כדי למצוא את החסר. כאן אנחנו בונים את היכולת הזאת בבסיס."
        : topic === "כפל במשוואות"
          ? "כפל מופיע בחישובי חשמל רבים, למשל כשמחשבים הספק. אנחנו קודם שולטים בכפל על מספרים פשוטים."
          : topic === "חילוק במשוואות"
            ? "חילוק הוא כלי מרכזי בחוק אוהם: בעזרתו אפשר למצוא זרם או התנגדות כשמכירים את שאר הערכים."
            : topic === "משוואות פשוטות"
              ? "משוואות עם כמה צעדים הן הבסיס לסידור נוסחאות חשמל ולמציאת הערך שחסר במעגל."
              : topic === "סדר פעולות"
                ? "כשמחשבים נוסחת חשמל, חשוב לבצע את הפעולות בסדר הנכון כדי לא לקבל תוצאה שגויה."
                : topic === "נוסחאות בסיסיות"
                  ? "נוסחאות הן השפה של חישובי חשמל. אנחנו לומדים לקרוא אותן לפני שנדרוש ממך לזכור אותן."
                  : topic === "שינוי נושא נוסחה"
                    ? "בתרגילי חשמל נצטרך לעיתים לסדר נוסחה מחדש כדי למצוא את המשתנה הרצוי."
                    : topic === "חשמל — חוק אוהם"
                      ? "כאן המתמטיקה נכנסת ישירות למעגל חשמלי: חוק אוהם מחבר בין מתח, זרם והתנגדות."
                      : topic === "חשמל — הספק"
                        ? "כאן נשתמש במתמטיקה כדי לחשב כמה הספק מכשיר חשמלי צורך."
                        : "כל מה שאנחנו לומדים כאן נועד בהמשך לשמש אותנו בחישובי חשמל אמיתיים.";
  return <div className="electricalBridge"><Zap size={18} /><span><strong>חיבור לחשמל</strong>{text}</span></div>;
}

function errorGuidance(exercise: Exercise, answer: string) {
  const normalized = normalize(answer);

  if (exercise.id.includes("zero-") && normalized.includes("-")) {
    return "נראה שאולי הלכת לכיוון של חיסור. בוא נבדוק יחד מה הפעולה שמופיעה ליד X.";
  }

  if (exercise.topic === "כפל במשוואות" && normalized !== "") {
    return "בתרגיל הזה X מוכפל במספר. חפש את הפעולה ההפוכה לכפל.";
  }

  if (exercise.topic === "חילוק במשוואות") {
    return "כש-X מחולק ב־2, חשב איזו פעולה תחזיר אותנו למספר המקורי.";
  }

  return "זה לא התשובה הפעם — וזה בסדר. השתמש ברמז הראשון, ונסה שוב.";
}

export default function Home() {
  const [learning, setLearning] = useState<LearningState>(emptyLearningState);
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState<1 | 2 | 0>(0);
  const [feedback, setFeedback] = useState<"idle" | "wrong" | "correct">("idle");
  const [stageGateMessage, setStageGateMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [activeExercise, setActiveExercise] = useState<Exercise>(firstExercise);
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [diagnosticIndex, setDiagnosticIndex] = useState(0);
  const [diagnosticAnswer, setDiagnosticAnswer] = useState("");
  const [diagnosticDone, setDiagnosticDone] = useState(false);
  const [diagnosticAttempts, setDiagnosticAttempts] = useState(0);
  const [diagnosticFeedback, setDiagnosticFeedback] = useState<"idle" | "wrong">("idle");
  const [checkpointOpen, setCheckpointOpen] = useState(false);
  const [checkpointQuestions, setCheckpointQuestions] = useState<CheckpointQuestion[]>([]);
  const [checkpointIndex, setCheckpointIndex] = useState(0);
  const [checkpointAnswer, setCheckpointAnswer] = useState("");
  const [checkpointFeedback, setCheckpointFeedback] = useState<"idle" | "wrong" | "correct">("idle");
  const [checkpointAttempts, setCheckpointAttempts] = useState(0);
  const [checkpointCorrectCount, setCheckpointCorrectCount] = useState(0);
  const [checkpointMessage, setCheckpointMessage] = useState("");
  const [masteryOpen, setMasteryOpen] = useState(false);
  const [masteryQuestions, setMasteryQuestions] = useState<MasteryQuestion[]>([]);
  const [masteryIndex, setMasteryIndex] = useState(0);
  const [masteryAnswer, setMasteryAnswer] = useState("");
  const [masteryCorrectCount, setMasteryCorrectCount] = useState(0);
  const [masteryFeedback, setMasteryFeedback] = useState<"idle" | "wrong" | "correct">("idle");
  const [finalExamOpen, setFinalExamOpen] = useState(false);
  const [finalExamQuestions, setFinalExamQuestions] = useState<FinalExamQuestion[]>([]);
  const [finalExamIndex, setFinalExamIndex] = useState(0);
  const [finalExamAnswer, setFinalExamAnswer] = useState("");
  const [finalExamCorrectCount, setFinalExamCorrectCount] = useState(0);
  const [finalExamFeedback, setFinalExamFeedback] = useState<"idle" | "wrong" | "correct">("idle");
  const [finalExamScore, setFinalExamScore] = useState<number | null>(null);

  useEffect(() => {
    const restored = loadLearningState(window.localStorage);
    setLearning(restored);
    setActiveExercise(resolveExercise(curriculum, restored));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveLearningState(window.localStorage, learning);
  }, [learning, ready]);

  const exercise = activeExercise;
  const generated = exercise.id.startsWith("generated-") ? exercise : null;
  const completedCount = learning.completed.length;
  const dueReviews = dueReviewIds(learning);
  const topError = learning.errors.slice().sort((a, b) => b.count - a.count)[0];
  const progress = Math.min(100, Math.round((completedCount / curriculum.length) * 100));
  const weakTopic = useMemo(
    () => topics.map((topic) => ({ topic, mastery: topicMastery(learning.stats[topic]) })).sort((a, b) => a.mastery - b.mastery)[0],
    [learning.stats],
  );
  const currentStage = stageForExercise(exercise).number;
  const currentStageProgress = stageProgress(currentStage, learning, curriculum);
  const sparkyMood = feedback === "correct" ? "celebrate" : feedback === "wrong" ? "think" : "idle";
  const sparkyIcon = feedback === "correct" ? "🔋" : feedback === "wrong" ? "💡" : "⚡";
  const journeyLabels = ["יסודות", "פעולות", "X ומשוואות", "שברים וחזקות", "אלגברה", "מתמטיקה לחשמל", "תרגול חשמלאי", "100 🎯"];
  const averageMastery = topics.length
    ? Math.round(topics.reduce((sum, topic) => sum + topicMastery(learning.stats[topic]), 0) / topics.length)
    : 0;

  useEffect(() => {
    if (!ready || diagnosticOpen || checkpointOpen) return;
    if (shouldRunCheckpoint(learning.completed.length, learning.checkpointsCompleted)) {
      const number = Math.floor(learning.completed.length / 5);
      setCheckpointQuestions(buildCheckpoint(curriculum, number, learning.completed));
      setCheckpointIndex(0); setCheckpointAnswer(""); setCheckpointFeedback("idle"); setCheckpointAttempts(0); setCheckpointCorrectCount(0); setCheckpointMessage(""); setCheckpointOpen(true);
    }
  }, [ready, diagnosticOpen, checkpointOpen, learning.completed.length, learning.checkpointsCompleted]);

  function check() {
    if (!answer.trim() || feedback === "correct") return;
    const correct = isCorrect(answer, exercise);
    setLearning((previous) => recordAttempt(previous, exercise, correct, hint > 0, correct ? undefined : classifyError(answer, exercise), answer));
    if (correct) setFeedback("correct");
    else { setFeedback("wrong"); if (hint === 0) setHint(1); }
  }

  function openMasteryForTopic(topic: string) {
    const questions = buildTopicMasteryTest(curriculum, topic, learning.attempts + learning.completed.length);
    if (!questions.length) return false;
    setMasteryQuestions(questions); setMasteryIndex(0); setMasteryAnswer(""); setMasteryCorrectCount(0); setMasteryFeedback("idle"); setMasteryOpen(true);
    return true;
  }

  function submitMastery() {
    const question = masteryQuestions[masteryIndex];
    if (!question || !masteryAnswer.trim() || masteryFeedback === "correct") return;
    const correct = answerMatches(masteryAnswer, question.accepted);
    if (!correct) { setMasteryFeedback("wrong"); return; }
    setMasteryCorrectCount((count) => count + 1);
    setMasteryFeedback("correct");
  }

  function nextMastery() {
    const finalQuestion = masteryIndex >= masteryQuestions.length - 1;
    if (!finalQuestion) {
      setMasteryIndex((index) => index + 1); setMasteryAnswer(""); setMasteryFeedback("idle"); return;
    }
    const score = masteryCorrectCount + (masteryFeedback === "correct" ? 1 : 0);
    const topic = masteryQuestions[0]?.topic;
    const testedState = topic ? recordMasteryTest(learning, topic, score) : learning;
    if (masteryPasses(score)) {
      const nextIndex = chooseNextExercise(curriculum, testedState);
      const nextState = { ...testedState, currentIndex: nextIndex };
      setMasteryOpen(false);
      setLearning(nextState);
      setActiveExercise(resolveExercise(curriculum, nextState, nextIndex));
      setAnswer(""); setHint(0); setFeedback("idle");
    } else {
      setMasteryOpen(false); setMasteryIndex(0); setMasteryAnswer(""); setMasteryFeedback("idle");
    }
    setMasteryCorrectCount(0);
  }

  function openFinalExam() {
    if (!stageGateSatisfied(8, learning, curriculum) || learning.finalExamPassed) return;
    const questions = buildFinalExam(curriculum, learning.attempts + learning.completed.length);
    if (!questions.length) return;
    setFinalExamQuestions(questions);
    setFinalExamIndex(0);
    setFinalExamAnswer("");
    setFinalExamCorrectCount(0);
    setFinalExamFeedback("idle");
    setFinalExamScore(null);
    setFinalExamOpen(true);
  }

  function submitFinalExam() {
    const question = finalExamQuestions[finalExamIndex];
    if (!question || !finalExamAnswer.trim() || finalExamFeedback === "correct") return;
    const correct = answerMatches(finalExamAnswer, question.accepted);
    setFinalExamFeedback(correct ? "correct" : "wrong");
    if (correct) setFinalExamCorrectCount((count) => count + 1);
  }

  function nextFinalExam() {
    const finalQuestion = finalExamIndex >= finalExamQuestions.length - 1;
    const score = finalExamCorrectCount + (finalExamFeedback === "correct" ? 1 : 0);
    if (!finalQuestion) {
      setFinalExamIndex((index) => index + 1);
      setFinalExamAnswer("");
      setFinalExamFeedback("idle");
      return;
    }
    setFinalExamScore(score);
    if (finalExamPasses(score)) {
      setLearning((previous) => recordFinalExam(previous, true));
    }
  }

  function next() {
    if (canStartMasteryTest(exercise.topic, learning, curriculum) && !generated) {
      openMasteryForTopic(exercise.topic);
      return;
    }
    let nextIndex = chooseNextExercise(curriculum, learning);
    const nextExercise = curriculum[nextIndex] ?? curriculum[0];
    if (nextExercise && nextExercise.topic !== exercise.topic && !stageGateSatisfied(stageForExercise(nextExercise).number, learning, curriculum)) {
      const currentStage = stageForExercise(exercise);
      const sameStage = stageExercises(currentStage, curriculum)
        .map((item) => curriculum.findIndex((candidate) => candidate.id === item.id))
        .find((index) => index >= 0 && !learning.completed.includes(curriculum[index].id));
      if (sameStage !== undefined) {
        nextIndex = sameStage;
      } else {
        setStageGateMessage("עוד צעד קטן לפני השלב הבא: ספארקי יחזק איתך את הנושא שעדיין לא יציב.");
        return;
      }
    }
    const nextState = { ...learning, currentIndex: nextIndex };
    setStageGateMessage("");
    setLearning(nextState);
    setActiveExercise(resolveExercise(curriculum, nextState, nextIndex));
    setAnswer(""); setHint(0); setFeedback("idle");
  }

  function submitCheckpoint() {
    const question = checkpointQuestions[checkpointIndex];
    if (!question || !checkpointAnswer.trim() || checkpointFeedback === "correct") return;
    const correct = answerMatches(checkpointAnswer, question.accepted);
    if (correct) {
      setCheckpointCorrectCount((count) => count + 1);
      setCheckpointFeedback("correct");
      return;
    }
    if (checkpointAttempts === 0) {
      setCheckpointAttempts(1); setCheckpointFeedback("wrong");
      return;
    }
    if (checkpointIndex < checkpointQuestions.length - 1) {
      setCheckpointIndex((index) => index + 1); setCheckpointAnswer(""); setCheckpointFeedback("idle"); setCheckpointAttempts(0);
      return;
    }
    const number = Math.floor(learning.completed.length / 5);
    if (checkpointPasses(checkpointCorrectCount)) {
      setLearning((previous) => previous.checkpointsCompleted.includes(number) ? previous : ({ ...previous, checkpointsCompleted: [...previous.checkpointsCompleted, number] }));
      setCheckpointOpen(false);
      setCheckpointMessage("");
    } else {
      setCheckpointMessage("הפעם לא עברנו את הבוחן — ננסה אותו שוב, בלי לחץ.");
      setCheckpointIndex(0); setCheckpointAnswer(""); setCheckpointFeedback("idle"); setCheckpointAttempts(0); setCheckpointCorrectCount(0);
    }
  }

  function nextCheckpoint() {
    if (checkpointIndex >= checkpointQuestions.length - 1) {
      const number = Math.floor(learning.completed.length / 5);
      const finalScore = checkpointCorrectCount + (checkpointFeedback === "correct" ? 1 : 0);
      if (checkpointPasses(finalScore)) {
        setLearning((previous) => previous.checkpointsCompleted.includes(number) ? previous : ({ ...previous, checkpointsCompleted: [...previous.checkpointsCompleted, number] }));
        setCheckpointOpen(false);
      } setCheckpointAnswer(""); setCheckpointFeedback("idle"); setCheckpointAttempts(0); setCheckpointCorrectCount(0);
      return;
    }
    setCheckpointIndex((index) => index + 1); setCheckpointAnswer(""); setCheckpointFeedback("idle"); setCheckpointAttempts(0);
  }

  function reset() {
    setLearning(emptyLearningState); setActiveExercise(firstExercise); setAnswer(""); setHint(0); setFeedback("idle");
    setDiagnosticOpen(false); setDiagnosticIndex(0); setDiagnosticAnswer(""); setDiagnosticDone(false);
    setDiagnosticAttempts(0); setDiagnosticFeedback("idle");
    setCheckpointOpen(false); setCheckpointQuestions([]); setCheckpointIndex(0); setCheckpointAnswer(""); setCheckpointFeedback("idle"); setCheckpointAttempts(0); setCheckpointCorrectCount(0); setCheckpointMessage("");
  }

  function submitDiagnostic() {
    const question = diagnosticQuestions[diagnosticIndex];
    if (!diagnosticAnswer.trim() || !question) return;
    const correct = diagnosticAnswerIsCorrect(diagnosticAnswer, question);
    setLearning((previous) => ({
      ...previous,
      diagnosticResults: [...previous.diagnosticResults, { skill: question.skill, correct }],
    }));
    if (!correct && diagnosticAttempts === 0) {
      setDiagnosticAttempts(1);
      setDiagnosticFeedback("wrong");
      return;
    }
    if (diagnosticIndex === diagnosticQuestions.length - 1) {
      const diagnosticResults = [...learning.diagnosticResults, { skill: question.skill, correct }];
      const nextIndex = recommendedStartingIndex(diagnosticResults, curriculum);
      const nextState = { ...learning, diagnosticResults, currentIndex: nextIndex };
      setLearning(nextState);
      setActiveExercise(resolveExercise(curriculum, nextState, nextIndex));
      setDiagnosticDone(true);
      return;
    }
    setDiagnosticIndex((index) => index + 1);
    setDiagnosticAnswer("");
    setDiagnosticAttempts(0);
    setDiagnosticFeedback("idle");
  }

  function closeDiagnostic() {
    setDiagnosticOpen(false);
    setDiagnosticIndex(0);
    setDiagnosticAnswer("");
    setDiagnosticDone(false);
    setDiagnosticAttempts(0);
    setDiagnosticFeedback("idle");
  }

  return (
    <main className="shell">
      {checkpointOpen && checkpointQuestions[checkpointIndex] && (
        <div className="diagnosticOverlay" role="dialog" aria-modal="true" aria-label="בוחן קצרצר">
          <div className="diagnosticModal">
            <div className="eyebrow"><Target size={16} /> בקרת איכות • בוחן קצרצר</div>
            <h2>רק לוודא שזה באמת יושב 🧠</h2>
            <p>אין ציון. אנחנו בודקים מה נשאר בזיכרון אחרי הלמידה, כדי לדעת אם לחזור קצת או להתקדם.</p>
            <div className="diagnosticProgress">שאלה {checkpointIndex + 1} מתוך {checkpointQuestions.length}</div>
            <div className="diagnosticQuestion"><MathPrompt prompt={checkpointQuestions[checkpointIndex].prompt} /></div>
            {checkpointMessage && <div className="feedback wrong">{checkpointMessage}</div>}
            {checkpointFeedback === "wrong" && <div className="feedback wrong">כמעט. קח רגע לחשוב שוב — אני לא נותן את הפתרון.</div>}
            {checkpointFeedback === "correct" && <div className="feedback success">מעולה. זה יושב טוב. אפשר להמשיך.</div>}
            {checkpointFeedback !== "correct" && <input className="diagnosticInput" dir="ltr" autoFocus value={checkpointAnswer}
              onChange={(event) => setCheckpointAnswer(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && submitCheckpoint()} placeholder="התשובה שלך..." />}
            {checkpointFeedback === "correct" ? (
              <button className="primary diagnosticSubmit" onClick={nextCheckpoint}>המשך <ChevronLeft size={18} /></button>
            ) : (
              <button className="primary diagnosticSubmit" onClick={submitCheckpoint} disabled={!checkpointAnswer.trim()}>בדוק תשובה <ChevronLeft size={18} /></button>
            )}
            {checkpointFeedback === "wrong" && <p className="checkpointHint">{checkpointQuestions[checkpointIndex].hint1}</p>}
          </div>
        </div>
      )}
      {diagnosticOpen && (
        <div className="diagnosticOverlay" role="dialog" aria-modal="true" aria-label="בדיקת רמה קצרה">
          <div className="diagnosticModal">
            <button className="diagnosticClose" onClick={closeDiagnostic} aria-label="סגור">×</button>
            {!diagnosticDone ? (
              <>
                <div className="eyebrow"><Target size={16} /> בדיקה קצרה • בלי ציון</div>
                <h2>רק כדי שאדע מאיפה להתחיל</h2>
                <p>אין כאן נכשל או עובר. השאלות קצרות מאוד, והמטרה היא לזהות מה כבר מוכר לך ומה כדאי לחזק.</p>
                <div className="diagnosticProgress">שאלה {diagnosticIndex + 1} מתוך {diagnosticQuestions.length}</div>
                <div className="diagnosticQuestion"><MathPrompt prompt={diagnosticQuestions[diagnosticIndex].prompt} /></div>
                {diagnosticFeedback === "wrong" && (
                  <div className="feedback wrong">לא נורא — זו בדיוק הסיבה לבדיקה. נסה פעם נוספת. אפשר לחשוב לאט, בלי לחץ.</div>
                )}
                <input className="diagnosticInput" dir="ltr" autoFocus value={diagnosticAnswer}
                  onChange={(event) => setDiagnosticAnswer(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && submitDiagnostic()}
                  placeholder="התשובה שלך..." />
                <button className="primary diagnosticSubmit" onClick={submitDiagnostic} disabled={!diagnosticAnswer.trim()}>
                  {diagnosticIndex === diagnosticQuestions.length - 1 ? "סיים בדיקה" : "המשך"} <ChevronLeft size={18} />
                </button>
              </>
            ) : (
              <>
                <div className="completionIcon"><Target size={38} /></div>
                <h2>סיימנו את הבדיקה 🎯</h2>
                <p>מעולה. עכשיו המערכת יכולה לתת יותר משקל לנושאים שבהם כדאי לחזק את הבסיס.</p>
                <button className="primary" onClick={closeDiagnostic}>חזרה ללמידה <ChevronLeft size={18} /></button>
              </>
            )}
          </div>
        </div>
      )}
      <header className="focusHeader">
        <div className="focusBrand"><div className="logo"><Zap size={20}/></div><strong>מתמטיקה לחשמלאי מוסמך</strong></div>
        <div className="focusProgress"><span>שלב {currentStage}/8</span><div className="focusTrack"><div style={{width: Math.min(100, Math.max(4, progress)) + "%"}} /></div></div>
        <button className="ghost focusMenu" onClick={() => setDiagnosticOpen(true)}><Target size={16}/> בדיקת רמה</button>
      </header>
      <section className={"sparkyFocus sparkyMood-" + sparkyMood}>
        <div className="sparkyFocusAvatar" aria-hidden="true"><span className="sparkyBody">👨‍🔧</span><span className="sparkyBolt">{sparkyIcon}</span></div>
        <div><div className="eyebrow">⚡ ספארקי</div><h1>{feedback === "correct" ? "מעולה! ממשיכים 🔋" : feedback === "wrong" ? "בוא נחשוב יחד 💡" : "מתחילים מהבסיס 🎯"}</h1><p>{feedback === "idle" ? "תרגיל אחד בלבד. אין צורך לזכור כלום — נבנה את זה יחד." : feedback === "wrong" ? "לא אתן את הפתרון. אני אתן לך כיוון קטן." : "בדיוק כך. כל תשובה נכונה בונה עוד לבנה."}</p></div>
      </section>
      <div className="layout focusLayout">
        <section className="lesson">
          {completedCount === curriculum.length && !finalExamOpen ? (
            <div className="panel exerciseCard completion">
              <div className="completionIcon"><Trophy size={42} /></div>
              {learning.finalExamPassed ? (
                <>
                  <h2>100 🎯 הושג!</h2>
                  <p>עברת את מבחן הגמר והוכחת שליטה במסלול הבסיס — כולל אלגברה, נוסחאות וחישובי חשמל.</p>
                  <button className="primary" onClick={reset}>התחל מסלול חדש <ChevronLeft size={18} /></button>
                </>
              ) : (
                <>
                  <h2>הגיע הזמן למבחן 100 🎯</h2>
                  <p>12 שאלות מעורבות, ללא רמזים. צריך לפחות {FINAL_EXAM_REQUIRED} תשובות נכונות.</p>
                  <button className="primary" onClick={openFinalExam}>התחל מבחן 100 <ChevronLeft size={18} /></button>
                </>
              )}
            </div>
          ) : (
            <>
              {!masteryOpen && (
                <>
                  <div className="lessonMeta"><span>{exercise.topic}</span><span className="dot" /> {generated ? "תרגול חיזוק" : `תרגיל ${completedCount + 1}`}</div>
                  <div className="lessonScene" aria-label="תמונת מצב של השיעור">
                    <div className="sceneCircuit" aria-hidden="true">
                      <span className="sceneNode active" /><span className="sceneWire" /><span className="sceneNode" /><span className="sceneWire short" /><span className="sceneNode" />
                    </div>
                    <div className="sceneCopy">
                      <span className="sceneKicker">⚡ המשימה עכשיו</span>
                      <strong>{exercise.topic}</strong>
                      <span>{generated ? "חיזוק ממוקד לפני שמתקדמים" : "צעד קטן בדרך לחישובי חשמל"}</span>
                    </div>
                    <div className="sceneStats">
                      <span><b>{currentStage}</b>/8 <small>שלב</small></span>
                      <span><b>{averageMastery}%</b> <small>שליטה</small></span>
                    </div>
                  </div>
                </>
              )}

              {finalExamOpen ? (
                <div className="panel exerciseCard masteryFocusCard">
                  {finalExamScore === null ? (
                    <>
                      <div className="masteryIntro"><span className="masteryBadge">🎯</span><div><strong>מבחן 100</strong><span>שאלה {finalExamIndex + 1} מתוך {finalExamQuestions.length} • ללא רמזים</span></div></div>
                      <div className="masteryHeader"><strong>{finalExamQuestions[finalExamIndex]?.topic}</strong><span>ציון מצטבר: {finalExamCorrectCount}</span></div>
                      <div className="question"><MathPrompt prompt={finalExamQuestions[finalExamIndex]?.prompt ?? ""} /></div>
                      <div className="answerRow"><input dir="ltr" autoComplete="off" value={finalExamAnswer} onChange={(e)=>{setFinalExamAnswer(e.target.value);setFinalExamFeedback("idle")}} onKeyDown={(e)=>e.key==="Enter"&&submitFinalExam()} placeholder="התשובה שלך..." disabled={finalExamFeedback==="correct"} /><button className="primary" onClick={submitFinalExam} disabled={!finalExamAnswer.trim()||finalExamFeedback==="correct"}>{finalExamFeedback==="correct" ? "נכון" : "בדוק"} <ChevronLeft size={18}/></button></div>
                      {finalExamFeedback==="wrong" && <div className="feedback hint"><Lightbulb size={20}/><div><strong>לא הפעם 💡</strong><span>בדוק את החישוב ונסה שוב. במבחן הגמר אין רמזים.</span></div></div>}
                      {finalExamFeedback==="correct" && <div className="feedback success"><CheckCircle2 size={22}/><div><strong>נכון! ⚡</strong><button onClick={nextFinalExam} className="nextBtn">{finalExamIndex === finalExamQuestions.length-1 ? "סיום מבחן" : "השאלה הבאה"} <ChevronLeft size={18}/></button></div></div>}
                      {finalExamFeedback==="wrong" && <button onClick={nextFinalExam} className="nextBtn">המשך לשאלה הבאה <ChevronLeft size={18}/></button>}
                    </>
                  ) : (
                    <div className="completion">
                      <div className="completionIcon">{finalExamPasses(finalExamScore) ? <Trophy size={42}/> : <Target size={42}/>}</div>
                      <h2>{finalExamPasses(finalExamScore) ? "100 🎯 הושג!" : "עוד קצת ⚡"}</h2>
                      <p>קיבלת {finalExamScore} מתוך {FINAL_EXAM_TOTAL}. {finalExamPasses(finalExamScore) ? "הוכחת שליטה במסלול." : "צריך לפחות " + FINAL_EXAM_REQUIRED + " תשובות נכונות. נחזור לחיזוק ממוקד וננסה שוב."}</p>
                      {finalExamPasses(finalExamScore) ? <button className="primary" onClick={()=>setFinalExamOpen(false)}>סיום <ChevronLeft size={18} /></button> : <button className="primary" onClick={()=>{setFinalExamOpen(false);setFinalExamScore(null)}}>חזרה לחיזוק <ChevronLeft size={18} /></button>}
                    </div>
                  )}
                </div>
              ) : (
              {masteryOpen ? (
                <div className="panel exerciseCard masteryFocusCard">
                  <div className="masteryIntro"><span className="masteryBadge">🎯</span><div><strong>נקודת שליטה</strong><span>סיימת את התרגול. עכשיו נוודא שהידע באמת יושב.</span></div></div>
                  <div className="masteryHeader"><strong>{masteryQuestions[0]?.topic}</strong><span>שאלה {masteryIndex + 1} / {masteryQuestions.length}</span></div>
                  <div className="question"><MathPrompt prompt={masteryQuestions[masteryIndex]?.prompt ?? ""} /></div>
                  <div className="answerRow"><input dir="ltr" autoComplete="off" value={masteryAnswer} onChange={(e)=>{setMasteryAnswer(e.target.value);setMasteryFeedback("idle")}} onKeyDown={(e)=>e.key==="Enter"&&submitMastery()} placeholder="התשובה שלך..." disabled={masteryFeedback==="correct"} /><button className="primary" onClick={submitMastery} disabled={!masteryAnswer.trim()||masteryFeedback==="correct"}>{masteryFeedback==="correct" ? "נכון" : "בדוק"} <ChevronLeft size={18} /></button></div>
                  {masteryFeedback==="wrong" && <div className="feedback hint"><Lightbulb size={20}/><div><strong>כמעט 💡</strong><span>לא אתן את הפתרון. נסה לחשוב שוב על הפעולה שעשית.</span></div></div>}
                  {masteryFeedback==="correct" && <div className="feedback success"><CheckCircle2 size={22}/><div><strong>נכון! ⚡</strong><span>מעולה. ממשיכים לשאלת השליטה הבאה.</span><button onClick={nextMastery} className="nextBtn">{masteryIndex === masteryQuestions.length-1 ? "סיום מבחן" : "השאלה הבאה"} <ChevronLeft size={18} /></button></div></div>}
                </div>
              ) : (
              <div key={exercise.id} className="panel exerciseCard exerciseEnter">
                <h2>{exercise.title}</h2>
                <div className="teachingNote"><Lightbulb size={18} /><div><strong>ספארקי מסביר</strong><MathPrompt prompt={exercise.teachingNote} /></div></div>
                <ElectricalMiniSimulator topic={exercise.topic} />
                <div className="question"><MathPrompt prompt={exercise.prompt} /></div>

                <label htmlFor="answer">התשובה שלך</label>
                <div className="answerRow">
                  <input id="answer" dir="ltr" autoComplete="off" value={answer}
                    onChange={(event) => { setAnswer(event.target.value); setFeedback("idle"); }}
                    onKeyDown={(event) => event.key === "Enter" && check()}
                    placeholder="כתוב כאן את התשובה..." disabled={feedback === "correct"} />
                  <button className="primary" onClick={check} disabled={!answer.trim() || feedback === "correct"}>בדוק תשובה <ChevronLeft size={18} /></button>
                </div>

                {feedback === "wrong" && <div className="feedback hint"><Lightbulb size={20} /><div><strong>לא נורא. אנחנו לומדים צעד־צעד.</strong><MathPrompt prompt={errorGuidance(exercise, answer)} /><MathPrompt prompt={hint === 1 ? exercise.hint1 : exercise.hint2} />{hint === 1 && <button onClick={() => setHint(2)} className="linkBtn">אני צריך עוד רמז</button>}</div></div>}
                {feedback === "correct" && <div className="feedback success"><CheckCircle2 size={22} /><div><strong>מצוין! 🎯</strong><MathPrompt prompt={exercise.explanation} />{learning.reviews[exercise.id] && <small>החזרה הבאה בנושא מתוזמנת אוטומטית — המערכת תביא אותו שוב כדי לוודא שהידע נשאר.</small>}<button onClick={next} className="nextBtn">התרגיל הבא <ChevronLeft size={18} /></button></div></div>}
                {stageGateMessage && <div className="teacherTip"><Target size={18} /><span>{stageGateMessage}</span></div>}
                {feedback === "idle" && <div className="teacherTip"><Lightbulb size={18} /><span>קח את הזמן. נסה לבד. אם קשה — נתקדם יחד, בלי לקפוץ לפתרון.</span></div>}
              </div>

              )}


              {learning.mistakes.length > 0 && <div className="panel mistakesCard"><div className="panelTitle">דברים שנרצה לחזק</div><p>אין כאן ציונים ואין כישלון. המערכת פשוט זוכרת איפה היה קשה וחוזרת לשם בהמשך.</p><div className="mistakeList">{learning.mistakes.slice(-4).map((id) => { const item = curriculum.find((candidate) => candidate.id === id); return item ? <span key={id}>{item.topic}</span> : null; })}</div></div>}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
