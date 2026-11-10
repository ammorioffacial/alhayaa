import type { Metadata } from "next";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
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
