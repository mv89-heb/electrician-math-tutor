import Link from "next/link";
import { ArrowLeft, Activity, CircuitBoard, Cpu, Zap } from "lucide-react";

const labs = [
 {href:"/subjects/electrical-theory/electrical-quantities",icon:Zap,title:"חוק אוהם וגדלים חשמליים",description:"מתח, זרם והתנגדות — חקירת הקשר בין הגדלים באמצעות מעבדה אינטראקטיבית.",tag:"תורת החשמל"},
 {href:"/subjects/electrical-theory/dc-circuits",icon:CircuitBoard,title:"מעגלי זרם ישר",description:"בניית הבנה של חיבור טורי ומקבילי וניתוח התנהגות המעגל.",tag:"תורת החשמל"},
 {href:"/subjects/plc/plc-simulation",icon:Cpu,title:"למידה ותרגול PLC",description:"בחר כניסות דיגיטליות, בנה תנאי AND/OR/NOT וצפה בזמן אמת בתהליך הלוגיקה ובשתי יציאות וירטואליות.",tag:"בקרים מתוכנתים"},
];
export default function LabsPage(){return <main className="labsPage" dir="rtl"><header className="labsHeader"><span><Activity size={15}/> למידה מעשית</span><h1>מעבדות וסימולציות</h1><p>לומדים דרך התנסות, בדיקת תרחישים והבנת התוצאות — בסביבה לימודית בטוחה.</p></header><section className="labsGrid">{labs.map(({href,icon:Icon,title,description,tag})=><Link className="labsCard" href={href} key={href}><div className="labsCardIcon"><Icon size={25}/></div><span className="labsTag">{tag}</span><h2>{title}</h2><p>{description}</p><span className="labsAction">כניסה ליחידה <ArrowLeft size={17}/></span></Link>)}</section><p className="labsSafety">הסימולציות מיועדות ללמידה בלבד. אין לבצע עבודה או מדידות במתקן חשמלי חי במסגרת התרגול.</p></main>}
