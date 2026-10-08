"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, Lightbulb, RotateCcw, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { curriculum, firstExercise, type Exercise } from "../lib/curriculum";
import {
  chooseNextExercise,
  emptyLearningState,
  loadLearningState,
  recordAttempt,
  saveLearningState,
  topicMastery,
  type LearningState,
} from "../lib/learning";

const topics = [...new Set(curriculum.map((exercise) => exercise.topic))];

function normalize(value: string) {
  return value.trim().toLowerCase()
    .replaceAll(" ", "")
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("²", "^2")
    .replaceAll("−", "-")
    .replace(/[.,!?]/g, "");
}

function isCorrect(answer: string, exercise: Exercise) {
  const normalized = normalize(answer);
  return exercise.accepted.some((value) => normalize(value) === normalized);
}

export default function Home() {
  const [learning, setLearning] = useState<LearningState>(emptyLearningState);
  const [answer, setAnswer] = useState("");
  const [hint, setHint] = useState<1 | 2 | 0>(0);
  const [feedback, setFeedback] = useState<"idle" | "wrong" | "correct">("idle");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const restored = loadLearningState(window.localStorage);
    setLearning(restored);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveLearningState(window.localStorage, learning);
  }, [learning, ready]);

  const exercise = curriculum[learning.currentIndex] ?? firstExercise;
  const completedCount = learning.completed.length;
  const progress = Math.min(100, Math.round((completedCount / curriculum.length) * 100));
  const totalAttempts = learning.attempts;
  const weakTopic = useMemo(
    () => topics
      .map((topic) => ({ topic, mastery: topicMastery(learning.stats[topic]) }))
      .sort((a, b) => a.mastery - b.mastery)[0],
    [learning.stats],
  );

  function check() {
    if (!answer.trim() || feedback === "correct") return;
    const correct = isCorrect(answer, exercise);

    setLearning((previous) => recordAttempt(previous, exercise, correct, hint > 0));

    if (correct) {
      setFeedback("correct");
    } else {
      setFeedback("wrong");
      if (hint === 0) setHint(1);
    }
  }

  function next() {
    const nextIndex = chooseNextExercise(curriculum, learning);
    setLearning((previous) => ({ ...previous, currentIndex: nextIndex }));
    setAnswer("");
    setHint(0);
    setFeedback("idle");
  }

  function reset() {
    setLearning(emptyLearningState);
    setAnswer("");
    setHint(0);
    setFeedback("idle");
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="logo"><Zap size={22} /></div>
          <div><strong>מתמטיקה לחשמלאי מוסמך</strong><span>מורה פרטי אינטראקטיבי</span></div>
        </div>
        <button className="ghost" onClick={reset}><RotateCcw size={17} /> איפוס התקדמות</button>
      </header>

      <section className="hero">
        <div className="eyebrow"><Sparkles size={16} /> מסלול אישי • מתמטיקה → חשמל</div>
        <h1>בונים ביטחון במתמטיקה,<br /><em>שלב אחד בכל פעם.</em></h1>
        <p>המערכת זוכרת איפה עצרת, מזהה נושאים חלשים ומחזירה אותך לתרגול ממוקד.</p>
      </section>

      <div className="layout">
        <aside className="panel progressPanel">
          <div className="panelTitle">ההתקדמות שלך</div>
          <div className="progressCircle"><span>{progress}%</span><small>שליטה</small></div>
          <div className="stat"><span>תרגילים שהושלמו</span><b>{completedCount} / {curriculum.length}</b></div>
          <div className="stat"><span>ניסיונות</span><b>{totalAttempts}</b></div>

          <div className="topics">
            <div className="topicHead">שליטה לפי נושא</div>
            {topics.map((topic) => (
              <div className="topic" key={topic}>
                <span>{topic}</span>
                <b>{topicMastery(learning.stats[topic])}%</b>
              </div>
            ))}
          </div>

          {weakTopic && weakTopic.mastery < 70 && (
            <div className="teacherTip">
              <Target size={18} />
              <span>המערכת מזהה שכדאי לחזק את <strong>{weakTopic.topic}</strong>.</span>
            </div>
          )}
        </aside>

        <section className="lesson">
          {completedCount === curriculum.length ? (
            <div className="panel exerciseCard completion">
              <div className="completionIcon"><Trophy size={42} /></div>
              <h2>סיימת את המסלול הראשוני 🎉</h2>
              <p>עכשיו אפשר לחזור על הנושאים החלשים ולבנות מסלול מתקדם יותר לקראת לימודי חשמלאי מוסמך.</p>
              <button className="primary" onClick={reset}>התחל מסלול מחדש <ChevronLeft size={18} /></button>
            </div>
          ) : (
            <>
              <div className="lessonMeta">
                <span className="badge">רמה {exercise.level}</span>
                <span>{exercise.topic}</span>
                <span className="dot" /> תרגיל {completedCount + 1}
              </div>

              <div className="panel exerciseCard">
                <h2>{exercise.title}</h2>
                <div className="question">{exercise.prompt}</div>

                <label htmlFor="answer">התשובה שלך</label>
                <div className="answerRow">
                  <input
                    id="answer"
                    dir="ltr"
                    autoComplete="off"
                    value={answer}
                    onChange={(event) => {
                      setAnswer(event.target.value);
                      setFeedback("idle");
                    }}
                    onKeyDown={(event) => event.key === "Enter" && check()}
                    placeholder="כתוב כאן את התשובה..."
                    disabled={feedback === "correct"}
                  />
                  <button className="primary" onClick={check} disabled={!answer.trim() || feedback === "correct"}>
                    בדוק תשובה <ChevronLeft size={18} />
                  </button>
                </div>

                {feedback === "wrong" && (
                  <div className="feedback hint">
                    <Lightbulb size={20} />
                    <div>
                      <strong>לא נורא — זו בדיוק הדרך ללמוד.</strong>
                      <p>{hint === 1 ? exercise.hint1 : exercise.hint2}</p>
                      {hint === 1 && (
                        <button onClick={() => setHint(2)} className="linkBtn">תן לי רמז נוסף</button>
                      )}
                    </div>
                  </div>
                )}

                {feedback === "correct" && (
                  <div className="feedback success">
                    <CheckCircle2 size={22} />
                    <div>
                      <strong>מצוין! פתרת נכון 🎯</strong>
                      <p>{exercise.explanation}</p>
                      <button onClick={next} className="nextBtn">התרגיל הבא <ChevronLeft size={18} /></button>
                    </div>
                  </div>
                )}

                {feedback === "idle" && (
                  <div className="teacherTip">
                    <Lightbulb size={18} />
                    <span>נסה לפתור לבד. אם נתקעת, בדוק תשובה — תקבל רמז הדרגתי ולא פתרון מיידי.</span>
                  </div>
                )}
              </div>

              {learning.mistakes.length > 0 && (
                <div className="panel mistakesCard">
                  <div className="panelTitle">טעויות שכדאי לחזור עליהן</div>
                  <p>המערכת תשמור את הנושאים האלה ותעדיף אותם כשיבחר התרגיל הבא.</p>
                  <div className="mistakeList">
                    {learning.mistakes.slice(-4).map((id) => {
                      const item = curriculum.find((candidate) => candidate.id === id);
                      return item ? <span key={id}>{item.topic}</span> : null;
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
