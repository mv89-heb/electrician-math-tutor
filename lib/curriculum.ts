export type Exercise = {
  id: string;
  topic: string;
  level: number;
  title: string;
  prompt: string;
  accepted: string[];
  hint1: string;
  hint2: string;
  explanation: string;
  next?: string;
};

export const curriculum: Exercise[] = [
  {
    id:"formula-1", topic:"אלגברה ושינוי נושא נוסחה", level:1,
    title:"בידוד משתנה",
    prompt:"נתונה הנוסחה V = I × R. בידוד את R. כתוב את הנוסחה החדשה כאשר R נמצא לבד.",
    accepted:["r=v/i","r = v / i","r=v÷i","r = v ÷ i","v/i"],
    hint1:"R מוכפל ב־I. איזו פעולה הפוכה לכפל תאפשר לנו לבטל את I?",
    hint2:"חלק את שני אגפי המשוואה באותו I. מה נשאר באגף של R?",
    explanation:"מחלקים את שני אגפי המשוואה ב־I: V / I = R. לכן R = V / I.",
    next:"formula-2"
  },
  {
    id:"formula-2", topic:"אלגברה ושינוי נושא נוסחה", level:2,
    title:"שינוי נושא עם מספר",
    prompt:"נתונה הנוסחה P = V × I. בידוד את I.",
    accepted:["i=p/v","i = p / v","i=p÷v","i = p ÷ v","p/v"],
    hint1:"I מוכפל ב־V. איזו פעולה מבטלת כפל ב־V?",
    hint2:"חלק את שני אגפי המשוואה ב־V.",
    explanation:"P / V = I, ולכן I = P / V.",
    next:"ohm-1"
  },
  {
    id:"ohm-1", topic:"חוק אוהם", level:3,
    title:"מנוסחה לחישוב חשמלי",
    prompt:"נגד של 10Ω מחובר למתח של 20V. לפי חוק אוהם I = V / R, מה הזרם במעגל?",
    accepted:["2","2a","2 אמפר","2a."],
    hint1:"הצב V=20 ו־R=10 בנוסחה I = V / R.",
    hint2:"20 חלקי 10 שווה ל־?",
    explanation:"I = 20 / 10 = 2A. הזרם הוא 2 אמפר.",
    next:"power-1"
  },
  {
    id:"power-1", topic:"הספק חשמלי", level:4,
    title:"חישוב הספק",
    prompt:"מכשיר פועל במתח של 230V וזורם בו זרם של 2A. לפי P = V × I, מה ההספק?",
    accepted:["460","460w","460 וואט","460w."],
    hint1:"הצב V=230 ו־I=2 בנוסחה P = V × I.",
    hint2:"חשב 230 כפול 2.",
    explanation:"P = 230 × 2 = 460W. ההספק הוא 460 וואט.",
    next:"formula-3"
  },
  {
    id:"formula-3", topic:"אלגברה ושינוי נושא נוסחה", level:3,
    title:"נוסחה עם ריבוע",
    prompt:"נתונה הנוסחה P = V² / R. בידוד את R.",
    accepted:["r=v^2/p","r = v^2 / p","r=v²/p","r = v² / p"],
    hint1:"R נמצא במכנה. כדי לבטל את המכנה, אפשר להכפיל את שני האגפים ב־R.",
    hint2:"לאחר הכפל ב־R מתקבל P×R = V². עכשיו באיזו פעולה מבודדים את R?",
    explanation:"P×R = V², ולכן R = V² / P.",
    next:"trig-1"
  },
  {
    id:"trig-1", topic:"טריגונומטריה בסיסית", level:4,
    title:"היכרות עם טנגנס",
    prompt:"במשולש ישר־זווית, מול זווית α יש ניצב באורך 3 ס״מ ולידה ניצב באורך 4 ס״מ. מהו tan(α)?",
    accepted:["0.75","3/4","0.75."],
    hint1:"tan(α) = ניצב מול / ניצב ליד.",
    hint2:"חשב 3 חלקי 4.",
    explanation:"tan(α) = 3/4 = 0.75.",
    next:"scientific-1"
  },
  {
    id:"scientific-1", topic:"כתיבה מדעית", level:2,
    title:"כתיבה מדעית",
    prompt:"כתוב 0.00047 בכתיבה מדעית.",
    accepted:["4.7e-4","4.7×10^-4","4.7 x 10^-4","4.7*10^-4","4.7·10^-4"],
    hint1:"הזז את הנקודה העשרונית עד שנשאר מספר בין 1 ל־10.",
    hint2:"הנקודה זזה 4 מקומות ימינה, לכן החזקה של 10 תהיה שלילית.",
    explanation:"0.00047 = 4.7 × 10⁻⁴.",
    next:"percent-1"
  },
  {
    id:"percent-1", topic:"יחס ואחוזים", level:2,
    title:"אחוזים בחשמל",
    prompt:"עומס של 800W גדל ב־10%. מה ההספק החדש?",
    accepted:["880","880w","880 וואט"],
    hint1:"10% מתוך 800 הוא 80.",
    hint2:"הוסף את 80 להספק המקורי.",
    explanation:"10% × 800 = 80, ולכן 800 + 80 = 880W.",
    next:"equation-1"
  },
  {
    id:"equation-1", topic:"משוואות", level:3,
    title:"משוואה עם משתנה",
    prompt:"פתור: 3x + 6 = 21. מה הערך של x?",
    accepted:["5","5."],
    hint1:"קודם בטל את ה־6. איזו פעולה הפוכה לחיבור 6?",
    hint2:"אחרי שתקבל 3x = 15, מה צריך לעשות כדי למצוא את x?",
    explanation:"3x = 21 − 6 = 15, ולכן x = 15 / 3 = 5."
  }
];

export const firstExercise = curriculum[0];