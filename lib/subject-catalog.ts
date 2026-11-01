/**
 * מפת מקצועות ראשונית למערכת "ספארקי".
 *
 * זהו קטלוג ניווט ותכנון תוכן, נפרד ממערך התרגילים הקיים ב-curriculum.ts.
 * אין לשנות מזהי תרגילים או נתוני התקדמות בעת הרחבת הקטלוג.
 * יש לאמת את היקף כל יחידה מול הסילבוס העדכני לפני הצגתה כתוכנית רשמית.
 */

export type SubjectUnit = {
  id: string;
  title: string;
  description: string;
  mathConnections: string[];
};

export type SubjectDefinition = {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  status: "core" | "supplementary";
  units: SubjectUnit[];
};

export type SubjectCategory = {
  id: string;
  title: string;
  description: string;
};

export const subjectCategories: SubjectCategory[] = [
  { id: "foundations", title: "מקצועות יסוד ומדעים", description: "הבסיס המדעי והכמותי להבנת מערכות חשמל." },
  { id: "electrical-theory", title: "יסודות החשמל והאלקטרוניקה", description: "עקרונות, רכיבים, מעגלים ומכונות חשמל." },
  { id: "installations", title: "התקנה ותכנון", description: "הבנת מתקנים, תכנון, שרטוט ועבודה מעשית." },
  { id: "automation", title: "מיתוג, פיקוד, בקרה ואוטומציה", description: "מעגלי פיקוד, לוגיקה ובקרים מתוכנתים." },
  { id: "measurement", title: "בדיקות, מדידות ותיעוד", description: "מדידה, ניתוח תוצאות ודיווח טכני." },
  { id: "safety", title: "בטיחות וגיהות", description: "זיהוי סיכונים, מניעה והתנהלות בטוחה." },
  { id: "extensions", title: "הרחבות מקצועיות", description: "נושאים משלימים שיש להפעיל בהתאם לסילבוס המאומת." },
];

export const subjectCatalog: SubjectDefinition[] = [
  {
    id: "mathematics",
    categoryId: "foundations",
    title: "מתמטיקה שימושית לחשמל",
    description: "כלים מתמטיים הנלמדים בהקשר של בעיות חשמליות ומדידות.",
    status: "core",
    units: [
      { id: "arithmetic-units", title: "חשבון, שברים ויחידות", description: "ארבע פעולות, סדר פעולות, שברים והמרות יחידות.", mathConnections: ["כל המקצועות"] },
      { id: "algebra-equations", title: "אלגברה ומשוואות", description: "ביטויים, הצבה, משוואות ובידוד נעלם.", mathConnections: ["תורת החשמל", "מתקני חשמל", "מכונות חשמל"] },
      { id: "powers-roots", title: "חזקות, שורשים וכתיב מדעי", description: "סדרי גודל והצגת ערכים קטנים וגדולים.", mathConnections: ["אלקטרוניקה תעשייתית", "מדידות"] },
      { id: "percent-ratio", title: "יחסים, פרופורציות ואחוזים", description: "יחסים, אחוזים, נצילות וסטייה.", mathConnections: ["מכונות חשמל", "מדידות", "תכנון מתקנים"] },
      { id: "graphs-geometry", title: "גרפים וגיאומטריה", description: "קריאת גרפים, מידות, שטחים ומעגלים.", mathConnections: ["פיזיקה", "תכנון מתקנים", "תיעוד"] },
      { id: "trigonometry", title: "טריגונומטריה בסיסית", description: "זוויות ויחסים טריגונומטריים לפי הצורך.", mathConnections: ["תורת החשמל", "זרם חילופין"] },
    ],
  },
  {
    id: "physics",
    categoryId: "foundations",
    title: "פיזיקה",
    description: "תופעות פיזיקליות המסבירות את פעולת המערכות החשמליות.",
    status: "core",
    units: [
      { id: "physical-measurement", title: "גדלים, יחידות ומדידה", description: "יחידות SI, דיוק, שגיאות ומדידה.", mathConnections: ["מתמטיקה", "מעבדת חשמל"] },
      { id: "matter-charge", title: "מבנה החומר ומטען", description: "מטען, מוליכים, מבודדים ושדה חשמלי.", mathConnections: ["תורת החשמל"] },
      { id: "energy-power", title: "עבודה, אנרגיה והספק", description: "קשרים בין כוח, עבודה, אנרגיה והספק.", mathConnections: ["תורת החשמל", "מכונות חשמל"] },
      { id: "magnetism-induction", title: "מגנטיות והשראה", description: "שדות מגנטיים והשראה אלקטרומגנטית.", mathConnections: ["מכונות חשמל", "אלקטרוניקה"] },
    ],
  },
  {
    id: "technical-english",
    categoryId: "foundations",
    title: "אנגלית טכנית",
    description: "קריאת סימונים, תוויות, מפרטים והוראות יצרן.",
    status: "core",
    units: [
      { id: "technical-vocabulary", title: "מונחים וסימונים", description: "רכיבים, כלי עבודה, יחידות וקיצורים.", mathConnections: ["כל המקצועות"] },
      { id: "datasheets", title: "קריאת דפי נתונים", description: "ערכים נומינליים, דירוגים ואזהרות.", mathConnections: ["אלקטרוניקה", "מכונות חשמל"] },
    ],
  },
  {
    id: "electrical-theory",
    categoryId: "electrical-theory",
    title: "תורת החשמל",
    description: "הבנת מעגלים, גדלים חשמליים, חוקי יסוד וניתוחם.",
    status: "core",
    units: [
      { id: "electrical-quantities", title: "מתח, זרם והתנגדות", description: "הגדרות, יחידות וחוק אוהם.", mathConnections: ["אלגברה", "יחידות", "בידוד נעלם"] },
      { id: "dc-circuits", title: "מעגלי זרם ישר", description: "חיבור טורי, מקבילי ומעורב וחוקי קירכהוף.", mathConnections: ["משוואות", "שברים", "סכימה"] },
      { id: "ac-circuits", title: "זרם חילופין", description: "מחזור, תדר, מופע וערך RMS לפי הסילבוס.", mathConnections: ["גרפים", "שורשים", "טריגונומטריה"] },
      { id: "power-energy", title: "הספק ואנרגיה", description: "הספק חשמלי, אנרגיה, צריכה ונצילות.", mathConnections: ["כפל", "יחידות", "אחוזים"] },
      { id: "three-phase", title: "מערכות חד ותלת־פאזיות", description: "עקרונות מערכת תלת־פאזית וחיבורי כוכב/משולש לפי רמת הקורס.", mathConnections: ["שורשים", "כפל", "יחסים"] },
    ],
  },
  {
    id: "industrial-electronics",
    categoryId: "electrical-theory",
    title: "אלקטרוניקה תעשייתית",
    description: "רכיבים אלקטרוניים, יישור, ספקי כוח והמרת הספק.",
    status: "core",
    units: [
      { id: "passive-components", title: "רכיבים פסיביים", description: "נגדים, קבלים וסלילים.", mathConnections: ["יחידות", "כתיב מדעי"] },
      { id: "semiconductors", title: "רכיבי מוליכים למחצה", description: "דיודות, מיישרים וטרנזיסטורים – מבוא.", mathConnections: ["גרפים", "יחסים"] },
      { id: "power-conversion", title: "יישור והמרת הספק", description: "ספקי כוח ועקרונות AC/DC.", mathConnections: ["מתמטיקה", "תורת החשמל"] },
    ],
  },
  {
    id: "electrical-machines",
    categoryId: "electrical-theory",
    title: "מכונות חשמל",
    description: "שנאים, מנועים, גנרטורים ועקרונות הנעה.",
    status: "core",
    units: [
      { id: "transformers", title: "שנאים", description: "מבנה, יחס ליפופים, הפסדים ונצילות.", mathConnections: ["יחסים", "אחוזים", "נוסחאות"] },
      { id: "motors", title: "מנועים חשמליים", description: "עקרונות פעולה, נתוני לוחית, מומנט ומהירות.", mathConnections: ["הספק", "יחידות", "אחוזים"] },
      { id: "generators", title: "גנרטורים", description: "עקרונות פעולה והמרת אנרגיה.", mathConnections: ["פיזיקה", "הספק"] },
      { id: "machine-protection", title: "הפעלה והגנה", description: "עומס, התחממות, הגנות ותחזוקה עיונית.", mathConnections: ["זרם", "הספק", "מדידות"] },
    ],
  },
  {
    id: "electrical-installations",
    categoryId: "installations",
    title: "מתקני חשמל",
    description: "מבנה מתקן, רכיבים, הגנות, חלוקה ותחזוקה.",
    status: "core",
    units: [
      { id: "installation-structure", title: "מבנה המתקן ורכיביו", description: "הזנה, לוחות, מעגלים, מוליכים ואביזרים.", mathConnections: ["יחידות", "קריאת שרטוט"] },
      { id: "earthing-protection", title: "הארקה והגנות", description: "עקרונות הארקה והגנה בפני חשמול.", mathConnections: ["תורת החשמל", "מדידות"] },
      { id: "loads-circuits", title: "עומסים וחלוקת מעגלים", description: "צרכנים, חלוקה, זרמים והספקים.", mathConnections: ["סכימה", "אלגברה", "אחוזים"] },
      { id: "inspection-maintenance", title: "בדיקה ותחזוקה", description: "עקרונות בדיקה, איתור תקלות ותיעוד.", mathConnections: ["מדידות", "דיווח טכני"] },
    ],
  },
  {
    id: "installation-design",
    categoryId: "installations",
    title: "תכנון מתקנים",
    description: "קריאת תוכניות, חישובים, תכנון ותיעוד.",
    status: "core",
    units: [
      { id: "plans-symbols", title: "קריאת תוכניות וסמלים", description: "תוכנית אדריכלית, שרטוט חשמלי ומקרא.", mathConnections: ["גיאומטריה", "קנה מידה"] },
      { id: "load-schedule", title: "טבלת עומסים", description: "רישום צרכנים וחלוקת עומסים.", mathConnections: ["סכימה", "כפל", "יחידות"] },
      { id: "design-calculations", title: "חישובי תכנון", description: "חישובים עקרוניים תוך הפניה לתקנים ולטבלאות מעודכנים.", mathConnections: ["נוסחאות", "אחוזים", "יחידות"] },
      { id: "design-documentation", title: "הפקת תוכנית ותיעוד", description: "סימון, מקרא, גרסאות ובדיקת שלמות.", mathConnections: ["טבלאות", "גרפים"] },
    ],
  },
  {
    id: "practical-electrical-work",
    categoryId: "installations",
    title: "עבודה מעשית בחשמל",
    description: "היכרות עם כלים, רכיבים, הרכבה ותרגול מבוקר.",
    status: "core",
    units: [
      { id: "tools-components", title: "כלים ורכיבים", description: "זיהוי, תפקידים ושימושים עיוניים.", mathConnections: ["יחידות", "קריאת סימונים"] },
      { id: "safe-wiring-lab", title: "תרגול חיווט במעבדה", description: "תרגול בסביבת לימוד מנותקת/מוגנת ובהשגחת מדריך בלבד.", mathConnections: ["קריאת שרטוט", "סדר פעולות"] },
      { id: "fault-scenarios", title: "תרחישי איתור תקלות", description: "ניתוח תקלות בסימולציה או בלוח לימודי בטוח.", mathConnections: ["לוגיקה", "מדידות", "טבלאות"] },
    ],
  },
  {
    id: "control-switching",
    categoryId: "automation",
    title: "מיתוג, פיקוד ובקרה",
    description: "מעגלי כוח ופיקוד, רכיבי מיתוג ורצפי פעולה.",
    status: "core",
    units: [
      { id: "control-components", title: "רכיבי פיקוד ומיתוג", description: "לחצנים, בוררים, ממסרים ומגענים.", mathConnections: ["לוגיקה", "סימונים"] },
      { id: "control-circuits", title: "מעגלי פיקוד", description: "הפעלה/עצירה, החזקה, נעילה והשהיה.", mathConnections: ["לוגיקה", "סדר פעולות"] },
      { id: "control-diagrams", title: "קריאת סכמות ואיתור שגיאות", description: "תרשימי כוח ופיקוד וניתוח תרחישים.", mathConnections: ["לוגיקה", "טבלאות"] },
    ],
  },
  {
    id: "plc",
    categoryId: "automation",
    title: "בקרים מתוכנתים (PLC)",
    description: "לוגיקה תעשייתית, כניסות/יציאות ותרגול בסיסי בסימולטור תוכנה לימודי ומבודד.",
    status: "core",
    units: [
      { id: "plc-architecture", title: "מבנה הבקר ומחזור סריקה", description: "CPU, ספק, כניסות, יציאות ומחזור סריקה.", mathConnections: ["ספירה", "זמן"] },
      { id: "plc-logic", title: "לוגיקה בוליאנית", description: "AND, OR, NOT ותרשימי Ladder.", mathConnections: ["לוגיקה", "טבלאות אמת"] },
      { id: "plc-functions", title: "טיימרים ומונים", description: "השהיות, ספירה, זיכרון ורצפים.", mathConnections: ["זמן", "מספרים שלמים"] },
      { id: "plc-simulation", title: "סימולציה וניפוי שגיאות", description: "בניית תנאי AND/OR/NOT ובדיקת יציאות בסימולטור תוכנה מבודד.", mathConnections: ["לוגיקה", "ניתוח תוצאות"] },
    ],
  },
  {
    id: "electrical-measurements",
    categoryId: "measurement",
    title: "מדידות במעבדת חשמל",
    description: "הכרת מכשירי מדידה, מדידות והשוואת תוצאות.",
    status: "core",
    units: [
      { id: "measurement-tools", title: "מכשירי מדידה", description: "מולטימטר, צבת זרם ומכשירים נוספים – עקרונות בלבד.", mathConnections: ["יחידות", "דיוק"] },
      { id: "measurement-circuits", title: "מדידת מעגלים", description: "מדידות במעגלי לימוד בטוחים ומבוקרים.", mathConnections: ["חוק אוהם", "חישובי מעגלים"] },
      { id: "measurement-analysis", title: "ניתוח תוצאות", description: "סטייה, השוואה בין חישוב למדידה והסקת מסקנות.", mathConnections: ["ממוצע", "אחוזים", "גרפים"] },
    ],
  },
  {
    id: "technical-reporting",
    categoryId: "measurement",
    title: "תיעוד ודיווח טכני",
    description: "כתיבת דוחות, טבלאות, ממצאים ומסקנות.",
    status: "core",
    units: [
      { id: "technical-records", title: "רישום נתונים", description: "תנאי בדיקה, יחידות, תאריך ומכשור.", mathConnections: ["טבלאות", "יחידות"] },
      { id: "technical-reports", title: "כתיבת דוח", description: "מטרה, שיטה, תוצאות, מסקנות והמלצות.", mathConnections: ["אחוזים", "גרפים", "עיגול"] },
    ],
  },
  {
    id: "safety",
    categoryId: "safety",
    title: "בטיחות וגיהות",
    description: "זיהוי סיכונים, מניעת תאונות והתנהלות בטוחה.",
    status: "core",
    units: [
      { id: "electrical-hazards", title: "סיכוני חשמל", description: "זיהוי סיכוני התחשמלות, כוויות ואש.", mathConnections: ["פיזיקה", "תורת החשמל"] },
      { id: "safe-work-principles", title: "עקרונות עבודה בטוחה", description: "ניתוק, מניעת חיבור מחדש ואימות היעדר מתח – לימוד עקרוני ובהכשרה מוסמכת בלבד.", mathConnections: ["סדר פעולות", "רשימות בדיקה"] },
      { id: "lab-safety", title: "בטיחות במעבדה", description: "ציוד מגן, השגחה, הרשאות ונהלי חירום.", mathConnections: ["מדידות", "תיעוד"] },
    ],
  },
  {
    id: "smart-home",
    categoryId: "extensions",
    title: "בית חכם",
    description: "מבוא למערכות שליטה, חיישנים ותרחישי אוטומציה; הרחבה לאימות מול הסילבוס.",
    status: "supplementary",
    units: [
      { id: "smart-home-basics", title: "עקרונות בית חכם", description: "רכיבים, תרחישים, תקשורת ובטיחות.", mathConnections: ["לוגיקה", "בקרה"] },
    ],
  },
  {
    id: "renewable-energy",
    categoryId: "extensions",
    title: "אנרגיות מתחדשות",
    description: "היכרות עם מערכות אנרגיה מתחדשת והתייעלות אנרגטית.",
    status: "supplementary",
    units: [
      { id: "renewable-basics", title: "מבוא לאנרגיה מתחדשת", description: "מושגים, רכיבים, תפוקה וצריכה.", mathConnections: ["הספק", "אנרגיה", "אחוזים"] },
    ],
  },
  {
    id: "first-aid-height-work",
    categoryId: "extensions",
    title: "עזרה ראשונה ועבודה בגובה",
    description: "מודעות והכרת עקרונות בלבד; הכשרה מעשית חייבת להתבצע אצל גורם מוסמך.",
    status: "supplementary",
    units: [
      { id: "first-aid-awareness", title: "מודעות לעזרה ראשונה", description: "זיהוי אירוע, הזעקת עזרה והיכרות עם נהלים.", mathConnections: [] },
      { id: "height-work-awareness", title: "מודעות לעבודה בגובה", description: "זיהוי סיכונים והבנת הצורך בהסמכה.", mathConnections: ["מדידות", "יחידות"] },
    ],
  },
];

export function getSubjectById(subjectId: string): SubjectDefinition | undefined {
  return subjectCatalog.find((subject) => subject.id === subjectId);
}

export function getSubjectsByCategory(categoryId: string): SubjectDefinition[] {
  return subjectCatalog.filter((subject) => subject.categoryId === categoryId);
}

export function getCategoryIdFromHash(hash: string): string | undefined {
  const categoryId = hash.startsWith("#") ? hash.slice(1) : hash;
  return subjectCategories.some((category) => category.id === categoryId)
    ? categoryId
    : undefined;
}

export function getSubjectUnit(subjectId: string, unitId: string): SubjectUnit | undefined {
  return getSubjectById(subjectId)?.units.find((unit) => unit.id === unitId);
}
