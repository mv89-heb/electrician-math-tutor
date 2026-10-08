import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "מתמטיקה לחשמלאי מוסמך",
  description: "מורה פרטי אינטראקטיבי למתמטיקה לקראת לימודי חשמלאי מוסמך",
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="he" dir="rtl"><body>{children}</body></html>;
}