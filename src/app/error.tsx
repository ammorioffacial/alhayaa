"use client";
import { RefreshCw, WifiOff } from "lucide-react";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="page-state empty">
      <span className="page-state-icon">
        <WifiOff size={32} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h1>تعذر تحميل الصفحة</h1>
      <p>تحقق من اتصالك بالإنترنت ثم حاول مرة أخرى.</p>
      <button className="primary" onClick={reset}>
        <RefreshCw size={18} aria-hidden="true" />
        إعادة المحاولة
      </button>
    </main>
  );
}
