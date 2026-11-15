import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
 title: "MORIYATI ERP | اتاق فرمان کارخانه",
 description: "سامانهٔ عملیات کارخانهٔ موریاتی؛ ردیابی بچ، موجودی، ابزار و هویت محصول.",
 icons: { icon: "/favicon.svg" }
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
 return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}
