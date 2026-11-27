import { formatAED, formatDateEs } from '../lib/money';
import type { DashboardData, Month } from '../types';
import { CATEGORY_COLORS } from './categoryColors';
import TopAcumulado from './TopAcumulado';

export default function ReportPanel({ month, data }: { month: Month; data: DashboardData }) {
  return (
    <aside className="right-panel">
      <TopAcumulado monthId={month.id} monthLabel={month.label} />
      <h2 style={{ marginTop: 24 }}>Desglose — {month.label}</h2>
      {month.breakdown.map((b) => (
        <div key={b.category} className="breakdown-row">
          <span>
            <span className="dot" style={{ background: CATEGORY_COLORS[b.category] }} />
            {b.category}
          </span>
          <span>{formatAED(b.amountCents)}</span>
        </div>
      ))}
      <div className="breakdown-row">
        <span>Saldo inicial</span>
        <span>{formatAED(month.openingCents)}</span>
      </div>
      <div className="breakdown-row">
        <span>Recarga del mes</span>
        <span>{formatAED(month.recargasCents)}</span>
      </div>

      <h2 style={{ marginTop: 24 }}>Report acumulado</h2>
      <div className="breakdown-row">
        <span>Recibos</span>
        <span>{formatAED(data.report.totalReceiptsCents)}</span>
      </div>
      <div className="breakdown-row">
        <span>Gastos</span>
        <span>{formatAED(data.report.totalBillsCents)}</span>
      </div>
      <div className="breakdown-row">
        <span>Saldo</span>
        <span className={data.report.balanceCents < 0 ? 'alert' : ''}>
          {formatAED(data.report.balanceCents)}
        </span>
      </div>
      {data.report.rows.map((r, i) => (
        <div key={`${r.date}-${i}`} className="report-row">
          <span>
            {formatDateEs(r.date)} · {r.description}
          </span>
          <span>{formatAED(r.runningCents)}</span>
        </div>
      ))}
      <p className="note" style={{ marginTop: 16 }}>
        Exportar Excel / PDF: en el MVP se exporta CSV desde el navegador.
        La exportación idéntica a la hoja (7 pestañas, fórmulas) es Fase 2,
        con una Edge Function de Supabase (ver README).
      </p>
    </aside>
  );
}
