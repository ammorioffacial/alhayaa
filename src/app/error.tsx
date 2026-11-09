"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="empty">
      <h1>تعذر تحميل الصفحة</h1>
      <p>يرجى المحاولة مرة أخرى.</p>
      <button className="primary" onClick={reset}>
        إعادة المحاولة
      </button>
    </main>
  );
}
