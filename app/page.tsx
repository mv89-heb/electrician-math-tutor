"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, Lightbulb, RotateCcw, Sparkles, Zap } from "lucide-react";
import { curriculum, firstExercise, type Exercise } from "../lib/curriculum";

function normalize(value:string) {
  return value.trim().toLowerCase()
    .replaceAll(" ","")
    .replaceAll("×","*")
    .replaceAll("÷","/")
    .replaceAll("²","^2")
    .replaceAll("−","-")
    .replace(/[.,!?]/g,"");
}

function isCorrect(answer:string, exercise:Exercise) {
  const a=normalize(answer);
  return exercise.accepted.some(v=>normalize(v)===a);
}

export default function Home() {
  const [index,setIndex]=useState(0);
  const [answer,setAnswer]=useState("");
  const [attempts,setAttempts]=useState(0);
  const [hint,setHint]=useState<1|2|0>(0);
  const [feedback,setFeedback]=useState<"idle"|"wrong"|"correct">("idle");
  const [mastery,setMastery]=useState<Record<string,number>>({});
  const exercise=curriculum[index] ?? firstExercise;

  const progress=useMemo(()=>Math.round((index/curriculum.length)*100),[index]);

  function check() {
    if(!answer.trim()) return;
    const ok=isCorrect(answer,exercise);
    setAttempts(v=>v+1);
    if(ok) {
      setFeedback("correct");
      setMastery(m=>({...m,[exercise.topic]:Math.min(100,(m[exercise.topic]??0)+20)}));
    } else {
      setFeedback("wrong");
      if(hint===0) setHint(1);
    }
  }

  function next() {
    setIndex(v=>Math.min(v+1,curriculum.length-1));
    setAnswer(""); setHint(0); setFeedback("idle");
  }

  function reset() {
    setIndex(0); setAnswer(""); setHint(0); setFeedback("idle"); setAttempts(0); setMastery({});
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><div className="logo"><Zap size={22}/></div><div><strong>מתמטיקה לחשמלאי מוסמך</strong><span>מורה פרטי אינטראקטיבי</span></div></div>
        <button className="ghost" onClick={reset}><RotateCcw size={17}/> התחל מחדש</button>
      </header>

      <section className="hero">
        <div className="eyebrow"><Sparkles size={16}/> מסלול אישי • מתמטיקה → חשמל</div>
        <h1>בונים ביטחון במתמטיקה,<br/><em>שלב אחד בכל פעם.</em></h1>
        <p>לא מקבלים את התשובה מיד. חושבים, מנסים, מקבלים רמז — ולומדים באמת.</p>
      </section>

      <div className="layout">
        <aside className="panel progressPanel">
          <div className="panelTitle">ההתקדמות שלך</div>
          <div className="progressCircle"><span>{progress}%</span><small>מסלול</small></div>
          <div className="stat"><span>תרגילים במסלול</span><b>{index+1} / {curriculum.length}</b></div>
          <div className="stat"><span>ניסיונות</span><b>{attempts}</b></div>
          <div className="topics">
            <div className="topicHead">נושאים</div>
            {["אלגברה ושינוי נושא נוסחה","חוק אוהם","הספק חשמלי","טריגונומטריה בסיסית","כתיבה מדעית","יחס ואחוזים","משוואות"].map(t=><div className="topic" key={t}><span>{t}</span><b>{mastery[t]??0}%</b></div>)}
          </div>
        </aside>

        <section className="lesson">
          <div className="lessonMeta"><span className="badge">רמה {exercise.level}</span><span>{exercise.topic}</span><span className="dot"/>תרגיל {index+1}</div>
          <div className="panel exerciseCard">
            <h2>{exercise.title}</h2>
            <div className="question">{exercise.prompt}</div>
            <label>התשובה שלך</label>
            <div className="answerRow">
              <input dir="ltr" value={answer} onChange={e=>{setAnswer(e.target.value);setFeedback("idle")}} onKeyDown={e=>e.key==="Enter"&&check()} placeholder="כתוב כאן את התשובה..." disabled={feedback==="correct"}/>
              <button className="primary" onClick={check} disabled={!answer.trim()||feedback==="correct"}>בדוק תשובה <ChevronLeft size={18}/></button>
            </div>

            {feedback==="wrong" && <div className="feedback hint"><Lightbulb size={20}/><div><strong>לא נורא — זו בדיוק הדרך ללמוד.</strong><p>{hint===1?exercise.hint1:exercise.hint2}</p>{hint===1&&<button onClick={()=>setHint(2)} className="linkBtn">תן לי רמז נוסף</button>}</div></div>}
            {feedback==="correct" && <div className="feedback success"><CheckCircle2 size={22}/><div><strong>מצוין! פתרת נכון 🎯</strong><p>{exercise.explanation}</p><button onClick={next} className="nextBtn">התרגיל הבא <ChevronLeft size={18}/></button></div></div>}
            {feedback==="idle" && <div className="teacherTip"><Lightbulb size={18}/><span>נסה לפתור לבד. אם נתקעת, בדוק תשובה — אעזור לך בצעד הבא בלי לגלות מיד את הפתרון.</span></div>}
          </div>
        </section>
      </div>
    </main>
  );
}