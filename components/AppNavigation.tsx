"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Layers3, FlaskConical, ChartNoAxesCombined, Zap, ChevronLeft } from "lucide-react";

const items = [
  { href: "/", label: "מסך הבית", short: "בית", description: "תמונת מצב וקיצורי דרך", icon: Home, matches: (path: string) => path === "/" },
  { href: "/subjects", label: "מקצועות לימוד", short: "מקצועות", description: "מסלולים ויחידות לימוד", icon: Layers3, matches: (path: string) => path.startsWith("/subjects") },
  { href: "/math", label: "מתמטיקה לחשמל", short: "מתמטיקה", description: "תרגול והסברים אישיים", icon: BookOpen, matches: (path: string) => path.startsWith("/math") },
  { href: "/labs", label: "מעבדות וסימולטורים", short: "מעבדות", description: "למידה מעשית ואינטראקטיבית", icon: FlaskConical, matches: (path: string) => path.startsWith("/labs") },
  { href: "/progress", label: "ההתקדמות שלי", short: "התקדמות", description: "מעקב אחר הלמידה", icon: ChartNoAxesCombined, matches: (path: string) => path.startsWith("/progress") },
];

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return <>{items.map(({ href, label, short, description, icon: Icon, matches }) => {
    const active = matches(pathname);
    return <Link key={href} href={href} className={[`appNavItem`, active ? "active" : "", mobile ? "mobile" : ""].filter(Boolean).join(" ")} aria-current={active ? "page" : undefined}>
      <span className="appNavItemIcon"><Icon size={mobile ? 20 : 19} strokeWidth={2} /></span>
      <span className="appNavItemCopy"><strong>{mobile ? short : label}</strong>{!mobile && <small>{description}</small>}</span>
      {!mobile && <ChevronLeft className="appNavChevron" size={16} />}
    </Link>;
  })}</>;
}

export function AppNavigation() {
  return <>
    <a className="skipToContent" href="#main-content">דלג לתוכן</a>
    <aside className="appSidebar" dir="rtl" aria-label="סרגל ניווט ראשי">
      <Link href="/" className="appSidebarBrand" aria-label="ספארקי — מסך הבית">
        <span className="appSidebarLogo"><Zap size={23} fill="currentColor" /></span>
        <span><strong>ספארקי</strong><small>מרכז הלמידה לחשמל</small></span>
      </Link>
      <div className="appSidebarSectionLabel">סביבת הלמידה</div>
      <nav className="appSidebarNav" aria-label="ניווט ראשי"><NavigationLinks /></nav>
      <div className="appSidebarBottom">
        <div className="appSidebarSpark">⚡</div>
        <div><strong>לומדים צעד אחר צעד</strong><span>בלי מבחן כניסה ובלי לחץ</span></div>
      </div>
    </aside>
    <header className="appMobileHeader" dir="rtl">
      <Link href="/" className="appMobileBrand"><span>⚡</span><strong>ספארקי</strong></Link>
      <span>מרכז הלמידה לחשמל</span>
    </header>
    <nav className="appMobileNav appUnifiedMobileNav" dir="rtl" aria-label="ניווט ראשי"><NavigationLinks mobile /></nav>
  </>;
}
