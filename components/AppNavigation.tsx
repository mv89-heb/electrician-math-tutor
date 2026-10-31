"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
const items=[["/","בית","⌂"],["/subjects","מקצועות","▦"],["/math","מתמטיקה","∑"],["/subjects/electrical-theory/electrical-quantities","מעבדות","⚡"],["/subjects/plc/plc-logic","PLC","▣"]];
export function AppNavigation(){
 const path=usePathname();
 return <header className="appNav" dir="rtl"><Link href="/" className="appBrand"><b>⚡</b><span><strong>ספארקי</strong><small>לומדים חשמל חכם</small></span></Link><nav aria-label="ניווט ראשי">{items.map(([href,label,icon])=><Link key={href} href={href} aria-current={path===href||(href!=="/"&&path.startsWith(href))?"page":undefined} className={path===href||(href!=="/"&&path.startsWith(href))?"appNavItem active":"appNavItem"}><i aria-hidden="true">{icon}</i>{label}</Link>)}</nav><Link href="/subjects" className="appNavAction">בחירת מסלול ←</Link></header>;
}
