"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, Lightbulb, RotateCcw, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { curriculum, firstExercise, type Exercise } from "../lib/curriculum";
import { diagnosticAnswerIsCorrect, diagnosticQuestions } from "../lib/diagnostic";
import { buildCheckpoint, shouldRunCheckpoint, type CheckpointQuestion } from "../lib/checkpoints";
import { chooseNextExercise, emptyLearningState, loadLearningState, recordAttempt, saveLearningState, topicMastery, recommendedStartingIndex, generatedReinforcement, shouldGenerateReinforcement, type LearningState } from "../lib/learning";

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
  const [checkpointOpen, setCheckpointOpen] = useState(false);
  const [checkpointQuestions, setCheckpointQuestions] = useState<CheckpointQuestion[]>([]);
  const [checkpointIndex, setCheckpointIndex] = useState(0);
  const [checkpointAnswer, setCheckpointAnswer] = useState("");
  const [checkpointFeedback, setCheckpointFeedback] = useState<"idle" | "wrong" | "correct">("idle");
  const [checkpointAttempts, setCheckpointAttempts] = useState(0);

  useEffect(() => {
    const restored = loadLearningState(window.localStorage);
    setLearning(restored);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveLearningState(window.localStorage, learning);
  }, [learning, ready]);

  const baseExercise = curriculum[learning.currentIndex] ?? firstExercise;
  const generated = useMemo(() => {
    const stats = learning.stats[baseExercise.topic];
    if (!shouldGenerateReinforcement(stats)) return null;
    return generatedReinforcement(baseExercise.topic, learning.attempts + baseExercise.level + learning.completed.length);
  }, [baseExercise, learning.attempts, learning.completed.length, learning.stats]);
  const exercise = generated ?? baseExercise;
  const completedCount = learning.completed.length;
  const progress = Math.min(100, Math.round((completedCount / curriculum.length) * 100));
  const weakTopic = useMemo(
    () => topics.map((topic) => ({ topic, mastery: topicMastery(learning.stats[topic]) })).sort((a, b) => a.mastery - b.mastery)[0],
    [learning.stats],
  );

  useEffect(() => {
    if (!ready || diagnosticOpen || checkpointOpen) return;
    if (shouldRunCheckpoint(learning.completed.length, learning.checkpointsCompleted)) {
      const number = Math.floor(learning.completed.length / 5);
      setCheckpointQuestions(buildCheckpoint(curriculum, number));
      setCheckpointIndex(0); setCheckpointAnswer(""); setCheckpointFeedback("idle"); setCheckpointAttempts(0); setCheckpointOpen(true);
    }
  }, [ready, diagnosticOpen, checkpointOpen, learning.completed.length, learning.checkpointsCompleted]);

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

  function submitCheckpoint() {
    const question = checkpointQuestions[checkpointIndex];
    if (!question || !checkpointAnswer.trim() || checkpointFeedback === "correct") return;
    const correct = normalize(checkpointAnswer) && question.accepted.some((value) => normalize(value) === normalize(checkpointAnswer));
    if (correct) {
      setCheckpointFeedback("correct");
      return;
    }
    if (checkpointAttempts === 0) {
      setCheckpointAttempts(1); setCheckpointFeedback("wrong");
      return;
    }
    if (checkpointIndex >= checkpointQuestions.length - 1) {
      const number = Math.floor(learning.completed.length / 5);
      setLearning((previous) => ({ ...previous, checkpointsCompleted: [...previous.checkpointsCompleted, number] }));
      setCheckpointOpen(false); setCheckpointFeedback("idle"); setCheckpointAnswer(""); setCheckpointAttempts(0);
      return;
    }
    setCheckpointIndex((index) => index + 1); setCheckpointAnswer(""); setCheckpointFeedback("idle"); setCheckpointAttempts(0);
  }

  function nextCheckpoint() {
    if (checkpointIndex >= checkpointQuestions.length - 1) {
      const number = Math.floor(learning.completed.length / 5);
      setLearning((previous) => previous.checkpointsCompleted.includes(number) ? previous : ({ ...previous, checkpointsCompleted: [...previous.checkpointsCompleted, number] }));
      setCheckpointOpen(false); setCheckpointAnswer(""); setCheckpointFeedback("idle"); setCheckpointAttempts(0);
      return;
    }
    setCheckpointIndex((index) => index + 1); setCheckpointAnswer(""); setCheckpointFeedback("idle"); setCheckpointAttempts(0);
  }

  function reset() {
    setLearning(emptyLearningState); setAnswer(""); setHint(0); setFeedback("idle");
    setDiagnosticOpen(false); setDiagnosticIndex(0); setDiagnosticAnswer(""); setDiagnosticDone(false);
    setDiagnosticAttempts(0); setDiagnosticFeedback("idle");
    setCheckpointOpen(false); setCheckpointQuestions([]); setCheckpointIndex(0); setCheckpointAnswer(""); setCheckpointFeedback("idle"); setCheckpointAttempts(0);
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
      {checkpointOpen && checkpointQuestions[checkpointIndex] && (
        <div className="diagnosticOverlay" role="dialog" aria-modal="true" aria-label="בוחן קצרצר">
          <div className="diagnosticModal">
            <div className="eyebrow"><Target size={16} /> בקרת איכות • בוחן קצרצר</div>
            <h2>רק לוודא שזה באמת יושב 🧠</h2>
            <p>אין ציון. אנחנו בודקים מה נשאר בזיכרון אחרי הלמידה, כדי לדעת אם לחזור קצת או להתקדם.</p>
            <div className="diagnosticProgress">שאלה {checkpointIndex + 1} מתוך {checkpointQuestions.length}</div>
            <div className="diagnosticQuestion"><MathPrompt prompt={checkpointQuestions[checkpointIndex].prompt} /></div>
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
        <div className="roadmap">
          <div className="roadmapTitle">תוכנית הדרך ל־100</div>
          <div className="roadmapGrid">
            <div className="roadmapStep active"><span>1</span><div><strong>יסודות מוחלטים</strong><small>מספרים, פעולות, X, משוואות ושברים</small></div></div>
            <div className="roadmapStep"><span>2</span><div><strong>מתמטיקה לחשמל</strong><small>אלגברה, נוסחאות, חזקות, טריגונומטריה וחוק אוהם</small></div></div>
            <div className="roadmapStep"><span>3</span><div><strong>שליטה ובחינת 100</strong><small>תרגול חשמלאי, מבחני סימולציה, תיקון טעויות וחיזוק</small></div></div>
          </div>
        </div>
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
                <div className="teachingNote"><Lightbulb size={20} /><div><strong>רגע של הסבר</strong><MathPrompt prompt={exercise.teachingNote} /></div></div>
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
                {feedback === "correct" && <div className="feedback success"><CheckCircle2 size={22} /><div><strong>מצוין! 🎯</strong><MathPrompt prompt={exercise.explanation} /><button onClick={next} className="nextBtn">התרגיל הבא <ChevronLeft size={18} /></button></div></div>}
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
