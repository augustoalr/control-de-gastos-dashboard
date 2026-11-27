import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatAED } from '../lib/money';
import type { TopSpender, TopView } from '../types';

// Top acumulado, a un lado (panel derecho). Dos vistas con cambio:
// "Mes" = mes seleccionado, "Total" = acumulado de todos los meses.
// Solo muestra totales, nunca el detalle gasto a gasto de otra persona.
// El drill-down (tocar un nombre para ver sus gastos) solo está activo
// cuando el rol lo permite (admin/manager); un viewer o un member nunca
// ve el detalle de otros.
export default function TopAcumulado({
  monthId,
  monthLabel,
  canDrillDown = false,
  onSelectUser,
}: {
  monthId: string;
  monthLabel: string;
  canDrillDown?: boolean;
  onSelectUser?: (userId: string, name: string) => void;
}) {
  const [view, setView] = useState<TopView>('month');
  const [rows, setRows] = useState<TopSpender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getTopSpenders(view === 'month' ? monthId : null, 10)
      .then((r) => {
        if (!cancelled) setRows(r);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'No se pudo cargar el Top.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [view, monthId]);

  const total = rows.reduce((s, r) => s + r.totalCents, 0);
  const max = Math.max(1, ...rows.map((r) => r.totalCents));

  return (
    <section aria-label="Top acumulado de gastos">
      <h2>Top acumulado</h2>
      <div className="month-selector" style={{ marginBottom: 8 }}>
        <button
          type="button"
          className={`month-btn${view === 'month' ? ' active' : ''}`}
          onClick={() => setView('month')}
        >
          Mes · {monthLabel}
        </button>
        <button
          type="button"
          className={`month-btn${view === 'total' ? ' active' : ''}`}
          onClick={() => setView('total')}
        >
          Total
        </button>
      </div>

      {loading && <p className="muted">Cargando Top…</p>}
      {error && <div className="error">{error}</div>}
      {!loading && !error && rows.length === 0 && (
        <p className="muted">Sin gastos en esta vista.</p>
      )}
      {!loading &&
        !error &&
        rows.map((r, i) => {
          const pct = total > 0 ? (r.totalCents / total) * 100 : 0;
          const clickable = canDrillDown && !!onSelectUser && !r.isYou;
          const inner = (
            <>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span>
                  <strong>{i + 1}. {r.name}</strong>
                  {r.isYou ? ' · tú' : ''}
                </span>
                <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
                  {formatAED(r.totalCents)}
                </span>
              </span>
              <span
                style={{
                  display: 'block', height: 8, borderRadius: 4,
                  background: '#1E2F4A', marginTop: 6, overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    display: 'block', height: '100%',
                    width: `${(r.totalCents / max) * 100}%`,
                    background: i === 0 ? '#EC4899' : '#3B82F6',
                  }}
                />
              </span>
              <span className="muted" style={{ fontSize: 12 }}>
                {pct.toLocaleString('es-ES', { maximumFractionDigits: 1 })}% del total · {r.expenseCount} gastos
                {clickable ? ' · toca para ver sus gastos' : ''}
              </span>
            </>
          );
          if (clickable) {
            return (
              <button
                key={r.userId}
                type="button"
                title={`Ver los gastos de ${r.name}`}
                onClick={() => onSelectUser?.(r.userId, r.name)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 8px', background: 'transparent',
                  border: '1px solid transparent', borderRadius: 10,
                  cursor: 'pointer', color: 'inherit', font: 'inherit',
                }}
              >
                {inner}
              </button>
            );
          }
          return (
            <div
              key={r.userId}
              style={{ width: '100%', textAlign: 'left', padding: '10px 8px' }}
            >
              {inner}
            </div>
          );
        })}
      <p className="note">
        En local solo está Augusto (datos de ejemplo). En Supabase, aquí salen
        tus subordinados visibles, ordenados por acumulado.
      </p>
    </section>
  );
}
