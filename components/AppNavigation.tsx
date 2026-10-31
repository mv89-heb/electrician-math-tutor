"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Layers3 } from "lucide-react";

const items = [
  { href: "/", label: "ראשי", short: "בית", icon: Home, matches: (path: string) => path === "/" },
  { href: "/subjects", label: "מקצועות", short: "מקצועות", icon: Layers3, matches: (path: string) => path.startsWith("/subjects") },
  { href: "/math", label: "תרגול מתמטיקה", short: "מתמטיקה", icon: BookOpen, matches: (path: string) => path.startsWith("/math") },
];

export function AppNavigation() {
  const pathname = usePathname();
  return (
    <>
      <a className="skipToContent" href="#main-content">דלג לתוכן</a>
      <header className="appTopbar" dir="rtl">
        <Link href="/" className="appBrand" aria-label="ספארקי — מעבר למסך הבית">
          <span className="appBrandMark" aria-hidden="true">⚡</span>
          <span><strong>ספארקי</strong><small>לומדים חשמל. מבינים באמת.</small></span>
        </Link>
        <nav className="appPrimaryNav" aria-label="ניווט ראשי">
          {items.map(({ href, label, icon: Icon, matches }) => {
            const active = matches(pathname);
            return <Link key={href} href={href} className={active ? "appNavLink active" : "appNavLink"} aria-current={active ? "page" : undefined}>
              <Icon size={18} strokeWidth={2.1} /><span>{label}</span>
            </Link>;
          })}
        </nav>
        <span className="appTopbarNote">סביבת הלמידה שלך</span>
      </header>
      <nav className="appMobileNav" aria-label="ניווט ראשי">
        {items.map(({ href, short, icon: Icon, matches }) => {
          const active = matches(pathname);
          return <Link key={href} href={href} className={active ? "appMobileNavLink active" : "appMobileNavLink"} aria-current={active ? "page" : undefined}>
            <Icon size={20} /><span>{short}</span>
          </Link>;
        })}
      </nav>
    </>
  );
}
