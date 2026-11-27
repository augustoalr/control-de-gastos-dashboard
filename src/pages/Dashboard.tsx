import { useMemo, useState } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { api } from '../lib/api';
import { DATA_SOURCE } from '../lib/supabase';
import { formatAED, formatPct } from '../lib/money';
import { availableCents, spentPct, type Expense } from '../types';
import Sidebar from '../components/Sidebar';
import MonthSelector from '../components/MonthSelector';
import ExpenseChart from '../components/ExpenseChart';
import Donut from '../components/Donut';
import ExpenseTable from '../components/ExpenseTable';
import ExpenseForm from '../components/ExpenseForm';
import TopupForm from '../components/TopupForm';
import ReportPanel from '../components/ReportPanel';
import { CATEGORY_COLORS } from '../components/categoryColors';

// Página única del MVP. Estado de UI local (mes seleccionado, formularios);
// estado del servidor en useDashboard. El mes por defecto es noviembre,
// el último mes real (EXP5), como en la maqueta del diseñador.
export default function Dashboard() {
  const { data, loading, error, refresh } = useDashboard();
  const [selectedId, setSelectedId] = useState('m5');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showTopupForm, setShowTopupForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const month = useMemo(
    () => data?.months.find((m) => m.id === selectedId) ?? data?.months[data.months.length - 1],
    [data, selectedId],
  );

  if (loading) return <main className="main"><p>Cargando gastos…</p></main>;
  if (error || !data || !month) {
    return (
      <main className="main">
        <div className="error">{error ?? 'No hay datos.'}</div>
        <button className="btn" type="button" onClick={() => void refresh()}>Reintentar</button>
      </main>
    );
  }

  const pct = spentPct(month);
  const overBudget = pct > 100;

  async function run(fn: () => Promise<unknown>) {
    setActionError(null);
    setBusy(true);
    try {
      await fn();
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'La acción falló.');
    } finally {
      setBusy(false);
    }
  }

  function exportCsv() {
    if (!month) return;
    const rows = [['fecha', 'monto_aed', 'categoria']];
    for (const e of month.expenses) {
      rows.push([e.date, (e.amountCents / 100).toFixed(2).replace('.', ','), e.category]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gastos-${month.tab}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="layout">
      <Sidebar source={DATA_SOURCE === 'supabase' ? 'Supabase' : 'Local (seed.json)'} />
      <main className="main">
        <div className="topbar">
          <div>
            <h1>Panel — {month.label}</h1>
            <p>
              {month.tab} · {month.refNo} · {month.expenses.length} de 16 gastos
            </p>
          </div>
          <MonthSelector months={data.months} selectedId={month.id} onSelect={setSelectedId} />
        </div>

        {actionError && <div className="error">{actionError}</div>}

        <section className="kpis">
          <div className="card">
            <h3>Saldo total</h3>
            <div className={`big${month.saldoCents < 0 ? ' negative' : ' positive'}`}>
              {formatAED(month.saldoCents)}
            </div>
            {month.saldoCents < 0 && <div className="alert">Hace falta una recarga.</div>}
          </div>
          <div className="card">
            <h3>Total gastos</h3>
            <div className="big">{formatAED(month.totalCents)}</div>
            <div className="sub">Presupuesto del mes: {formatAED(availableCents(month))}</div>
          </div>
          <div className="card">
            <h3>Recarga del mes</h3>
            <div className="big">{formatAED(month.recargasCents)}</div>
            <div className="sub">Saldo inicial: {formatAED(month.openingCents)}</div>
          </div>
          <div className="card">
            <h3>% gastado del disponible</h3>
            <div className={`big${overBudget ? ' negative' : ''}`}>{formatPct(pct)}</div>
            <div className="sub">{overBudget ? 'Superado: gastaste más de lo disponible.' : 'Dentro de lo disponible.'}</div>
          </div>
        </section>

        <section className="grid-2">
          <div className="card">
            <h3>Gastos por mes · línea rosa = recarga</h3>
            <ExpenseChart months={data.months} selectedId={month.id} onSelect={setSelectedId} />
          </div>
          <div className="card">
            <h3>% gastado del disponible</h3>
            <Donut
              segments={[
                { label: 'Gastado', value: Math.min(pct, 100), color: overBudget ? '#F87171' : '#3B82F6' },
                { label: 'Disponible', value: Math.max(0, 100 - pct), color: '#1E2F4A' },
              ]}
              centerTop={formatPct(pct)}
              centerBottom="del disponible"
            />
          </div>
        </section>

        <section className="grid-2">
          <div className="card">
            <h3>Desglose por categoría</h3>
            <Donut
              segments={month.breakdown.map((b) => ({
                label: b.category,
                value: b.amountCents,
                color: CATEGORY_COLORS[b.category],
              }))}
              centerTop={formatAED(month.totalCents)}
              centerBottom="total del mes"
            />
            <p className="note">
              En julio-octubre el 100% fue Pantry &amp; Grocery. En noviembre,
              81,6% Pantry y 18,4% Other. Las categorías en 0,00 se muestran en gris, no se ocultan.
            </p>
          </div>
          <div className="card">
            <h3>Meta del mes</h3>
            <p style={{ fontSize: 15, lineHeight: 1.6 }}>
              No gastar más de lo disponible ({formatAED(availableCents(month))}).
            </p>
            <p className={overBudget ? 'alert' : ''}>
              {overBudget
                ? `Superada en ${formatAED(month.totalCents - availableCents(month))}.`
                : `Te quedan ${formatAED(availableCents(month) - month.totalCents)}.`}
            </p>
            <p className="note">
              No hay una meta con cifra fijada en la app original; si quieres una,
              se añade como campo del mes en Fase 2, sin inventarla.
            </p>
          </div>
        </section>

        <section className="card">
          <h3>Gastos — {month.label}</h3>
          <div className="actions">
            <button className="btn" type="button" onClick={() => { setEditing(null); setShowExpenseForm((v) => !v); }}>
              Añadir gasto
            </button>
            <button className="btn secondary" type="button" onClick={() => setShowTopupForm((v) => !v)}>
              Registrar recarga
            </button>
            <button className="btn secondary" type="button" disabled={busy} onClick={() => void run(() => api.createNextMonth())}>
              Crear mes nuevo
            </button>
            <button className="btn secondary" type="button" disabled={busy} onClick={() => void run(() => api.deleteLastMonth())}>
              Borrar último mes
            </button>
            <button className="btn secondary" type="button" onClick={exportCsv}>
              Descargar CSV del mes
            </button>
          </div>
          {(showExpenseForm || editing) && (
            <ExpenseForm
              monthId={month.id}
              monthLabel={month.label}
              editing={editing}
              onDone={() => { setShowExpenseForm(false); setEditing(null); void refresh(); }}
              onCancel={() => { setShowExpenseForm(false); setEditing(null); }}
            />
          )}
          {showTopupForm && (
            <TopupForm monthId={month.id} monthLabel={month.label} onDone={() => { setShowTopupForm(false); void refresh(); }} />
          )}
          <ExpenseTable
            expenses={month.expenses}
            onEdit={(e) => { setEditing(e); setShowExpenseForm(true); }}
            onDelete={(id) => void run(() => api.deleteExpense(id))}
          />
          <p className="note">
            {month.expenses.length} de 16 filas · {month.tab} · Los cambios en modo local se guardan
            en este navegador; en modo Supabase, en la base de datos.
          </p>
        </section>
      </main>
      <ReportPanel month={month} data={data} />
    </div>
  );
}
