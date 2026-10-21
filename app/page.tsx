"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import katex from "katex";
import { CheckCircle2, ChevronLeft, Lightbulb, RotateCcw, Sparkles, Target, Trophy, Zap } from "lucide-react";
import type React from "react";
import { curriculum, firstExercise, type Exercise } from "../lib/curriculum";
import { diagnosticAnswerIsCorrect, diagnosticQuestions } from "../lib/diagnostic";
import { buildCheckpoint, checkpointPasses, shouldRunCheckpoint, type CheckpointQuestion } from "../lib/checkpoints";
import { chooseNextExercise, emptyLearningState, loadLearningState, recordAttempt, saveLearningState, topicMastery, recommendedStartingIndex, resolveExercise, dueReviewIds, classifyError, canStartMasteryTest, recordMasteryTest, recordFinalExam, type LearningState } from "../lib/learning";
import { buildTopicMasteryTest, masteryPasses, type MasteryQuestion } from "../lib/mastery";
import { answerMatches, normalizeAnswer } from "../lib/answer-checker";
import { buildFinalExam, finalExamPasses, FINAL_EXAM_REQUIRED, FINAL_EXAM_TOTAL, type FinalExamQuestion } from "../lib/final-exam";
import { ElectricalMiniSimulator } from "../components/ElectricalMiniSimulator";
import { FieldWorkIllustration } from "../components/FieldWorkIllustration";
import { stageForExercise, stageGateSatisfied, stageProgress, stageExercises } from "../lib/stages";

const topics = [...new Set(curriculum.map((exercise) => exercise.topic))];

function normalize(value: string) {
  return normalizeAnswer(value);
}

function isCorrect(answer: string, exercise: Exercise) {
  return answerMatches(answer, exercise.accepted);
}

function toKatexExpression(value: string) {
  return value
    .replace(/([A-Za-z0-9]+)\s*(?:÷|\/)\s*([A-Za-z0-9]+)/g, "\\frac{$1}{$2}")
    .replace(/×/g, "\\times")
    .replace(/−/g, "-");
}

function RenderedMath({ value, displayMode = true }: { value: string; displayMode?: boolean }) {
  const expression = toKatexExpression(value);
  return <span className="renderedMath" dir="ltr" dangerouslySetInnerHTML={{ __html: katex.renderToString(expression, { throwOnError: false, output: "html", displayMode }) }} />;
}

function MathPrompt({ prompt }: { prompt: string }) {
  const normalizedPrompt = prompt.replace(/\\n/g, "\n");
  const expressionPattern = /(?:[A-Za-z0-9]+\s*)?(?:[=+\-−×÷*/]\s*[A-Za-z0-9]+(?:\s*[=+\-−×÷*/]\s*[A-Za-z0-9]+)*)/g;
  const parts: Array<{ type: "text" | "math"; value: string }> = [];
  let lastIndex = 0;

  for (const match of normalizedPrompt.matchAll(expressionPattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) parts.push({ type: "text", value: normalizedPrompt.slice(lastIndex, index) });
    parts.push({ type: "math", value: match[0].trim() });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < normalizedPrompt.length) parts.push({ type: "text", value: normalizedPrompt.slice(lastIndex) });
  if (!parts.some((part) => part.type === "math")) return <div className="promptText">{normalizedPrompt.split("\n").map((line, index) => <span className="promptParagraph" key={index}>{line}</span>)}</div>;

  return (
    <div className="promptStack">
      {parts.map((part, index) =>
        part.type === "math"
          ? <div className="mathLine" dir="ltr" lang="en" key={\`math-\${index}\`}><RenderedMath value={part.value} /></div>
          : part.value.trim()
            ? <div className="promptText" key={index}>{part.value.trim()}</div>
            : null,
      )}
    </div>
  );
}

function NotebookMathPreview({ value }: { value: string }) {
  if (!value.trim()) return <div className="notebookEmpty">הדרך שתכתוב תופיע כאן כמו במחברת, כולל שברים עומדים.</div>;
  return <div className="notebookPreview" aria-label="תצוגת הדרך המתמטית">
    {value.split("\n").map((line, lineIndex) => {
      const fractionPattern = /(-?\d+)\s*\/\s*(-?\d+)/g;
      const parts: Array<{ type: "text" | "fraction"; value: string; key: string }> = [];
      let lastIndex = 0;
      for (const match of line.matchAll(fractionPattern)) {
        const index = match.index ?? 0;
        if (index > lastIndex) parts.push({ type: "text", value: line.slice(lastIndex, index), key: "text-" + lastIndex });
        parts.push({ type: "fraction", value: "\\frac{" + match[1] + "}{" + match[2] + "}", key: "fraction-" + index });
        lastIndex = index + match[0].length;
      }
      if (lastIndex < line.length) parts.push({ type: "text", value: line.slice(lastIndex), key: "text-" + lastIndex });
      return <div className="notebookLine" key={lineIndex} dir="auto">
        {parts.length === 0 ? <span>&nbsp;</span> : parts.map((part) => part.type === "text"
          ? <span key={part.key}>{part.value}</span>
          : <span className="notebookFraction" key={part.key} dir="ltr" dangerouslySetInnerHTML={{ __html: katex.renderToString(part.value, { throwOnError: false, output: "html" }) }} />)}
      </div>;
    })}
  </div>;
}
type NotebookPoint = { x: number; y: number };
type NotebookStroke = { points: NotebookPoint[]; color: string; width: number };

function HandwritingNotebook() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<NotebookStroke[]>([]);
  const [activeStroke, setActiveStroke] = useState<NotebookStroke | null>(null);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const redraw = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(300 * ratio);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.scale(ratio, ratio);
      context.clearRect(0, 0, rect.width, 300);
      const allStrokes = activeStroke ? [...strokes, activeStroke] : strokes;
      for (const stroke of allStrokes) {
        if (!stroke.points.length) continue;
        context.save();
        context.globalCompositeOperation = stroke.color === "eraser" ? "destination-out" : "source-over";
        context.strokeStyle = stroke.color === "eraser" ? "rgba(0,0,0,1)" : stroke.color;
        context.fillStyle = stroke.color === "eraser" ? "rgba(0,0,0,1)" : stroke.color;
        context.lineWidth = stroke.width;
        context.lineCap = "round";
        context.lineJoin = "round";
        const first = stroke.points[0];
        context.beginPath();
        context.moveTo(first.x * rect.width, first.y * 300);
        for (const point of stroke.points.slice(1)) context.lineTo(point.x * rect.width, point.y * 300);
        if (stroke.points.length === 1) {
          context.arc(first.x * rect.width, first.y * 300, stroke.width / 2, 0, Math.PI * 2);
          context.fill();
        } else {
          context.stroke();
        }
        context.restore();
      }
    };
    redraw();
    const observer = new ResizeObserver(redraw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [strokes, activeStroke]);

  function pointFromEvent(event: React.PointerEvent<HTMLCanvasElement>): NotebookPoint {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) };
  }

  function startStroke(event: React.PointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setActiveStroke({ points: [pointFromEvent(event)], color: tool === "eraser" ? "eraser" : "#172033", width: tool === "eraser" ? 20 : 2.6 });
  }

  function continueStroke(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!activeStroke) return;
    event.preventDefault();
    const point = pointFromEvent(event);
    setActiveStroke((current) => current ? { ...current, points: [...current.points, point] } : current);
  }

  function finishStroke() {
    if (activeStroke) setStrokes((current) => [...current, activeStroke]);
    setActiveStroke(null);
  }

  return (
    <section className="handwritingNotebook" aria-label="מחברת כתיבה ביד">
      <div className="handwritingHeader">
        <div><strong>מחברת לכתיבה ביד</strong><span>כתוב עם העכבר, מסך מגע או עט דיגיטלי — ממש כמו במחברת.</span></div>
        <div className="handwritingTools" role="group" aria-label="כלי כתיבה">
          <button type="button" className={tool === "pen" ? "handwritingTool active" : "handwritingTool"} onClick={() => setTool("pen")} aria-pressed={tool === "pen"}>✎ עט</button>
          <button type="button" className={tool === "eraser" ? "handwritingTool active" : "handwritingTool"} onClick={() => setTool("eraser")} aria-pressed={tool === "eraser"}>⌫ מחק</button>
          <button type="button" className="handwritingTool" onClick={() => setStrokes((current) => current.slice(0, -1))} disabled={!strokes.length} title="ביטול הקו האחרון">↶ ביטול</button>
          <button type="button" className="handwritingTool clear" onClick={() => { setStrokes([]); setActiveStroke(null); }} disabled={!strokes.length && !activeStroke}>נקה הכול</button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="handwritingCanvas"
        aria-label="אזור כתיבה ביד. השתמש בעט, בעכבר או באצבע."
        onPointerDown={startStroke}
        onPointerMove={continueStroke}
        onPointerUp={finishStroke}
        onPointerCancel={finishStroke}
      />
      <div className="handwritingFootnote">הכתיבה ביד היא לליווי הפתרון. אפשר גם להקליד מתחת; הטקסט המוקלד הוא זה שניתן לקרוא ולבדוק אוטומטית.</div>
    </section>
  );
}

type FormulaChoiceProfile = {
  title: string;
  known: string;
  target: string;
  correct: string;
  explanation: string;
};

const formulaChoiceProfiles: Record<string, FormulaChoiceProfile> = {
  "formula-1": { title: "איזו נוסחה תעזור למצוא התנגדות?", known: "נתונים מתח V וזרם I; מחפשים התנגדות R.", target: "R", correct: "R = V ÷ I", explanation: "כשמחפשים התנגדות ומכירים מתח וזרם, מחלקים את המתח בזרם: R = V ÷ I." },
  "formula-2": { title: "בחר נוסחה לבידוד ההתנגדות", known: "ב־V = I × R מחפשים את R.", target: "R", correct: "R = V ÷ I", explanation: "כדי להשאיר את R לבד, מחלקים את שני הצדדים ב־I. מתקבלת הנוסחה R = V ÷ I." },
  "formula-3": { title: "בחר נוסחה לבידוד הזרם", known: "ב־V = I × R מחפשים את I.", target: "I", correct: "I = V ÷ R", explanation: "כדי להשאיר את I לבד, מחלקים את שני הצדדים ב־R. מתקבלת הנוסחה I = V ÷ R." },
  "ohm-1": { title: "איזו נוסחה מתאימה לחישוב הזרם?", known: "ידועים המתח V וההתנגדות R; מחפשים זרם I.", target: "I", correct: "I = V ÷ R", explanation: "חוק אוהם: זרם שווה למתח חלקי התנגדות. רק אחרי בחירת הנוסחה מציבים את הנתונים." },
  "ohm-2": { title: "איזו נוסחה מתאימה לחישוב ההתנגדות?", known: "ידועים המתח V והזרם I; מחפשים התנגדות R.", target: "R", correct: "R = V ÷ I", explanation: "חוק אוהם: התנגדות שווה למתח חלקי זרם." },
  "electrical-ohm-sub-1": { title: "בחר נוסחה לפני שמציבים מספרים", known: "נתונים מתח 12V והתנגדות 4Ω; מחפשים זרם.", target: "I", correct: "I = V ÷ R", explanation: "כשנתונים מתח והתנגדות ומחפשים זרם, משתמשים ב־I = V ÷ R. עכשיו אפשר להציב 12 ÷ 4." },
  "power-1": { title: "איזו נוסחה מתאימה לחישוב ההספק?", known: "ידועים המתח V והזרם I; מחפשים הספק P.", target: "P", correct: "P = V × I", explanation: "הספק חשמלי מחושב על ידי כפל המתח בזרם: P = V × I." },
  "power-2": { title: "בחר נוסחה לחישוב ההספק", known: "ידועים המתח V והזרם I; מחפשים הספק P.", target: "P", correct: "P = V × I", explanation: "הספק חשמלי מחושב על ידי כפל המתח בזרם: P = V × I." },
  "electrical-power-sub-1": { title: "איך מוצאים זרם כשנתונים הספק ומתח?", known: "נתונים הספק P ומתח V; מחפשים זרם I.", target: "I", correct: "I = P ÷ V", explanation: "מתחילים מ־P = V × I ומחלקים את שני הצדדים ב־V. לכן I = P ÷ V." }
};

const formulaOptions = ["V = I × R", "I = V ÷ R", "R = V ÷ I", "P = V × I", "I = P ÷ V"];

function FormulaChoicePanel({ exercise }: { exercise: Exercise }) {
  const profile = formulaChoiceProfiles[exercise.id];
  const [selected, setSelected] = useState("");
  const [showReference, setShowReference] = useState(() => ["formula-1", "formula-2", "formula-3"].includes(exercise.id));
  if (!profile) return null;
  const correct = selected === profile.correct;
  return (
    <section className="formulaChoicePanel" aria-label="לומדים לבחור נוסחה">
      <div className="formulaChoiceTitle"><span aria-hidden="true">⚡</span><div><strong>קודם בוחרים נוסחה</strong><p>{profile.title}</p></div></div>
      <p className="formulaChoiceKnown">{profile.known}</p>
      <div className="formulaChoiceOptions" role="group" aria-label="בחירת נוסחה">
        {formulaOptions.map((formula) => (
          <button key={formula} type="button" dir="ltr"
            className={"formulaChoiceOption" + (selected === formula ? (correct ? " correct" : " incorrect") : "")}
            aria-pressed={selected === formula}
            onClick={() => setSelected(formula)}><RenderedMath value={formula} displayMode={false} /></button>
        ))}
      </div>
      {selected && <div className={"formulaChoiceFeedback " + (correct ? "correct" : "incorrect")} role="status">
        <strong>{correct ? "נכון! בחרת לפי הנתונים והמבוקש." : "לא בדיוק — בדוק איזה גודל צריך למצוא."}</strong>
        {correct && <p>{profile.explanation}</p>}
        {!correct && <p>אל תתחיל מהמספרים: קודם זהה מה נתון ומה מחפשים, ואז בחר נוסחה שמכילה אותם.</p>}
      </div>}
      <button type="button" className="formulaReferenceToggle" aria-expanded={showReference} onClick={() => setShowReference((value) => !value)}>
        {showReference ? "הסתר דף נוסחאות" : "צריך עזרה? פתח דף נוסחאות"}
      </button>
      {showReference && <div className="formulaReference" aria-label="דף נוסחאות חשמל">
        <div><b dir="ltr"><RenderedMath value="V = I × R" displayMode={false} /></b><span>חוק אוהם — מתח</span></div>
        <div><b dir="ltr"><RenderedMath value="I = V ÷ R" displayMode={false} /></b><span>זרם כשידועים מתח והתנגדות</span></div>
        <div><b dir="ltr"><RenderedMath value="R = V ÷ I" displayMode={false} /></b><span>התנגדות כשידועים מתח וזרם</span></div>
        <div><b dir="ltr"><RenderedMath value="P = V × I" displayMode={false} /></b><span>הספק כשידועים מתח וזרם</span></div>
        <div><b dir="ltr"><RenderedMath value="I = P ÷ V" displayMode={false} /></b><span>זרם כשידועים הספק ומתח</span></div>
        <small>V — מתח (וולט) · I — זרם (אמפר) · R — התנגדות (אוהם) · P — הספק (וואט)</small>
      </div>}
    </section>
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

type GuidedSolutionStep = { title: string; question: string; options: string[]; correct: string; explanation: string };

function buildGuidedSolutionSteps(exercise: Exercise): GuidedSolutionStep[] {
  const prompt = exercise.prompt;
  const id = exercise.id;
  const topic = exercise.topic;
  let firstQuestion = "מה כדאי לזהות קודם?";
  let correctMethod = "לזהות מה נתון ומה מבקשים למצוא";
  let methodOptions = [correctMethod, "להתחיל לחשב בלי לבחור פעולה", "לנחש את התוצאה הסופית"];
  let methodExplanation = "קודם מזהים מה ידוע ומה צריך למצוא, ורק אז בוחרים דרך.";

  if (/ohm|power|חשמל/i.test(id + " " + topic) && (/\bI\s*=|זרם|\bR\s*=|התנגדות|\bP\s*=|הספק/i.test(prompt + " " + exercise.teachingNote))) {
    firstQuestion = "איזו נוסחה מתאימה למה שמבקשים למצוא?";
    if (/\bP\s*=|הספק/i.test(prompt + " " + exercise.teachingNote)) correctMethod = "P = V × I";
    else if (/\bR\s*=|התנגדות/i.test(prompt + " " + exercise.teachingNote)) correctMethod = "R = V ÷ I";
    else correctMethod = "I = V ÷ R";
    methodOptions = [correctMethod, correctMethod === "I = V ÷ R" ? "I = V × R" : "I = V ÷ R", "P = V × I", "V = I × R"].filter((value, index, all) => all.indexOf(value) === index);
    if (!methodOptions.includes(correctMethod)) methodOptions.unshift(correctMethod);
    methodExplanation = "בחרנו נוסחה לפי הגודל שאותו צריך לחשב. לפני החישוב מוודאים שהנוסחה מתאימה לנתונים.";
  } else if (/X\s*\+\s*\d+\s*=/.test(prompt)) {
    correctMethod = "לחסר מהתוצאה את המספר שמחובר ל־X";
    methodOptions = [correctMethod, "להוסיף לתוצאה את המספר שמחובר ל־X", "לכפול את שני המספרים"];
    firstQuestion = "איך מבטלים את החיבור ליד X?";
    methodExplanation = "הפעולה ההפוכה לחיבור היא חיסור.";
  } else if (/X\s*[−-]\s*\d+\s*=/.test(prompt)) {
    correctMethod = "להוסיף לתוצאה את המספר שהוחסר";
    methodOptions = [correctMethod, "לחסר שוב את אותו מספר", "לחלק את התוצאה באותו מספר"];
    firstQuestion = "איך מבטלים את החיסור ליד X?";
    methodExplanation = "הפעולה ההפוכה לחיסור היא חיבור.";
  } else if (/\d+\s*[×x]\s*X|\d+X/.test(prompt)) {
    correctMethod = "לחלק במספר שמכפיל את X";
    methodOptions = [correctMethod, "לכפול שוב באותו מספר", "להוסיף את המספר לתוצאה"];
    firstQuestion = "איך משאירים את X לבד כשהוא מוכפל?";
    methodExplanation = "הפעולה ההפוכה לכפל היא חילוק.";
  } else if (/X\s*[÷/]\s*\d+/.test(prompt)) {
    correctMethod = "לכפול את התוצאה במספר שבו חילקו";
    methodOptions = [correctMethod, "לחלק שוב באותו מספר", "להחסיר את המספר מהתוצאה"];
    firstQuestion = "איך מבטלים את החילוק ליד X?";
    methodExplanation = "הפעולה ההפוכה לחילוק היא כפל.";
  } else if (/×/.test(prompt) && /\+|\-/.test(prompt) && !/\(/.test(prompt)) {
    correctMethod = "לבצע כפל לפני חיבור או חיסור";
    methodOptions = [correctMethod, "לבצע תמיד חיבור לפני כפל", "לחשב משמאל לימין בלי להתחשב בסדר פעולות"];
    firstQuestion = "איזו פעולה מבצעים קודם?";
    methodExplanation = "לפי סדר הפעולות, כפל וחילוק קודמים לחיבור וחיסור.";
  } else if (/שבר|fraction/i.test(topic + " " + id)) {
    correctMethod = /צמצם|צמצום/.test(prompt) ? "לחלק את המונה והמכנה באותו מספר" : /\+/.test(prompt) ? "לבדוק אם המכנים שווים לפני שמחברים" : "לזהות את המונה ואת המכנה";
    methodOptions = [correctMethod, "לשנות רק את המונה", "לחבר את המונה והמכנה יחד"];
    firstQuestion = "מהו הצעד הנכון בעבודה עם השבר?";
    methodExplanation = "בשברים חשוב לשמור על הקשר בין המונה למכנה ולא לשנות רק אחד מהם.";
  } else if (/חזקה/.test(topic) || /\^|²/.test(prompt)) {
    correctMethod = "לכפול את המספר בעצמו לפי מספר הפעמים שבחזקה";
    methodOptions = [correctMethod, "לחבר את המספר לעצמו", "להכפיל את המספר בחזקה"];
    firstQuestion = "איך מחשבים חזקה שנייה?";
    methodExplanation = "חזקה שנייה פירושה כפל של המספר בעצמו.";
  }

  let nextStepQuestion = "מהו הצעד הבא בדרך לפתרון?";
  let nextStepCorrect = exercise.hint1;
  let nextStepOptions = [exercise.hint1, exercise.hint2, "לכתוב את התוצאה בלי לבדוק את הנתונים"].filter((value, index, all) => value.trim() && all.indexOf(value) === index);
  let nextStepExplanation = exercise.hint1;
  const sameDenominatorAddition = prompt.match(/(\d+)\s*\/\s*(\d+)\s*\+\s*(\d+)\s*\/\s*(\d+)/);
  if (sameDenominatorAddition && sameDenominatorAddition[2] === sameDenominatorAddition[4]) {
    const numeratorA = Number(sameDenominatorAddition[1]);
    const denominator = Number(sameDenominatorAddition[2]);
    const numeratorB = Number(sameDenominatorAddition[3]);
    const step = `(${numeratorA} + ${numeratorB}) / ${denominator} = ${numeratorA + numeratorB} / ${denominator}`;
    nextStepQuestion = "איך כותבים את החיבור כשיש לשני השברים אותו מכנה?";
    nextStepCorrect = step;
    nextStepOptions = [step, `${numeratorA + numeratorB} / ${denominator + 1}`, `${numeratorA} / ${denominator + numeratorB}`];
    nextStepExplanation = "מחברים את המונים ומשאירים את המכנה כפי שהוא.";
  }
  const accepted = exercise.accepted[0] ?? "";
  const answerOptions = [accepted];
  const normalizedAccepted = accepted.trim().toLowerCase();
  const distractors = /\//.test(accepted) ? ["1/3", "1/4", "2/5"] : /^[a-zA-Z]+$/.test(accepted) ? ["X", "V", "I", "R", "P"] : /^-?\d+(\.\d+)?/.test(accepted) ? [String(Number.parseFloat(accepted) + 1), String(Math.max(0, Number.parseFloat(accepted) - 1)), String(Number.parseFloat(accepted) * 2)] : ["לא ניתן לחשב", "אין מספיק נתונים", "0"];
  for (const option of distractors) {
    if (option.toLowerCase() !== normalizedAccepted && !answerOptions.includes(option)) answerOptions.push(option);
    if (answerOptions.length >= 4) break;
  }

  return [
    { title: "שלב 1 מתוך 3 — בחירת דרך", question: firstQuestion, options: methodOptions, correct: correctMethod, explanation: methodExplanation },
    { title: "שלב 2 מתוך 3 — כותבים את הצעד", question: nextStepQuestion, options: nextStepOptions, correct: nextStepCorrect, explanation: nextStepExplanation },
    { title: "שלב 3 מתוך 3 — בחירת תשובה", question: "מהי התשובה לתרגיל?", options: answerOptions, correct: accepted, explanation: exercise.explanation },
  ];
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

function LessonVisual({ exercise }: { exercise: Exercise }) {
  const id = exercise.id;
  if (id.includes("fraction")) {
    const isReduction = id.includes("reduce");
    const count = isReduction ? 8 : 7;
    const filled = id.includes("reduce") ? 4 : id.includes("add") ? 5 : 3;
    return <div className="learningVisual" aria-label="המחשה חזותית של שברים">
      <div className="visualHeading"><span>👀</span><strong>{isReduction ? "אותו חלק — פחות חתיכות" : "שבר הוא חלק מתוך שלם"}</strong></div>
      <div className="fractionVisual">
        <div className="fractionBar" dir="ltr">{Array.from({length: count}, (_, i) => <span key={i} className={i < filled ? "piece filled" : "piece"} />)}</div>
        <div className="fractionLabels" dir="ltr"><strong>{isReduction ? "4 / 8" : id.includes("add") ? "2/7 + 3/7" : "חלקים מתוך שלם"}</strong><span>{isReduction ? "4 חלקים צבועים מתוך 8" : "המכנה מספר את כל החלקים"}</span></div>
      </div>
    </div>;
  }
  if (id.includes("geometry") || id.includes("units")) {
    const circle = id.includes("diameter") || id.includes("radius") || id.includes("circle");
    const area = id.includes("area");
    return <div className="learningVisual" aria-label="המחשה חזותית של גאומטריה ומידות">
      <div className="visualHeading"><span>📐</span><strong>{circle ? "מכירים את המעגל" : area ? "שטח הוא המקום שבתוך הצורה" : "ממירים יחידות באותו אורך"}</strong></div>
      <svg className="lessonDiagram" viewBox="0 0 320 150" role="img" aria-label={circle ? "מעגל עם רדיוס וקוטר" : "מלבן עם אורך ורוחב"}>
        {circle ? <><circle cx="160" cy="75" r="52" fill="#dbeafe" fillOpacity=".8" stroke="#2563eb" strokeWidth="3"/><line x1="108" y1="75" x2="212" y2="75" stroke="#dc2626" strokeWidth="3"/><line x1="160" y1="75" x2="212" y2="75" stroke="#0f766e" strokeWidth="4"/><circle cx="160" cy="75" r="4" fill="#172033"/><text x="160" y="62" textAnchor="middle" fontSize="12" fill="#172033">מרכז</text><text x="160" y="99" textAnchor="middle" fontSize="12" fill="#991b1b">קוטר</text><text x="190" y="66" textAnchor="middle" fontSize="11" fill="#0f766e">רדיוס</text></> : <><rect x="65" y="30" width="190" height="90" rx="4" fill="#dbeafe" stroke="#2563eb" strokeWidth="3"/><text x="160" y="22" textAnchor="middle" fontSize="13" fill="#1d4ed8">אורך</text><text x="160" y="79" textAnchor="middle" fontSize="17" fontWeight="700" fill="#1e3a8a">שטח = אורך × רוחב</text><text x="42" y="78" textAnchor="middle" fontSize="12" fill="#1d4ed8">רוחב</text></>}
      </svg>
      <p className="visualCaption">{circle ? "הקוטר עובר דרך המרכז; הרדיוס הוא חצי ממנו." : area ? "סופרים כמה מקום הצורה תופסת — ביחידות בריבוע." : "מ־מ״מ לס״מ מחלקים ב־10; מס״מ למטר מחלקים ב־100."}</p>
    </div>;
  }
  if (id.includes("ohm") || id.includes("power") || id.includes("formula")) {
    return <div className="learningVisual" aria-label="המחשה חזותית של נוסחה">
      <div className="visualHeading"><span>⚡</span><strong>נוסחה היא מתכון עם מקומות למספרים</strong></div>
      <div className="formulaVisual" dir="ltr"><span className="formulaChip">V</span><span className="formulaOperator">=</span><span className="formulaChip">I</span><span className="formulaOperator">×</span><span className="formulaChip">R</span></div>
      <div className="formulaLegend"><span><i className="legendVoltage"/>V = מתח (וולט)</span><span><i className="legendCurrent"/>I = זרם (אמפר)</span><span><i className="legendResistance"/>R = התנגדות (אוהם)</span></div>
      <p className="visualCaption">קודם מזהים מה נתון ומה מחפשים, ורק אז מציבים מספרים.</p>
    </div>;
  }
  return <div className="learningVisual" aria-label="המחשה חזותית של שלבי פתרון">
    <div className="visualHeading"><span>🧩</span><strong>פותרים צעד אחד בכל פעם</strong></div>
    <div className="stepVisual"><span><b>1</b> קוראים</span><i>←</i><span><b>2</b> בוחרים פעולה</span><i>←</i><span><b>3</b> מחשבים</span></div>
  </div>;
}


function InteractiveLab({ exercise }: { exercise: Exercise }) {
  const [a, setA] = useState(12);
  const [b, setB] = useState(6);
  const [length, setLength] = useState(5);
  const [width, setWidth] = useState(3);
  const [x, setX] = useState(4);
  const isElectrical = /ohm|power|חשמל/i.test(exercise.id + " " + exercise.topic);
  const isFraction = exercise.id.includes("fraction") && exercise.id.includes("reduce");
  const isArea = /area-rectangle|area-square/i.test(exercise.id);
  const isBeginner = exercise.id.startsWith("zero-");
  if (!isElectrical && !isArea && !isBeginner && !isFraction) return null;
  return <section className="interactiveLab" aria-label="מעבדת למידה אינטראקטיבית">
    <div className="labTitle"><span>{isElectrical ? "⚡" : isArea ? "📐" : isFraction ? "🧩" : "⚖️"}</span><div><strong>{isElectrical ? "מעבדת חוק אוהם" : isArea ? "מעבדת שטח" : isFraction ? "מעבדת שברים" : "מאזני הנעלם"}</strong><small>שנו את הערכים וראו מיד מה משתנה</small></div></div>
    {isFraction ? <>
      <div className="fractionLabBar" dir="ltr">{Array.from({length:b},(_,i)=><span key={i} className={i<a?"isFilled":""}/>)}</div>
      <div className="labControls"><label>מונה — החלקים הצבועים <b>{Math.min(a,b)}</b><input aria-label="מונה השבר" type="range" min="1" max={b} value={Math.min(a,b)} onChange={e=>setA(Number(e.target.value))}/></label><label>מכנה — כל החלקים <b>{b}</b><input aria-label="מכנה השבר" type="range" min="2" max="12" value={b} onChange={e=>{const next=Number(e.target.value);setB(next);setA(Math.min(next,a))}}/></label></div>
      <div className="labAnswer"><small>השבר שמוצג</small><strong>{Math.min(a,b)} / {b}</strong></div><p>כדי לצמצם שבר, מחלקים את המונה והמכנה באותו מספר. החלק של השלם נשאר שווה.</p>
    </> : isElectrical ? <>
      <div className="labFormula" dir="ltr"><b>V = I × R</b></div>
      <div className="labControls">
        <label>מתח (וולט) <b>{a} V</b><input aria-label="מתח" type="range" min="1" max="24" value={a} onChange={e=>setA(Number(e.target.value))}/></label>
        <label>התנגדות (אוהם) <b>{b} Ω</b><input aria-label="התנגדות" type="range" min="1" max="12" value={b} onChange={e=>setB(Number(e.target.value))}/></label>
      </div>
      <div className="labAnswer"><small>הזרם = מתח ÷ התנגדות</small><strong>{a} ÷ {b} = {(a/b).toFixed(2)} אמפר</strong></div>
      <p>נסו להגדיל את המתח, ואז את ההתנגדות. מתי הזרם גדל ומתי הוא קטן?</p>
    </> : isArea ? <>
      <div className="labShape"><div style={{width:`${length*8}%`,height:`${width*13}px`}}><span>{length} × {width}</span></div></div>
      <div className="labControls">
        <label>אורך <b>{length}</b><input aria-label="אורך" type="range" min="2" max="8" value={length} onChange={e=>setLength(Number(e.target.value))}/></label>
        <label>רוחב <b>{width}</b><input aria-label="רוחב" type="range" min="1" max="5" value={width} onChange={e=>setWidth(Number(e.target.value))}/></label>
      </div>
      <div className="labAnswer"><small>שטח = אורך × רוחב</small><strong>{length} × {width} = {length*width} יחידות²</strong></div>
    </> : <>
      <div className="labEquation" dir="ltr"><b>{x}</b><span>+</span><b>3</b><span>=</span><b>7</b></div>
      <label className="labSingle">שנו את הנעלם x <b>{x}</b><input aria-label="ערך הנעלם" type="range" min="0" max="7" value={x} onChange={e=>setX(Number(e.target.value))}/></label>
      <div className={"labAnswer " + (x === 4 ? "labCorrect" : "")}><small>{x === 4 ? "מצוין — מצאתם את הפתרון" : "נסו למצוא מספר שמשלים ל־7"}</small><strong>{x} + 3 {x + 3 === 7 ? "=" : "≠"} 7</strong></div>
      <p>כדי למצוא את x, חשבו 7 פחות 3. הפתרון הוא 4, כי 4 + 3 = 7.</p>
    </>}
  </section>;
}

export default function Home() {
  const [learning, setLearning] = useState<LearningState>(emptyLearningState);
  const [answer, setAnswer] = useState("");
  const [solutionMethod, setSolutionMethod] = useState("");
  const [guidedStepIndex, setGuidedStepIndex] = useState(0);
  const [showGuidedSolution, setShowGuidedSolution] = useState(false);
  const [guidedFeedback, setGuidedFeedback] = useState<"idle" | "wrong" | "correct" | "complete">("idle");
  const [showFreeformSolution, setShowFreeformSolution] = useState(false);
  const solutionTextareaRef = useRef<HTMLTextAreaElement>(null);

  function insertSolutionText(text: string) {
    const field = solutionTextareaRef.current;
    const start = field?.selectionStart ?? solutionMethod.length;
    const end = field?.selectionEnd ?? solutionMethod.length;
    const next = solutionMethod.slice(0, start) + text + solutionMethod.slice(end);
    setSolutionMethod(next);
    requestAnimationFrame(() => {
      const textarea = solutionTextareaRef.current;
      if (!textarea) return;
      textarea.focus();
      const caret = start + text.length;
      textarea.setSelectionRange(caret, caret);
    });
  }
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
  const guidedSolutionSteps = useMemo(() => buildGuidedSolutionSteps(exercise), [exercise]);
  const currentGuidedStep = guidedSolutionSteps[guidedStepIndex];
  useEffect(() => {
    setGuidedStepIndex(0);
    setGuidedFeedback("idle");
    setShowGuidedSolution(false);
    setShowFreeformSolution(false);
  }, [exercise.id]);

  function chooseGuidedOption(option: string) {
    if (!currentGuidedStep || guidedFeedback === "complete") return;
    if (option.trim().toLowerCase() !== currentGuidedStep.correct.trim().toLowerCase()) {
      setGuidedFeedback("wrong");
      return;
    }
    if (guidedStepIndex === guidedSolutionSteps.length - 1) {
      setGuidedFeedback("complete");
      return;
    }
    setGuidedStepIndex((step) => step + 1);
    setGuidedFeedback("idle");
  }
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
    if (shouldRunCheckpoint(learning.completed.length, learning.checkpointsCompleted, learning.errors.reduce((sum, error) => sum + error.count, 0))) {
      const number = Math.floor(learning.completed.length / 5);
      setCheckpointQuestions(buildCheckpoint(curriculum, number, learning.completed));
      setCheckpointIndex(0); setCheckpointAnswer(""); setCheckpointFeedback("idle"); setCheckpointAttempts(0); setCheckpointCorrectCount(0); setCheckpointMessage(""); setCheckpointOpen(true);
    }
  }, [ready, diagnosticOpen, checkpointOpen, learning.completed.length, learning.checkpointsCompleted, learning.errors]);

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
      setAnswer(""); setSolutionMethod(""); setHint(0); setFeedback("idle");
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
    setAnswer(""); setSolutionMethod(""); setHint(0); setFeedback("idle");
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
    setLearning(emptyLearningState); setActiveExercise(firstExercise); setAnswer(""); setSolutionMethod(""); setHint(0); setFeedback("idle");
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
              <button className="primary diagnosticSubmit" onClick={submitCheckpoint} disabled={!checkpointAnswer.trim()}>בדוק תשובה</button>
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
        <div className="startFromBasics" aria-label="מסלול לימוד מהבסיס"><Sparkles size={16}/> לומדים מהבסיס</div>
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
              ) : masteryOpen ? (
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
                <LessonVisual exercise={exercise} />
                <FieldWorkIllustration exercise={exercise} />
                <InteractiveLab exercise={exercise} />
                <ElectricalMiniSimulator topic={exercise.topic} />
                <FormulaChoicePanel key={exercise.id} exercise={exercise} />
                <div className="question"><MathPrompt prompt={exercise.prompt} /></div>

                <button type="button" className="guidedSolutionToggle" aria-expanded={showGuidedSolution} onClick={() => setShowGuidedSolution((visible) => !visible)}>
                  <span><strong>{showGuidedSolution ? "הסתר פתרון מודרך" : "נתקעת? פתח פתרון מודרך"}</strong><small>{showGuidedSolution ? "חזור לתרגיל ונסה לפתור בעצמך" : "רמזים ושלבי פתרון ייחשפו רק אם תבקש עזרה"}</small></span>
                  <span className="guidedSolutionToggleIcon" aria-hidden="true">{showGuidedSolution ? "−" : "+"}</span>
                </button>
                {showGuidedSolution && (
                  <section className="guidedSolution" aria-label="פתרון מודרך לפי שלבים">
                    <div className="guidedSolutionHeader">
                      <div><strong>נפתור יחד, לפי הסדר</strong><span>בחר אפשרות בכל שלב. אחרי בחירה נכונה ייפתח השלב הבא.</span></div>
                      <span className="guidedProgress">{guidedFeedback === "complete" ? "3/3" : `${guidedStepIndex + 1}/${guidedSolutionSteps.length}`}</span>
                    </div>
                    <div className="guidedProgressTrack"><span style={{ width: `${guidedFeedback === "complete" ? 100 : (guidedStepIndex / guidedSolutionSteps.length) * 100}` + "%" }} /></div>
                    {guidedFeedback === "complete" ? (
                      <div className="guidedComplete"><CheckCircle2 size={22} /><div><strong>כל הכבוד — השלמת את דרך הפתרון!</strong><p>{currentGuidedStep?.explanation}</p><button type="button" className="solutionStepButton" onClick={() => { setGuidedStepIndex(0); setGuidedFeedback("idle"); }}>תרגל שוב את הדרך</button></div></div>
                    ) : currentGuidedStep ? (
                      <div className="guidedStep">
                        <div className="guidedStepTitle">{currentGuidedStep.title}</div>
                        <p>{currentGuidedStep.question}</p>
                        <div className="guidedChoiceList">
                          {currentGuidedStep.options.map((option) => <button key={option} type="button" className="guidedChoice" onClick={() => chooseGuidedOption(option)}>{option}</button>)}
                        </div>
                        {guidedFeedback === "wrong" && <div className="guidedChoiceFeedback wrong" role="status">לא בדיוק. נסה אפשרות אחרת; אפשר להיעזר ברמז שמופיע בהמשך המסך.</div>}
                        {guidedFeedback === "correct" && <div className="guidedChoiceFeedback success" role="status">נכון! עוברים לשלב הבא.</div>}
                      </div>
                    ) : null}
            
                  </section>
                )}
                <div className="finalAnswerPanel">
                <label htmlFor="answer">התשובה הסופית שלך</label>
                <div className="answerRow">
                  <input id="answer" dir="ltr" autoComplete="off" value={answer}
                    onChange={(event) => { setAnswer(event.target.value); setFeedback("idle"); }}
                    onKeyDown={(event) => event.key === "Enter" && check()}
                    placeholder="כתוב כאן את התשובה..." disabled={feedback === "correct"} />
                  <button className="primary" onClick={check} disabled={!answer.trim() || feedback === "correct"}>בדוק תשובה</button>
                </div>
                </div>
                <button type="button" className="freeformToggle" aria-expanded={showFreeformSolution} onClick={() => setShowFreeformSolution((visible) => !visible)}>
                  <span>{showFreeformSolution ? "הסתרת כתיבה חופשית" : "רוצה לכתוב גם את הדרך בעצמך?"}</span>
                  <span aria-hidden="true">{showFreeformSolution ? "−" : "+"}</span>
                </button>
                {showFreeformSolution && (
                <div className="solutionMethodField">
                  <div className="solutionBuilderHeading">
                    <label htmlFor="solution-method">רוצה גם לכתוב את הדרך במילים שלך?</label>
                    <span>אפשר להיעזר בכפתורים או לכתוב בחופשיות.</span>
                  </div>
                  <div className="solutionStepButtons" aria-label="הוספת שלב לפתרון">
                    {[
                      { label: "1. הנוסחה", value: "נוסחה: " },
                      { label: "2. הצבת מספרים", value: "הצבה: " },
                      { label: "3. החישוב", value: "חישוב: " },
                      { label: "4. בדיקה", value: "בדיקה: " },
                    ].map((step) => (
                      <button key={step.label} type="button" className="solutionStepButton"
                        onMouseDown={(event) => event.preventDefault()} onClick={() => insertSolutionText((solutionMethod && !solutionMethod.endsWith("\n") ? "\n" : "") + step.value)}>
                        {step.label}
                      </button>
                    ))}
                  </div>
                  <div className="solutionSymbols" aria-label="הוספת סימן מתמטי">
                    {[
                      { label: "½ שבר", value: "3/4" },
                      { label: "+ חיבור", value: " + " }, { label: "− חיסור", value: " − " },
                      { label: "× כפל", value: " × " }, { label: "÷ חילוק", value: " ÷ " },
                      { label: "= שווה", value: " = " }, { label: "² חזקה", value: "²" },
                      { label: "√ שורש", value: "√" }, { label: "V מתח", value: "V" },
                      { label: "I זרם", value: "I" }, { label: "R התנגדות", value: "R" },
                      { label: "P הספק", value: "P" }, { label: "Ω אוהם", value: "Ω" },
                    ].map((symbol) => (
                      <button key={symbol.label} type="button" className="solutionSymbolButton"
                        onMouseDown={(event) => event.preventDefault()} onClick={() => insertSolutionText(symbol.value)}>
                        {symbol.label}
                      </button>
                    ))}
                  </div>
                  <HandwritingNotebook />
                  <div className="notebookEditorWrap">
                    <div className="notebookEditorHeading">
                      <strong>או הקלד את הדרך והנוסחאות</strong>
                      <span>אפשר להקליד רגיל; לדוגמה, 3/4 יוצג בתצוגה כשבר עומד כמו במחברת.</span>
                    </div>
                    <textarea ref={solutionTextareaRef} id="solution-method" dir="auto" rows={5} value={solutionMethod}
                      onChange={(event) => setSolutionMethod(event.target.value)}
                      placeholder={"לדוגמה:\n3/4 + 1/4 = 1\nהשלב הבא: 2 × 5 = 10"}
                      aria-describedby="solution-method-help" />
                    <div className="notebookPreviewLabel">תצוגת הנוסחאות שהקלדת</div>
                    <NotebookMathPreview value={solutionMethod} />
                  </div>
                  <div className="solutionWritingTips" id="solution-method-help">
                    <strong>אפשר לכתוב ממש במילים שלך</strong>
                    <span>למשל: „חילקתי את המתח בהתנגדות, ולכן הזרם הוא 2 אמפר”.</span>
                    <small>הבחירות המודרכות בודקות את השלבים שבחרת; בדיקת התרגיל הראשית עדיין בודקת את התשובה הסופית.</small>
                  </div>
                </div>
                )}

                {feedback === "wrong" && <div className="feedback hint"><Lightbulb size={20} /><div><strong>לא נורא. אנחנו לומדים צעד־צעד.</strong><MathPrompt prompt={errorGuidance(exercise, answer)} /><MathPrompt prompt={hint === 1 ? exercise.hint1 : exercise.hint2} />{hint === 1 && <button onClick={() => setHint(2)} className="linkBtn">אני צריך עוד רמז</button>}</div></div>}
                {feedback === "correct" && <div className="feedback success"><CheckCircle2 size={22} /><div><strong>מצוין! 🎯</strong><MathPrompt prompt={exercise.explanation} />{(learning.reviews[exercise.id]?.lapses ?? 0) >= 2 && <small>היו כמה טעויות בנושא הזה, אז נחזור אליו בקצרה בהמשך.</small>}<button onClick={next} className="nextBtn">התרגיל הבא <ChevronLeft size={18} /></button></div></div>}
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
