import type { Metadata } from "next";
import "./globals.css";
import { AppNavigation } from "../components/AppNavigation";

export const metadata: Metadata = {
  title: "ספארקי | מרכז הלמידה לחשמלאי מוסמך",
  description: "סביבת למידה אינטראקטיבית לחשמלאי מוסמך: מקצועות לימוד, מתמטיקה, מעבדות ומעקב התקדמות.",
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="he" dir="rtl"><body><AppNavigation /><div id="main-content" tabIndex={-1}>{children}</div></body></html>;
}