/* eslint-disable @next/next/no-img-element */
/* Full navigation ensures the catalog is refreshed after admin changes. */
/* eslint-disable @next/next/no-html-link-for-pages */
export default function Brand() {
  return (
    <a href="/" className="brand" aria-label="صيدلية حياة المجد، الرئيسية">
      <img
        src={process.env.NEXT_PUBLIC_LOGO_URL || "/logo.png"}
        alt="شعار صيدلية حياة المجد"
      />
      <span className="brand-wordmark">
        <strong>صيدلية حياة المجد</strong>
        <small>HAYAT ALMAJD PHARMACY</small>
      </span>
    </a>
  );
}
