"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle2, GraduationCap, Target, TrendingUp } from "lucide-react";
import { curriculum } from "../../lib/curriculum";
import { emptyLearningState, loadLearningState, type LearningState } from "../../lib/learning";
import { parseSubjectProgress, SUBJECT_PROGRESS_STORAGE_KEY } from "../../lib/subject-progress";
import { subjectCatalog } from "../../lib/subject-catalog";

export default function ProgressPage() {
 const [learning,setLearning]=useState<LearningState>(emptyLearningState);
 const [units,setUnits]=useState(0);
 useEffect(()=>{try{setLearning(loadLearningState(window.localStorage));setUnits(parseSubjectProgress(window.localStorage.getItem(SUBJECT_PROGRESS_STORAGE_KEY)).completedUnitIds.length)}catch{setLearning(emptyLearningState);setUnits(0)}},[]);
 const totalUnits=subjectCatalog.reduce((n,s)=>n+s.units.length,0);
 const attempts=Object.values(learning.stats).reduce((n,s)=>n+s.attempts,0);
 const correct=Object.values(learning.stats).reduce((n,s)=>n+s.correct,0);
 const accuracy=attempts?Math.round(correct/attempts*100):0;
 const mathPct=Math.round(learning.completed.length/Math.max(1,curriculum.length)*100);
 const unitsPct=Math.round(units/Math.max(1,totalUnits)*100);
 return <main className="progressPage" dir="rtl">
 <header className="progressHeader"><span><TrendingUp size={16}/> תמונת מצב אישית</span><h1>ההתקדמות שלי</h1><p>כל ההתקדמות שלך במקום אחד — תרגול מתמטיקה, מקצועות ויחידות לימוד.</p></header>
 <section className="progressMetrics">
 <article className="progressMetric"><span className="progressMetricIcon"><Target size={20}/></span><div><strong>{learning.completed.length}</strong><small>תרגילי מתמטיקה שהושלמו</small></div></article>
 <article className="progressMetric"><span className="progressMetricIcon"><GraduationCap size={20}/></span><div><strong>{units}</strong><small>יחידות מקצועיות שהושלמו</small></div></article>
 <article className="progressMetric"><span className="progressMetricIcon"><CheckCircle2 size={20}/></span><div><strong>{accuracy}%</strong><small>דיוק בתרגול המתמטיקה</small></div></article>
 <article className="progressMetric"><span className="progressMetricIcon"><BookOpen size={20}/></span><div><strong>{attempts}</strong><small>ניסיונות תרגול שנרשמו</small></div></article></section>
 <section className="progressPanels">
 <article className="progressPanelCard"><div className="progressPanelTitle"><span className="progressMetricIcon"><BookOpen size={19}/></span><div><h2>מתמטיקה לחשמלאים</h2><p>התרגילים והנושאים במסלול המתמטיקה</p></div></div><div className="progressBarTrack" role="progressbar" aria-label="התקדמות במתמטיקה" aria-valuemin={0} aria-valuemax={100} aria-valuenow={mathPct}><span style={{width:mathPct+"%"}}/></div><div className="progressBarMeta"><strong>{mathPct}% הושלמו</strong><span>{learning.completed.length} מתוך {curriculum.length} תרגילים</span></div><Link href="/math" className="progressAction">להמשך תרגול <ArrowLeft size={16}/></Link></article>
 <article className="progressPanelCard"><div className="progressPanelTitle"><span className="progressMetricIcon"><GraduationCap size={19}/></span><div><h2>מקצועות ויחידות לימוד</h2><p>התקדמות במסלול המקצועי</p></div></div><div className="progressBarTrack" role="progressbar" aria-label="התקדמות במקצועות" aria-valuemin={0} aria-valuemax={100} aria-valuenow={unitsPct}><span style={{width:unitsPct+"%"}}/></div><div className="progressBarMeta"><strong>{unitsPct}% הושלמו</strong><span>{units} מתוך {totalUnits} יחידות</span></div><Link href="/subjects" className="progressAction">למפת המקצועות <ArrowLeft size={16}/></Link></article></section>
 <section className="progressFooter"><div><strong>ממשיכים בקצב שלך</strong><p>הנתונים נקראים מאחסון הדפדפן הקיים. לא שינינו או איפסנו נתונים קיימים.</p></div><Link href="/" className="progressHomeLink">חזרה למסך הבית <ArrowLeft size={16}/></Link></section></main>;
}
