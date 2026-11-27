import { formatAEDShort } from '../lib/money';
import type { Month } from '../types';

// Barras de gastos por mes + recarga en rosa debajo de cada mes.
// Sin librería de gráficos: SVG/divs nativos, ligero para GitHub Pages.
export default function ExpenseChart({
  months,
  selectedId,
  onSelect,
}: {
  months: Month[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const max = Math.max(1, ...months.map((m) => m.totalCents));
  return (
    <div>
      <div className="chart-bars">
        {months.map((m) => (
          <div key={m.id} className="bar-col">
            <span className="bar-value">{formatAEDShort(m.totalCents)}</span>
            <div className="bar-wrap">
              <div
                className={`bar${m.id === selectedId ? ' selected' : ''}`}
                style={{ height: `${Math.max(4, (m.totalCents / max) * 100)}%` }}
                title={`${m.label}: gastos ${formatAEDShort(m.totalCents)} AED, recarga ${formatAEDShort(m.recargasCents)} AED`}
                onClick={() => onSelect(m.id)}
                role="button"
                aria-label={m.label}
              />
            </div>
            <span className="bar-label">{m.shortLabel}</span>
            <span className="bar-value" style={{ color: '#EC4899' }}>
              +{formatAEDShort(m.recargasCents)}
            </span>
          </div>
        ))}
      </div>
      <div className="legend">
        <span><span className="dot" style={{ background: '#3B82F6' }} />Gastos</span>
        <span><span className="dot" style={{ background: '#EC4899' }} />Recarga</span>
      </div>
    </div>
  );
}
