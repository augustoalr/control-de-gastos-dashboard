// Donut SVG sin dependencias. Los segmentos en 0 se muestran en gris
// en la leyenda (no se ocultan), como pidió el diseñador.
export interface DonutSegment {
  label: string;
  value: number; // 0-100 o céntimos; se normaliza por el total
  color: string;
}

export default function Donut({
  segments,
  centerTop,
  centerBottom,
  size = 150,
}: {
  segments: DonutSegment[];
  centerTop: string;
  centerBottom: string;
  size?: number;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 62;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="donut-row">
      <svg width={size} height={size} viewBox="0 0 150 150" role="img" aria-label={centerTop}>
        <circle cx="75" cy="75" r={r} fill="none" stroke="#1E2F4A" strokeWidth="18" />
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s) => {
              const frac = s.value / total;
              const dash = frac * c;
              const el = (
                <circle
                  key={s.label}
                  cx="75"
                  cy="75"
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="18"
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 75 75)"
                />
              );
              offset += dash;
              return el;
            })}
        <text x="75" y="72" textAnchor="middle" fill="#EAF0F8" fontSize="22" fontWeight="800">
          {centerTop}
        </text>
        <text x="75" y="92" textAnchor="middle" fill="#8A9BB3" fontSize="11">
          {centerBottom}
        </text>
      </svg>
      <div>
        {segments.map((s) => (
          <div key={s.label} className="breakdown-row" style={{ minWidth: 180 }}>
            <span>
              <span className="dot" style={{ background: s.color }} />
              {s.label}
            </span>
            <span>{total > 0 ? `${((s.value / total) * 100).toLocaleString('es-ES', { maximumFractionDigits: 1 })}%` : '0%'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
