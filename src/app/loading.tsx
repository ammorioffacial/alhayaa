export default function Loading() {
  return (
    <main className="page-state loading" role="status" aria-live="polite">
      <span className="loading-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <p>جارٍ تجهيز لحظات العناية…</p>
    </main>
  );
}
