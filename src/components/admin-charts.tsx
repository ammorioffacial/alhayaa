// Dependency-free charts for the admin dashboard: bars, columns and a donut.
const digits = new Intl.NumberFormat("en-US");
export function HorizontalBars({
  rows,
  label,
}: {
  rows: { label: string; value: number }[];
  label: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="dash-bars" aria-label={label}>
      {rows.map((row) => (
        <li key={row.label}>
          <div className="dash-bar-head">
            <span>{row.label}</span>
            <strong>{digits.format(row.value)}</strong>
          </div>
          <div className="dash-bar-track" aria-hidden="true">
            <span style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
export function ColumnChart({
  columns,
  label,
}: {
  columns: { label: string; value: number }[];
  label: string;
}) {
  const max = Math.max(1, ...columns.map((c) => c.value));
  return (
    <div
      className="dash-columns"
      role="img"
      aria-label={label}
      style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
    >
      {columns.map((c) => (
        <div className="dash-column" key={c.label}>
          <span className="dash-column-value">{digits.format(c.value)}</span>
          <div className="dash-column-track" aria-hidden="true">
            <span style={{ height: `${(c.value / max) * 100}%` }} />
          </div>
          <span className="dash-column-label">{c.label}</span>
        </div>
      ))}
    </div>
  );
}
export function Donut({
  parts,
  label,
}: {
  parts: { label: string; value: number; color: string }[];
  label: string;
}) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="dash-donut">
      <svg viewBox="0 0 120 120" width="150" height="150" role="img" aria-label={label}>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#eef2f6" strokeWidth="16" />
        {total > 0 &&
          parts.map((part) => {
            const length = (part.value / total) * circumference;
            const segment = (
              <circle
                key={part.label}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={part.color}
                strokeWidth="16"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 60 60)"
              />
            );
            offset += length;
            return segment;
          })}
        <text x="60" y="66" textAnchor="middle" className="dash-donut-total">
          {digits.format(total)}
        </text>
      </svg>
      <ul className="dash-legend">
        {parts.map((part) => (
          <li key={part.label}>
            <span className="dash-swatch" style={{ background: part.color }} aria-hidden="true" />
            <span>{part.label}</span>
            <strong>{digits.format(part.value)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
