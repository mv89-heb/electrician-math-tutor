"use client";

import type { Exercise } from "../lib/curriculum";

type Props = { exercise: Exercise };

export function FieldWorkIllustration({ exercise }: Props) {
  const electrical = /ohm|חשמל|זרם|מתח|התנגדות/i.test(exercise.id + " " + exercise.topic);
  const power = /power|הספק/i.test(exercise.id + " " + exercise.topic);
  const measurements = /units|geometry|שטח|מידות|יחידות|מעגל/i.test(exercise.id + " " + exercise.topic);

  const title = power
    ? "בשטח: בודקים צריכת הספק"
    : electrical
      ? "בשטח: מודדים מעגל חשמלי"
      : measurements
        ? "בשטח: מודדים לפני התקנה"
        : "בשטח: מודדים ומתכננים לפני העבודה";
  const caption = power
    ? "מזהים את נתוני המתח והזרם, ואז מחשבים הספק לפי הנוסחה המתאימה."
    : electrical
      ? "מזהים את מקור המתח, העומס ונקודות המדידה. המספרים בתרגיל הם דוגמה לימודית."
      : measurements
        ? "מודדים אורך, מרחק או שטח לפני בחירת חומר והכנת ההתקנה."
        : "גם חישוב פשוט עוזר לתכנן אורך כבל, מרחק בין נקודות וכמות חומר.";

  return (
    <section className="fieldIllustration" aria-label="המחשה של עבודה יומיומית של חשמלאי">
      <div className="fieldIllustrationHeader">
        <span className="fieldIllustrationBadge" aria-hidden="true">🧰</span>
        <div><span className="fieldIllustrationKicker">מהכיתה לשטח</span><strong>{title}</strong></div>
      </div>
      <div className="fieldScene">
        <svg viewBox="0 0 520 220" role="img" aria-label={power ? "איור של לוח חשמל, נורה ומד הספק" : electrical ? "איור של מעגל חשמלי עם מד מתח" : "איור של חשמלאי מודד מסלול להתקנת כבל"} className="fieldSceneSvg">
          <defs>
            <linearGradient id="fieldWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f8fafc"/><stop offset="100%" stopColor="#e8eef6"/></linearGradient>
            <linearGradient id="fieldPanel" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffffff"/><stop offset="100%" stopColor="#dce5f1"/></linearGradient>
          </defs>
          <rect x="0" y="0" width="520" height="220" rx="15" fill="url(#fieldWall)"/>
          <path d="M0 180 H520" stroke="#cbd5e1" strokeWidth="3"/>
          <path d="M0 191 H520" stroke="#e2e8f0" strokeWidth="15"/>
          {electrical ? (
            <>
              <rect x="36" y="28" width="138" height="136" rx="9" fill="url(#fieldPanel)" stroke="#94a3b8" strokeWidth="2"/>
              <rect x="48" y="40" width="114" height="24" rx="4" fill="#e2e8f0"/>
              <text x="105" y="56" textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155">לוח / מקור מתח</text>
              <rect x="54" y="76" width="31" height="47" rx="4" fill="#cbd5e1" stroke="#64748b"/>
              <rect x="91" y="76" width="31" height="47" rx="4" fill="#cbd5e1" stroke="#64748b"/>
              <rect x="128" y="76" width="24" height="47" rx="4" fill="#cbd5e1" stroke="#64748b"/>
              <path d="M69 83 v18 M106 83 v18 M140 83 v18" stroke="#475569" strokeWidth="3" strokeLinecap="round"/>
              <path d="M174 91 H224 V67 H294" fill="none" stroke="#dc2626" strokeWidth="4" strokeLinecap="round"/>
              <path d="M174 131 H224 V155 H294" fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round"/>
              <rect x="294" y="48" width="124" height="124" rx="13" fill="#1e293b" stroke="#0f172a" strokeWidth="2"/>
              <rect x="309" y="61" width="94" height="43" rx="5" fill="#d1fae5"/>
              <text x="356" y="79" textAnchor="middle" fontSize="10" fill="#065f46">קריאת מדידה</text>
              <text x="356" y="95" textAnchor="middle" fontSize="18" fontWeight="800" fill="#065f46">{power ? "P = V × I" : "V / I / Ω"}</text>
              <circle cx="356" cy="128" r="12" fill="#475569" stroke="#94a3b8" strokeWidth="2"/>
              <path d="M356 128 l7 -5" stroke="#f8fafc" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="326" cy="154" r="4" fill="#ef4444"/><circle cx="386" cy="154" r="4" fill="#2563eb"/>
              <path d="M326 158 C308 187 276 183 276 154 V121" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"/>
              <path d="M386 158 C404 190 440 183 440 150 V117" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round"/>
              {power ? (
                <g transform="translate(440 62)"><path d="M0 0 C-20 0 -25 19 -12 31 L-10 43 H10 L12 31 C25 19 20 0 0 0Z" fill="#fde68a" stroke="#d97706" strokeWidth="2"/><path d="M-8 44 H8 M-6 49 H6" stroke="#92400e" strokeWidth="3" strokeLinecap="round"/><path d="M-5 10 Q0 3 5 10" fill="none" stroke="#fff7ed" strokeWidth="3" strokeLinecap="round"/></g>
              ) : <g transform="translate(443 70)"><circle cx="0" cy="0" r="20" fill="#dbeafe" stroke="#2563eb" strokeWidth="2"/><path d="M-10 0 H10 M0 -10 V10" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round"/><text x="0" y="37" textAnchor="middle" fontSize="10" fill="#334155">בדיקה</text></g>}
            </>
          ) : (
            <>
              <rect x="32" y="30" width="154" height="132" rx="8" fill="url(#fieldPanel)" stroke="#94a3b8" strokeWidth="2"/>
              <rect x="44" y="42" width="130" height="21" rx="4" fill="#dbeafe"/>
              <text x="109" y="56" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e40af">תכנית התקנה</text>
              <path d="M53 83 H164 M53 101 H164 M53 119 H140" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="69" cy="83" r="5" fill="#2563eb"/><circle cx="135" cy="101" r="5" fill="#2563eb"/>
              <path d="M69 83 L135 101" stroke="#2563eb" strokeWidth="2" strokeDasharray="4 4"/>
              <text x="109" y="145" textAnchor="middle" fontSize="11" fill="#475569">אורך / מרחק</text>
              <g transform="translate(230 39)">
                <path d="M20 12 Q53 -1 84 12 L91 92 Q53 106 14 92Z" fill="#f1c7a5" stroke="#b77952" strokeWidth="2"/>
                <path d="M18 18 Q53 4 87 18 L83 34 Q53 22 22 34Z" fill="#2563eb"/>
                <path d="M29 42 L49 54 L38 77 L18 68Z" fill="#f8fafc" stroke="#64748b" strokeWidth="2"/>
                <path d="M70 42 L57 57 L68 75 L88 64Z" fill="#f8fafc" stroke="#64748b" strokeWidth="2"/>
                <path d="M33 52 L76 52" stroke="#dc2626" strokeWidth="4" strokeLinecap="round"/>
                <path d="M53 53 L53 92" stroke="#dc2626" strokeWidth="4" strokeLinecap="round"/>
                <circle cx="53" cy="16" r="15" fill="#f1c7a5" stroke="#b77952" strokeWidth="2"/>
                <path d="M38 15 Q37 -3 53 -1 Q70 -1 68 16 L63 8 L44 8Z" fill="#334155"/>
              </g>
              <g transform="translate(350 78) rotate(-7)">
                <rect x="0" y="0" width="116" height="56" rx="7" fill="#fbbf24" stroke="#b45309" strokeWidth="2"/>
                <rect x="9" y="9" width="98" height="19" rx="3" fill="#fff7ed"/>
                {Array.from({length: 9}, (_, i) => <path key={i} d={`M${13 + i * 10} 29 v${i % 3 === 0 ? 14 : 8}`} stroke="#92400e" strokeWidth="1.5"/>)}
                <text x="58" y="48" textAnchor="middle" fontSize="10" fontWeight="700" fill="#78350f">מטר מדידה</text>
              </g>
              <path d="M344 150 H474" stroke="#0f766e" strokeWidth="3" strokeDasharray="5 5"/>
              <path d="M344 143 V157 M474 143 V157" stroke="#0f766e" strokeWidth="3" strokeLinecap="round"/>
            </>
          )}
          <rect x="17" y="199" width="486" height="5" rx="2" fill="#cbd5e1"/>
        </svg>
      </div>
      <p className="fieldIllustrationCaption">{caption}</p>
      <p className="fieldSafetyNote"><span aria-hidden="true">ⓘ</span> המחשה לימודית בלבד — אין לבצע מדידות או לפתוח לוח חשמל ללא הכשרה, ציוד מתאים ונהלי בטיחות.</p>
    </section>
  );
}
