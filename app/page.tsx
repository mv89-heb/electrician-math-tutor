"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowLeft, ArrowUpLeft, BookOpen, CheckCircle2, CircuitBoard,
  GraduationCap, Layers3, Play, Sparkles, Target, TrendingUp, Zap
} from "lucide-react";
import { subjectCatalog, subjectCategories } from "../lib/subject-catalog";
import { curriculum } from "../lib/curriculum";
import { chooseNextExercise, emptyLearningState, loadLearningState, type LearningState } from "../lib/learning";
import { parseSubjectProgress, SUBJECT_PROGRESS_STORAGE_KEY } from "../lib/subject-progress";

const totalUnits = subjectCatalog.reduce((sum, subject) => sum + subject.units.length, 0);
const coreSubjects = subjectCatalog.filter((subject) => subject.status === "core").length;

export default function HomePage() {
  const [learning, setLearning] = useState<LearningState>(emptyLearningState);
  const [completedUnits, setCompletedUnits] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setLearning(loadLearningState(window.localStorage));
      setCompletedUnits(parseSubjectProgress(window.localStorage.getItem(SUBJECT_PROGRESS_STORAGE_KEY)).completedUnitIds.length);
    } catch {
      setLearning(emptyLearningState);
      setCompletedUnits(0);
    } finally {
      setReady(true);
    }
  }, []);

  const nextExercise = useMemo(() => {
    if (!curriculum.length) return null;
    const index = chooseNextExercise(curriculum, learning);
    return curriculum[index] ?? curriculum[0];
  }, [learning]);

  const attempts = Object.values(learning.stats).reduce((sum, item) => sum + item.attempts, 0);
  const correct = Object.values(learning.stats).reduce((sum, item) => sum + item.correct, 0);
  const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;
  const mathPercent = Math.round((learning.completed.length / Math.max(1, curriculum.length)) * 100);
  const subjectPercent = Math.round((completedUnits / Math.max(1, totalUnits)) * 100);
  const hasStarted = learning.attempts > 0 || completedUnits > 0;
  const allMathDone = learning.completed.length >= curriculum.length;

  return (
    <main className="homeDashboard" dir="rtl">
      <section className="homeWelcome">
        <div className="homeWelcomeCopy">
          <div className="homeEyebrow"><Sparkles size={15} /> סביבת הלמידה של ספארקי</div>
          <h1>{hasStarted ? "טוב שחזרת!" : "מתחילים מהבסיס,"}<br /><span>{hasStarted ? "ממשיכים להתקדם." : "ומתקדמים עד שמבינים."}</span></h1>
          <p>כל מסלול הלימוד שלך במקום אחד. בוחרים נושא, לומדים בקצב שלך ורואים איך המתמטיקה מתחברת לעולם החשמל.</p>
          <div className="homeHeroActions">
            <Link className="homePrimaryAction" href="/math"><Play size={17} fill="currentColor" /> {hasStarted ? "להמשיך לתרגול" : "להתחיל ללמוד"}</Link>
            <Link className="homeSecondaryAction" href="/subjects">למפת מקצועות הלימוד <ArrowLeft size={17} /></Link>
          </div>
        </div>
        <div className="homeWelcomeVisual" aria-hidden="true">
          <div className="homeVisualRing ringOuter" />
          <div className="homeVisualRing ringInner" />
          <div className="homeVisualBolt"><Zap size={66} fill="currentColor" strokeWidth={1.4} /></div>
          <span className="homeVisualChip chipTop"><CheckCircle2 size={14} /> לומדים</span>
          <span className="homeVisualChip chipBottom"><Activity size={14} /> מתקדמים</span>
          <span className="homeVisualDot dotOne" /><span className="homeVisualDot dotTwo" />
        </div>
        <div className="homeWelcomeFoot"><span>⚡</span> אין מבחן כניסה. אין לחץ. מתקדמים צעד אחד בכל פעם.</div>
      </section>

      <section className="homeContinue" aria-labelledby="homeContinueTitle">
        <div className="homeContinueIcon"><BookOpen size={23} /></div>
        <div className="homeContinueCopy">
          <span className="homeSectionKicker">{hasStarted ? "הצעד הבא שלך" : "מתחילים כאן"}</span>
          <h2 id="homeContinueTitle">{allMathDone ? "סיימת את מסלול התרגול הנוכחי!" : nextExercise?.title ?? "התרגול מחכה לך"}</h2>
          <p>{allMathDone ? "אפשר לחזור על נושאים, לחזק נקודות חלשות או להמשיך למקצועות החשמל." : nextExercise ? `נושא: ${nextExercise.topic} · תרגול קצר שממשיך מהשלב המתאים במסלול.` : "פתח את מסלול המתמטיקה והתחל ללמוד."}</p>
        </div>
        <Link className="homeContinueAction" href="/math">{allMathDone ? "למסלול המתמטיקה" : "כניסה לשיעור"} <ArrowLeft size={17} /></Link>
      </section>

      <section className="homeProgressSection">
        <div className="homeSectionHeading">
          <div><span className="homeSectionKicker">התמונה שלך</span><h2>ההתקדמות שלי</h2></div>
          <Link href="/progress">לכל הנתונים <ArrowLeft size={15} /></Link>
        </div>
        <div className="homeProgressGrid">
          <article className="homeProgressCard">
            <div className="homeProgressCardTop"><span className="homeProgressIcon blue"><Target size={19} /></span><span>מתמטיקה</span></div>
            <strong>{ready ? learning.completed.length : "—"}<small> / {curriculum.length}</small></strong>
            <div className="homeProgressTrack"><span style={{ width: `${ready ? mathPercent : 0}%` }} /></div>
            <p>{ready ? `${mathPercent}% מהתרגילים הושלמו` : "טוען נתונים…"}</p>
          </article>
          <article className="homeProgressCard">
            <div className="homeProgressCardTop"><span className="homeProgressIcon green"><GraduationCap size={19} /></span><span>מקצועות</span></div>
            <strong>{ready ? completedUnits : "—"}<small> / {totalUnits}</small></strong>
            <div className="homeProgressTrack"><span style={{ width: `${ready ? subjectPercent : 0}%` }} /></div>
            <p>{ready ? `${subjectPercent}% מיחידות הלימוד הושלמו` : "טוען נתונים…"}</p>
          </article>
          <article className="homeProgressCard">
            <div className="homeProgressCardTop"><span className="homeProgressIcon violet"><TrendingUp size={19} /></span><span>דיוק בתרגול</span></div>
            <strong>{ready ? `${accuracy}%` : "—"}</strong>
            <div className="homeProgressTrack"><span style={{ width: `${ready ? accuracy : 0}%` }} /></div>
            <p>{ready ? `${attempts} ניסיונות תרגול נרשמו` : "טוען נתונים…"}</p>
          </article>
        </div>
      </section>

      <section className="homeExplore">
        <div className="homeSectionHeading">
          <div><span className="homeSectionKicker">כל הכלים שלך</span><h2>לאן ממשיכים?</h2></div>
          <p>בחר את סביבת הלמידה שמתאימה לך כרגע.</p>
        </div>
        <div className="homeExploreGrid">
          <Link href="/subjects" className="homeExploreCard subjects">
            <span className="homeExploreIcon"><Layers3 size={24} /></span><span className="homeExploreEyebrow">תוכנית הלימודים</span>
            <h3>מקצועות ויחידות לימוד</h3><p>{coreSubjects} מקצועות מרכזיים, {totalUnits} יחידות לימוד ו-{subjectCategories.length} תחומי ידע.</p>
            <span className="homeExploreLink">לפתיחת מפת הלימודים <ArrowLeft size={16} /></span>
          </Link>
          <Link href="/math" className="homeExploreCard math">
            <span className="homeExploreIcon"><BookOpen size={24} /></span><span className="homeExploreEyebrow">תרגול אישי</span>
            <h3>מתמטיקה לחשמלאים</h3><p>הסברים קצרים, תרגול הדרגתי, רמזים ומחברת פתרון.</p>
            <span className="homeExploreLink">לכניסה לתרגול <ArrowLeft size={16} /></span>
          </Link>
          <Link href="/labs" className="homeExploreCard labs">
            <span className="homeExploreIcon"><CircuitBoard size={24} /></span><span className="homeExploreEyebrow">לומדים דרך התנסות</span>
            <h3>מעבדות וסימולטורים</h3><p>חוק אוהם, מעגלי זרם ישר וסימולציות אינטראקטיביות.</p>
            <span className="homeExploreLink">לפתיחת המעבדות <ArrowLeft size={16} /></span>
          </Link>
        </div>
      </section>

      <section className="homeTrustNote">
        <div className="homeTrustIcon"><Zap size={20} /></div>
        <div><strong>הלמידה נשארת בשליטה שלך</strong><p>ההתקדמות נשמרת בדפדפן שבו אתה לומד. אין צורך במבחן מיון, ואפשר לחזור לכל נושא בכל זמן.</p></div>
        <Link href="/progress">מעקב מלא <ArrowUpLeft size={16} /></Link>
      </section>
    </main>
  );
}
