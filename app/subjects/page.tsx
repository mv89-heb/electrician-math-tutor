"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getSubjectsByCategory, subjectCategories, subjectCatalog } from "../../lib/subject-catalog";
import { parseSubjectProgress, SUBJECT_PROGRESS_STORAGE_KEY } from "../../lib/subject-progress";

export default function SubjectsPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [completedUnitIds, setCompletedUnitIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      setCompletedUnitIds(parseSubjectProgress(window.localStorage.getItem(SUBJECT_PROGRESS_STORAGE_KEY)).completedUnitIds);
    } catch {
      setCompletedUnitIds([]);
    }
  }, []);
  const subjects = useMemo(
    () => activeCategory === "all"
      ? subjectCatalog
      : getSubjectsByCategory(activeCategory),
    [activeCategory],
  );
  const visibleSubjects = selectedSubjectId
    ? subjects.filter((subject) => subject.id === selectedSubjectId)
    : subjects;

  return (
    <main dir="rtl" className="subjectsPage">
      <style>{`
        .subjectsPage{min-height:100vh;background:#f4f7fb;color:#17243a;padding:28px 20px 64px;font-family:inherit}
        .subjectsWrap{max-width:1120px;margin:0 auto}
        .subjectsTop{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:28px}
        .subjectsBrand{font-weight:800;font-size:18px;display:flex;align-items:center;gap:10px}
        .subjectsBrandMark{width:38px;height:38px;border-radius:13px;background:#172f53;color:#fff;display:grid;place-items:center}
        .subjectsBack{color:#1d5a9b;text-decoration:none;font-weight:700}
        .subjectsHero{background:linear-gradient(120deg,#122b4d,#1d527b);color:#fff;border-radius:24px;padding:30px;margin-bottom:24px;box-shadow:0 14px 34px #122b4d1c}
        .subjectsEyebrow{font-size:13px;color:#b9d8f4;font-weight:700;margin-bottom:10px}
        .subjectsHero h1{font-size:clamp(26px,4vw,38px);margin:0 0 12px;line-height:1.2}
        .subjectsHero p{max-width:760px;line-height:1.75;color:#e0edf8;margin:0}
        .subjectsNotice{background:#fff8e8;border:1px solid #f1d89a;border-radius:14px;padding:13px 16px;color:#76531b;line-height:1.65;margin-bottom:22px;font-size:14px}
        .subjectsFilters{display:flex;gap:8px;overflow:auto;padding:2px 0 14px;margin-bottom:8px}
        .subjectsFilter{white-space:nowrap;border:1px solid #d8e1ed;background:#fff;border-radius:999px;padding:9px 14px;color:#42536a;font:inherit;font-size:13px;cursor:pointer}
        .subjectsFilter.active{background:#183b63;color:white;border-color:#183b63}
        .subjectsGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:16px}.subjectChoose{border:0;border-radius:10px;background:#eaf2fb;color:#1d5a9b;padding:9px 12px;font:inherit;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap}.subjectChoose:hover{background:#dceafa}.subjectSelectionBar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:4px 0 16px}.subjectSelectionBar h2{font-size:19px;margin:0;color:#1a2c44}.subjectSelectionBar p{font-size:13px;color:#68798e;margin:5px 0 0}.subjectBackButton{border:1px solid #d8e1ed;background:#fff;color:#1d5a9b;border-radius:10px;padding:9px 13px;font:inherit;font-weight:700;cursor:pointer}
        .subjectCard{background:#fff;border:1px solid #e2e9f1;border-radius:18px;padding:19px;box-shadow:0 5px 18px #1c35500a}
        .subjectCardHead{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
        .subjectCard h2{font-size:19px;margin:0 0 7px;color:#1a2c44}
        .subjectProgress{font-size:12px;color:#356348;background:#edf7f0;border-radius:8px;padding:7px 9px;margin:0 0 13px;display:inline-block}.subjectCard p{font-size:14px;line-height:1.65;color:#65758b;margin:0 0 14px}
        .subjectStatus{font-size:11px;border-radius:999px;padding:5px 9px;background:#eaf2fb;color:#28547e;white-space:nowrap}
        .subjectStatus.extra{background:#f3efff;color:#6545a0}
        .subjectUnits{border-top:1px solid #edf1f6;padding-top:12px}
        .subjectUnits h3{font-size:12px;color:#66758a;margin:0 0 9px}
        .subjectUnits ul{padding:0 18px 0 0;margin:0}
        .subjectUnits li{margin:0 0 9px;color:#263a53;font-size:13px;line-height:1.55}
        .subjectUnits li span{display:block;color:#7a8798;font-size:12px}.subjectUnits li a{color:#1d5a9b;font-weight:700;text-decoration:none}.subjectUnits li a:hover{text-decoration:underline}
        .subjectMath{margin-top:12px;display:flex;flex-wrap:wrap;gap:5px}
        .subjectMath span{font-size:11px;background:#f1f5f9;color:#53677f;border-radius:6px;padding:4px 7px}
        .subjectsFooter{margin-top:28px;text-align:center;color:#68798e;font-size:13px;line-height:1.7}
        @media(max-width:600px){.subjectsPage{padding:18px 13px 44px}.subjectsHero{padding:23px 19px;border-radius:19px}}
      `}</style>
      <div className="subjectsWrap">
        <header className="subjectsTop">
          <div className="subjectsBrand"><span className="subjectsBrandMark">⚡</span><span>ספארקי · מסלול חשמלאי מוסמך</span></div>
          <Link href="/" className="subjectsBack">חזרה ללמידה ←</Link>
        </header>

        <section className="subjectsHero">
          <div className="subjectsEyebrow">מפת הלימודים שלך</div>
          <h1>לומדים חשמל. מבינים איך הכול מתחבר.</h1>
          <p>כל מקצוע בנוי מיחידות לימוד ונושאים. המתמטיקה משולבת בתוך החשמל, המדידות, המכונות והתכנון — כדי להבין לא רק איך מחשבים, אלא למה החישוב חשוב בעבודה המקצועית.</p>
        </section>

        <div className="subjectsNotice">
          מפת הלימודים היא בסיס תוכן לימודי שנבנה לפי תחומי הלימוד שסופקו ולפי המידע הפומבי של אורט. יש לאמת את היקף הנושאים, התקנים ודרישות ההסמכה מול הסילבוס הרשמי והעדכני. תרגול מעשי יבוצע רק בסביבה לימודית בטוחה ובהשגחת מדריך מוסמך.
        </div>

        <nav className="subjectsFilters" aria-label="סינון מקצועות">
          <button type="button" className={activeCategory === "all" ? "subjectsFilter active" : "subjectsFilter"} onClick={() => { setActiveCategory("all"); setSelectedSubjectId(null); }}>כל המקצועות ({subjectCatalog.length})</button>
          {subjectCategories.map((category) => (
            <button key={category.id} type="button" className={activeCategory === category.id ? "subjectsFilter active" : "subjectsFilter"} onClick={() => { setActiveCategory(category.id); setSelectedSubjectId(null); }}>{category.title}</button>
          ))}
        </nav>

        {selectedSubjectId && <div className="subjectSelectionBar"><div><h2>המקצוע שנבחר ללמידה</h2><p>כאן מופיעות יחידות הלימוד של המקצוע שבחרת.</p></div><button type="button" className="subjectBackButton" onClick={() => setSelectedSubjectId(null)}>← חזרה לבחירת מקצועות</button></div>}
        {!selectedSubjectId && <div className="subjectSelectionBar"><div><h2>באיזה מקצוע תרצה ללמוד?</h2><p>בחר מקצוע אחד כדי להציג את יחידות הלימוד שלו ולהתחיל ללמוד.</p></div></div>}
        <section className="subjectsGrid" aria-live="polite">
          {visibleSubjects.map((subject) => (
            <article className="subjectCard" key={subject.id}>
              <div className="subjectCardHead">
                <h2>{subject.title}</h2>
                <span className={subject.status === "core" ? "subjectStatus" : "subjectStatus extra"}>{subject.status === "core" ? "מקצוע ליבה" : "הרחבה"}</span>
              </div>
              <p>{subject.description}</p>
              {!selectedSubjectId && <button type="button" className="subjectChoose" onClick={() => setSelectedSubjectId(subject.id)}>בחירת המקצוע ולצפייה ביחידות ←</button>}
              <div className="subjectProgress">{subject.units.filter((unit) => completedUnitIds.includes(`${subject.id}:${unit.id}`)).length} מתוך {subject.units.length} יחידות הושלמו</div>
              {selectedSubjectId === subject.id && <div className="subjectUnits">
                <h3>{subject.units.length} יחידות לימוד · פתיחת שיעור בלחיצה</h3>
                <ul>
                  {subject.units.map((unit) => (
                    <li key={unit.id}><Link href={`/subjects/${subject.id}/${unit.id}`}>{unit.title} ←</Link><span>{unit.description}</span></li>
                  ))}
                </ul>
              </div>}
              {selectedSubjectId === subject.id && subject.units.some((unit) => unit.mathConnections.length > 0) && (
                <div className="subjectMath" aria-label="קשרי מתמטיקה">
                  {[...new Set(subject.units.flatMap((unit) => unit.mathConnections))].map((item) => <span key={item}>מתמטיקה: {item}</span>)}
                </div>
              )}
            </article>
          ))}
        </section>

        <footer className="subjectsFooter">
          {subjectCatalog.filter((subject) => subject.status === "core").length} מקצועות ליבה · {subjectCatalog.reduce((sum, subject) => sum + subject.units.length, 0)} יחידות לימוד במפת התוכן
          <br />
          כל 54 היחידות כוללות שיעור ייעודי עם הסבר, דוגמה ובדיקת הבנה. סימולטורים, תרגול מדורג והרחבה למספר שיעורים בכל יחידה יתווספו בשלבי הפיתוח הבאים.
        </footer>
      </div>
    </main>
  );
}
