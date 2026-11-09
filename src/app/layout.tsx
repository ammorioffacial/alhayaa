import type { Metadata } from "next";
import "@fontsource-variable/noto-sans-arabic";
import "./globals.css";
import "./storefront.css";
import "./mobile-store.css";
export const metadata: Metadata = {
  title: "صيدلية حياة المجد | عناية تستحقينها",
  description:
    "متجر صيدلية حياة المجد للعناية بالبشرة والشعر والتجميل — بغداد، حي الجامعة.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
