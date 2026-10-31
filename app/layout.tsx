import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import { AppNavigation } from "../components/AppNavigation";
import { AppNavigation } from "../components/AppNavigation";

export const metadata: Metadata = {
  title: "מתמטיקה לחשמלאי מוסמך",
  description: "מורה פרטי אינטראקטיבי למתמטיקה לקראת לימודי חשמלאי מוסמך",
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="he" dir="rtl"><body><AppNavigation />{children}</body></html>;
}