"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  ChartNoAxesCombined,
  FlaskConical,
  GraduationCap,
  Home,
  Layers3,
} from "lucide-react";

const items = [
  { href: "/", label: "מסך הבית", short: "בית", description: "מרכז הלמידה", icon: Home, matches: (path: string) => path === "/" },
  { href: "/subjects", label: "מקצועות לימוד", short: "מקצועות", description: "תוכנית הלימודים והיחידות", icon: GraduationCap, matches: (path: string) => path.startsWith("/subjects") },
  { href: "/math", label: "מתמטיקה", short: "מתמטיקה", description: "תרגול אישי והסברים", icon: BookOpen, matches: (path: string) => path.startsWith("/math") },
  { href: "/labs", label: "מעבדות וסימולציות", short: "מעבדות", description: "התנסות אינטראקטיבית", icon: FlaskConical, matches: (path: string) => path.startsWith("/labs") },
  { href: "/progress", label: "ההתקדמות שלי", short: "התקדמות", description: "מעקב אחר הלמידה", icon: ChartNoAxesCombined, matches: (path: string) => path.startsWith("/progress") },
];

export function AppNavigation() {
  const pathname = usePathname();
  return (
    <>
      <a className="skipToContent" href="#main-content">דלג לתוכן</a>
      <aside className="appSidebar" dir="rtl" aria-label="תפריט ראשי">
        <Link href="/" className="appBrand" aria-label="ספארקי — מעבר למסך הבית">
          <span className="appBrandMark" aria-hidden="true">⚡</span>
          <span><strong>ספארקי</strong><small>לומדים חשמל. מבינים באמת.</small></span>
        </Link>
        <div className="appSidebarCaption">סביבת הלמידה</div>
        <nav className="appSidebarNav" aria-label="ניווט ראשי">
          {items.map(({ href, label, description, icon: Icon, matches }) => {
            const active = matches(pathname);
            return (
              <Link key={href} href={href} className={active ? "appSidebarLink active" : "appSidebarLink"} aria-current={active ? "page" : undefined}>
                <span className="appSidebarIcon"><Icon size={19} strokeWidth={2} /></span>
                <span className="appSidebarText"><strong>{label}</strong><small>{description}</small></span>
                {active && <span className="appSidebarIndicator" aria-hidden="true" />}
              </Link>
            );
          })}
        </nav>
        <div className="appSidebarFooter">
          <span className="appSidebarFooterIcon"><Activity size={18}/></span>
          <div><strong>מתקדמים צעד אחר צעד</strong><small>הלמידה נשמרת בקצב שלך</small></div>
        </div>
      </aside>
      <header className="appTopbar" dir="rtl">
        <Link href="/" className="appTopbarBrand" aria-label="ספארקי — מסך הבית"><span className="appBrandMark">⚡</span><strong>ספארקי</strong></Link>
        <div className="appTopbarContext">
          <span className="appTopbarPulse" />
          <span>סביבת הלמידה שלך</span>
        </div>
        <Link href="/subjects" className="appTopbarAction"><Layers3 size={16}/> לכל מקצועות הלימוד</Link>
      </header>
      <nav className="appMobileNav" aria-label="ניווט ראשי">
        {items.map(({ href, short, icon: Icon, matches }) => {
          const active = matches(pathname);
          return <Link key={href} href={href} className={active ? "appMobileNavLink active" : "appMobileNavLink"} aria-current={active ? "page" : undefined}>
            <Icon size={20} strokeWidth={active ? 2.5 : 1.9} /><span>{short}</span>
          </Link>;
        })}
      </nav>
    </>
  );
}
