"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getSubjectById, getSubjectUnit, subjectCatalog } from "../../../../lib/subject-catalog";
import { evaluateLessonAnswer, lessonForUnit } from "../../../../lib/subject-lessons";
import { DcCircuitLab, OhmsLawLab } from "../../../../components/ElectricalLabs";
import { PlcSimulator } from "../../../../components/PlcSimulator";
import {
  emptySubjectProgress,
  parseSubjectProgress,
  setUnitCompleted,
  SUBJECT_PROGRESS_STORAGE_KEY,
  type SubjectProgress,
} from "../../../../lib/subject-progress";

export default function SubjectUnitPage() {
  const params = useParams<{ subjectId: string; unitId: string }>();
  const subjectId = params.subjectId;
  const unitId = params.unitId;
  const subject = getSubjectById(subjectId);
  const unit = getSubjectUnit(subjectId, unitId);
  const lesson = lessonForUnit(subjectId, unitId);
  const [progress, setProgress] = useState<SubjectProgress>(emptySubjectProgress);
  const [answer, setAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const progressKey = useMemo(() => `${subjectId}:${unitId}`, [subjectId, unitId]);
  const isCompleted = progress.completedUnitIds.includes(progressKey);

  useEffect(() => {
    try {
      setProgress(parseSubjectProgress(window.localStorage.getItem(SUBJECT_PROGRESS_STORAGE_KEY)));
    } catch {
      setProgress(emptySubjectProgress);
    }
  }, []);

  // A Next.js route transition may reuse this page component for the next unit.
  // Never carry an answer or a successful checkpoint into a different lesson.
  useEffect(() => {
    setAnswer(null);
    setChecked(false);
  }, [subjectId, unitId]);

  useEffect(() => {
    if (progress.updatedAt === 0) return;
    try {
      window.localStorage.setItem(SUBJECT_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Storage can be unavailable in private browsing; the lesson remains usable for this session.
    }
  }, [progress]);

  if (!subject || !unit || !lesson) {
    return (
      <main dir="rtl" className="unitPage">
        <div className="unitWrap">
          <h1>יחידת הלימוד לא נמצאה</h1>
          <Link href="/subjects">חזרה למפת הלימודים</Link>
        </div>
      </main>
    );
  }

  const allUnits = subjectCatalog.flatMap((item) => item.units.map((entry) => ({ subjectId: item.id, subjectTitle: item.title, unit: entry })));
  const currentUnitIndex = allUnits.findIndex((item) => item.subjectId === subjectId && item.unit.id === unitId);
  const previousUnit = currentUnitIndex > 0 ? allUnits[currentUnitIndex - 1] : undefined;
  const nextUnit = currentUnitIndex >= 0 ? allUnits[currentUnitIndex + 1] : undefined;
  const answerEvaluation = answer === null ? null : evaluateLessonAnswer(lesson, answer);
  const correct = answerEvaluation?.correct ?? false;

  function toggleComplete() {
    setProgress((current) => setUnitCompleted(current, progressKey, !isCompleted));
  }

  return (
    <main dir="rtl" className="unitPage">
      <style>{`
        .unitPage{min-height:100vh;background:var(--bg);color:var(--ink);padding:26px 18px 60px}
        .unitWrap{max-width:850px;margin:0 auto}
        .unitNav{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:24px}
        .unitNav a{color:#245b91;text-decoration:none;font-weight:700}
        .unitHero{background:linear-gradient(120deg,#122b4d,#1d527b);color:#fff;border-radius:22px;padding:27px;margin-bottom:18px}
        .unitEyebrow{font-size:13px;color:#b9d8f4;font-weight:700;margin-bottom:8px}
        .unitHero h1{font-size:clamp(25px,4vw,34px);line-height:1.25;margin:0 0 9px}
        .unitHero p{color:#e0edf8;line-height:1.7;margin:0}
        .unitCard{background:white;border:1px solid var(--line);border-radius:17px;padding:22px;margin-bottom:14px}
        .unitCard h2{font-size:19px;margin:0 0 12px}
        .unitCard p{line-height:1.8;color:#4b5d73;margin:0}
        .unitMath{display:flex;gap:7px;flex-wrap:wrap;margin-top:14px}
        .unitMath span{background:#edf4fb;color:#315a80;padding:6px 9px;border-radius:8px;font-size:12px}
        .unitSteps{padding-right:22px;margin:14px 0 0;line-height:1.8;color:#334b64}
        .unitChoices{display:grid;gap:9px;margin-top:15px}
        .unitChoice{border:1px solid #d8e1eb;border-radius:11px;padding:12px 14px;text-align:right;background:white;color:#263c55;font:inherit;cursor:pointer}
        .unitChoice.selected{border-color:#2b6397;background:#edf5fc}
        .unitFeedback{margin-top:14px;border-radius:11px;padding:13px;line-height:1.7;background:#eef6f0;color:#28583a}
        .unitFeedback.wrong{background:#fff4e8;color:#81501b}
        .unitSafety{border-right:4px solid #d59a32;background:#fff8e8;color:#72521c;padding:13px 15px;border-radius:9px;line-height:1.7;margin-top:14px}
        .unitComplete{width:100%;border:0;border-radius:12px;background:#183b63;color:#fff;padding:14px;font:inherit;font-weight:800;cursor:pointer}
        .unitComplete.done{background:#e4f3e9;color:#25613c}.unitSequence{align-items:center;background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin:16px 0}.unitSequence a{color:#245b91;text-decoration:none;font-weight:700}.unitSequence span{font-size:12px;color:#748399}
        @media(max-width:600px){.unitPage{padding:16px 12px 40px}.unitHero{padding:22px 18px}.unitCard{padding:18px}}
      `}</style>
      <div className="unitWrap">
        <nav className="unitNav">
          <Link href="/subjects">← מפת המקצועות</Link>
          <Link href={`/subjects#${subject.categoryId}`}>{subject.title}</Link>
        </nav>

        <header className="unitHero">
          <div className="unitEyebrow">ספארקי · {subject.title}</div>
          <h1>{lesson.title}</h1>
          <p>{unit.description}</p>
        </header>

        <section className="unitCard">
          <h2>מבינים את הרעיון</h2>
          <p>{lesson.explanation}</p>
          {unit.mathConnections.length > 0 && (
            <div className="unitMath">{unit.mathConnections.map((item) => <span key={item}>קשר מתמטי: {item}</span>)}</div>
          )}
        </section>

        <section className="unitCard">
          <h2>דוגמה מהעולם המקצועי</h2>
          <p>{lesson.example}</p>
          {lesson.mathWalkthrough && (
            <ol className="unitSteps">{lesson.mathWalkthrough.map((step) => <li key={step}>{step}</li>)}</ol>
          )}
        </section>

        {subjectId === "electrical-theory" && unitId === "electrical-quantities" && <OhmsLawLab />}
        {subjectId === "electrical-theory" && unitId === "dc-circuits" && <DcCircuitLab />}
        {subjectId === "plc" && unitId === "plc-simulation" && <PlcSimulator />}

        <section className="unitCard">
          <h2>בדיקת הבנה קצרה</h2>
          <p>{lesson.checkQuestion}</p>
          <div className="unitChoices" role="group" aria-label="אפשרויות תשובה">
            {lesson.choices.map((choice, index) => (
              <button
                key={choice}
                type="button"
                className={answer === index ? "unitChoice selected" : "unitChoice"}
                aria-pressed={answer === index}
                onClick={() => { setAnswer(index); setChecked(false); }}
              >
                {["א", "ב", "ג", "ד"][index]}. {choice}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="unitComplete"
            style={{ marginTop: 14, opacity: answer === null ? .55 : 1 }}
            disabled={answer === null}
            onClick={() => setChecked(true)}
          >בדיקת התשובה</button>
          {checked && (
            <div className={correct ? "unitFeedback" : "unitFeedback wrong"} role="status">
              <strong>{correct ? "מצוין!" : "עדיין לא. נסה שוב."}</strong>
              <div>{answerEvaluation?.message}</div>
            </div>
          )}
        </section>

        {lesson.safetyNote && <aside className="unitSafety">{lesson.safetyNote}</aside>}

        <nav className="unitNav unitSequence" aria-label="ניווט בין יחידות הלימוד">
          {previousUnit ? <Link href={`/subjects/${previousUnit.subjectId}/${previousUnit.unit.id}`}>← הקודם: {previousUnit.unit.title}</Link> : <span>תחילת מסלול הלימוד</span>}
          <span>יחידה {currentUnitIndex + 1} מתוך {allUnits.length}</span>
          {nextUnit ? <Link href={`/subjects/${nextUnit.subjectId}/${nextUnit.unit.id}`}>הבא: {nextUnit.unit.title} ←</Link> : <Link href="/subjects">סיום המסלול · מפת הלימודים</Link>}
        </nav>

        <section className="unitCard" style={{ marginTop: 15 }}>
          <h2>ההתקדמות שלך</h2>
          <p>{isCompleted ? "היחידה סומנה כהושלמה." : "לאחר הלמידה ובדיקת ההבנה, אפשר לסמן את היחידה כהושלמה."}</p>
          <button type="button" className={isCompleted ? "unitComplete done" : "unitComplete"} onClick={toggleComplete} disabled={!isCompleted && !(checked && correct)} style={{ marginTop: 14, opacity: !isCompleted && !(checked && correct) ? .5 : 1 }}>
            {isCompleted ? "הסר סימון השלמה" : checked && correct ? "סמן יחידה כהושלמה" : "יש לענות נכון על בדיקת ההבנה תחילה"}
          </button>
        </section>
      </div>
    </main>
  );
}
