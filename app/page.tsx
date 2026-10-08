"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, Lightbulb, RotateCcw, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { curriculum, firstExercise, type Exercise } from "../lib/curriculum";
import { diagnosticAnswerIsCorrect, diagnosticQuestions } from "../lib/diagnostic";
import { chooseNextExercise, emptyLearningState, loadLearningState, recordAttempt, saveLearningState, topicMastery, recommendedStartingIndex, type LearningState } from "../lib/learning";

const topics = [...new Set(curriculum.map((exercise) => exercise.topic))];

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(" ", "")
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("²", "^2")
    .replaceAll("−", "-")
    .replace(/(אמפר|amp|a|וולט|volt|v|וואט|w)$/i, "")
    .replace(/[.,!?]/g, "");
}

function isCorrect(answer: string, exercise: Exercise) {
  const normalized = normalize(answer);
  return exercise.accepted.some((value) => normalize(value) === normalized);
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
  const [ready, setReady] = useState(false);
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [diagnosticIndex, setDiagnosticIndex] = useState(0);
  const [diagnosticAnswer, setDiagnosticAnswer] = useState("");
  const [diagnosticDone, setDiagnosticDone] = useState(false);
  const [diagnosticAttempts, setDiagnosticAttempts] = useState(0);
  const [diagnosticFeedback, setDiagnosticFeedback] = useState<"idle" | "wrong">("idle");

  useEffect(() => {
    const restored = loadLearningState(window.localStorage);
    setLearning(restored);
    setReady(true);
    if (restored.diagnosticResults.length === 0) setDiagnosticOpen(true);
  }, []);

  useEffect(() => {
    if (ready) saveLearningState(window.localStorage, learning);
  }, [learning, ready]);

  const exercise = curriculum[learning.currentIndex] ?? firstExercise;
  const completedCount = learning.completed.length;
  const progress = Math.min(100, Math.round((completedCount / curriculum.length) * 100));
  const weakTopic = useMemo(
    () => topics.map((topic) => ({ topic, mastery: topicMastery(learning.stats[topic]) })).sort((a, b) => a.mastery - b.mastery)[0],
    [learning.stats],
  );

  function check() {
    if (!answer.trim() || feedback === "correct") return;
    const correct = isCorrect(answer, exercise);
    setLearning((previous) => recordAttempt(previous, exercise, correct, hint > 0));
    if (correct) setFeedback("correct");
    else { setFeedback("wrong"); if (hint === 0) setHint(1); }
  }

  function next() {
    const nextIndex = chooseNextExercise(curriculum, learning);
    setLearning((previous) => ({ ...previous, currentIndex: nextIndex }));
    setAnswer(""); setHint(0); setFeedback("idle");
  }

  function reset() {
    setLearning(emptyLearningState); setAnswer(""); setHint(0); setFeedback("idle");
    setDiagnosticOpen(false); setDiagnosticIndex(0); setDiagnosticAnswer(""); setDiagnosticDone(false);
    setDiagnosticAttempts(0); setDiagnosticFeedback("idle");
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
      setLearning((previous) => ({
        ...previous,
        currentIndex: recommendedStartingIndex(
          [...previous.diagnosticResults, { skill: question.skill, correct }],
          curriculum,
        ),
      }));
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
                <div className="diagnosticQuestion">{diagnosticQuestions[diagnosticIndex].prompt}</div>
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
      <header className="topbar">
        <div className="brand">
          <div className="logo"><Zap size={22} /></div>
          <div><strong>מתמטיקה לחשמלאי מוסמך</strong><span>מורה פרטי אינטראקטיבי</span></div>
        </div>
        <div className="topActions"><button className="ghost" onClick={() => setDiagnosticOpen(true)}><Target size={17} /> בדיקת רמה קצרה</button><button className="ghost" onClick={reset}><RotateCcw size={17} /> איפוס התקדמות</button></div>
      </header>

      <section className="hero">
        <div className="eyebrow"><Sparkles size={16} /> מתחילים מאפס • מתמטיקה → חשמל</div>
        <h1>לא צריך לזכור כלום.<br /><em>נבנה את הידע מחדש.</em></h1>
        <p>הסברים קצרים, דוגמאות פשוטות ותרגיל אחד בכל פעם. המערכת מתקדמת רק כשאתה מוכן.</p>
      </section>

      <div className="layout">
        <aside className="panel progressPanel">
          <div className="panelTitle">ההתקדמות שלך</div>
          <div className="progressCircle"><span>{progress}%</span><small>שליטה</small></div>
          <div className="stat"><span>תרגילים שהושלמו</span><b>{completedCount} / {curriculum.length}</b></div>
          <div className="stat"><span>ניסיונות</span><b>{learning.attempts}</b></div>
          <div className="topics">
            <div className="topicHead">מה אנחנו לומדים</div>
            {topics.map((topic) => <div className="topic" key={topic}><span>{topic}</span><b>{topicMastery(learning.stats[topic])}%</b></div>)}
          </div>
          {weakTopic && weakTopic.mastery < 70 && <div className="teacherTip"><Target size={18} /><span>נחזק לאט את <strong>{weakTopic.topic}</strong>. אין לחץ.</span></div>}
        </aside>

        <section className="lesson">
          {completedCount === curriculum.length ? (
            <div className="panel exerciseCard completion">
              <div className="completionIcon"><Trophy size={42} /></div>
              <h2>סיימת את מסלול הבסיס 🎉</h2>
              <p>בשלב הבא נוכל להעמיק בהדרגה ולהכניס יותר ויותר שאלות מעולם החשמל.</p>
              <button className="primary" onClick={reset}>התחל שוב <ChevronLeft size={18} /></button>
            </div>
          ) : (
            <>
              <div className="lessonMeta"><span className="badge">רמה {exercise.level}</span><span>{exercise.topic}</span><span className="dot" /> תרגיל {completedCount + 1}</div>

              <div className="panel exerciseCard">
                <h2>{exercise.title}</h2>
                <div className="teachingNote"><Lightbulb size={20} /><div><strong>רגע של הסבר</strong><p>{exercise.teachingNote}</p></div></div>
                <div className="question">{exercise.prompt}</div>

                <label htmlFor="answer">התשובה שלך</label>
                <div className="answerRow">
                  <input id="answer" dir="ltr" autoComplete="off" value={answer}
                    onChange={(event) => { setAnswer(event.target.value); setFeedback("idle"); }}
                    onKeyDown={(event) => event.key === "Enter" && check()}
                    placeholder="כתוב כאן את התשובה..." disabled={feedback === "correct"} />
                  <button className="primary" onClick={check} disabled={!answer.trim() || feedback === "correct"}>בדוק תשובה <ChevronLeft size={18} /></button>
                </div>

                {feedback === "wrong" && <div className="feedback hint"><Lightbulb size={20} /><div><strong>לא נורא. אנחנו לומדים צעד־צעד.</strong><p>{errorGuidance(exercise, answer)}</p><p>{hint === 1 ? exercise.hint1 : exercise.hint2}</p>{hint === 1 && <button onClick={() => setHint(2)} className="linkBtn">אני צריך עוד רמז</button>}</div></div>}
                {feedback === "correct" && <div className="feedback success"><CheckCircle2 size={22} /><div><strong>מצוין! 🎯</strong><p>{exercise.explanation}</p><button onClick={next} className="nextBtn">התרגיל הבא <ChevronLeft size={18} /></button></div></div>}
                {feedback === "idle" && <div className="teacherTip"><Lightbulb size={18} /><span>קח את הזמן. נסה לבד. אם קשה — נתקדם יחד, בלי לקפוץ לפתרון.</span></div>}
              </div>

              {learning.mistakes.length > 0 && <div className="panel mistakesCard"><div className="panelTitle">דברים שנרצה לחזק</div><p>אין כאן ציונים ואין כישלון. המערכת פשוט זוכרת איפה היה קשה וחוזרת לשם בהמשך.</p><div className="mistakeList">{learning.mistakes.slice(-4).map((id) => { const item = curriculum.find((candidate) => candidate.id === id); return item ? <span key={id}>{item.topic}</span> : null; })}</div></div>}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
