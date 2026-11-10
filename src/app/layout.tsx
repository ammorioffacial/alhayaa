import type { Metadata } from "next";
import "@fontsource/zain/400.css";
import "@fontsource/zain/700.css";
import "@fontsource/zain/800.css";
import "./globals.css";
import "./storefront.css";
import "../components/storefront/product-experience.css";
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
